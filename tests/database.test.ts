import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
let db: PGlite;
const buyer = "30000000-0000-4000-8000-000000000001";
const other = "30000000-0000-4000-8000-000000000002";
const admin = "30000000-0000-4000-8000-000000000003";
const product = "20000000-0000-4000-8000-000000000001";
const variant = "40000000-0000-4000-8000-000000000001";
const category = "10000000-0000-4000-8000-000000000001";
const customer = {
  name: "Test User",
  phone: "+992901234567",
  city: "Dushanbe",
  address: "Test street",
  delivery: "delivery",
  comment: "",
};
async function as(role: string, id: string | null) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id || "",
  ]);
  await db.exec("set role " + role);
}
async function place(
  request: string,
  quantity = 1,
  total = 10000,
  variantId: string | null = null,
) {
  return db.query<{ result: { id: string; number: number } }>(
    "select public.place_order($1::jsonb,$2::jsonb,$3::uuid,$4::bigint) result",
    [
      JSON.stringify(customer),
      JSON.stringify([
        { product_id: product, variant_id: variantId, quantity },
      ]),
      request,
      total,
    ],
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,phone text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;`,
  );
  // PGlite uses PostgreSQL builtin gen_random_uuid; pgcrypto package isn't needed by this schema.
  for (const name of readdirSync("supabase/migrations")
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    await db.exec(
      readFileSync(`supabase/migrations/${name}`, "utf8").replace(
        "create extension if not exists pgcrypto;",
        "",
      ),
    );
  }
  await db.query(
    "insert into auth.users(id,phone) values($1,$4),($2,$4),($3,$4)",
    [buyer, other, admin, "992901234567"],
  );
  await db.query("insert into private.admins values($1)", [admin]);
  await db.query(
    `insert into public.categories(id,slug,name) values($1,'home','{"tj":"Хона","ru":"Дом"}');`,
    [category],
  );
  await db.query(
    `insert into public.products(id,slug,name,category_id,price_minor,capacity,stock,published) values($1,'test','{"tj":"Test","ru":"Test"}',$2,10000,30,10,true)`,
    [product, category],
  );
  await db.query(
    `insert into public.product_variants(id,product_id,name,price_minor,stock) values($1,$2,'{"tj":"V","ru":"V"}',15000,5)`,
    [variant, product],
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
it("anonymous users read published products and cannot access customers or mutate products", async () => {
  await as("anon", null);
  expect((await db.query("select * from public.products")).rows).toHaveLength(
    1,
  );
  await expect(db.query("select * from public.profiles")).rejects.toThrow();
  await expect(
    db.query("update public.products set stock=0"),
  ).rejects.toThrow();
  await expect(place(crypto.randomUUID())).rejects.toThrow();
});
it("orders are atomic and retry-safe", async () => {
  await as("authenticated", buyer);
  const key = crypto.randomUUID();
  const first = (await place(key)).rows[0].result;
  const second = (await place(key)).rows[0].result;
  expect(first).toEqual(second);
  expect(
    (await db.query<{ stock: number }>("select stock from public.products"))
      .rows[0].stock,
  ).toBe(9);
  expect((await db.query("select * from public.orders")).rows).toHaveLength(1);
});
it("does not accept a forged price or oversell and rolls back stock", async () => {
  await as("authenticated", buyer);
  await expect(place(crypto.randomUUID(), 1, 1)).rejects.toThrow(
    "price changed",
  );
  await expect(place(crypto.randomUUID(), 99, 990000)).rejects.toThrow(
    "stock unavailable",
  );
  expect(
    (await db.query<{ stock: number }>("select stock from public.products"))
      .rows[0].stock,
  ).toBe(9);
});
it("another customer sees neither orders nor order items and cannot promote themselves", async () => {
  await as("authenticated", other);
  expect((await db.query("select * from public.orders")).rows).toHaveLength(0);
  expect(
    (await db.query("select * from public.order_items")).rows,
  ).toHaveLength(0);
  expect((await db.query("select * from public.profiles")).rows).toHaveLength(
    1,
  );
  await expect(
    db.query("insert into private.admins values($1)", [other]),
  ).rejects.toThrow();
  await expect(
    db.query("update public.profiles set phone=$1", ["other"]),
  ).rejects.toThrow();
  await expect(
    db.query("select public.admin_set_order_status($1,$2)", [
      crypto.randomUUID(),
      "cancelled",
    ]),
  ).rejects.toThrow("forbidden");
});
it("users cannot write order totals or send arbitrary contact inserts", async () => {
  await as("authenticated", buyer);
  await expect(
    db.query("update public.orders set total_minor=1"),
  ).rejects.toThrow();
  await expect(
    db.query("insert into public.contact_messages(name) values($1)", ["x"]),
  ).rejects.toThrow();
  await expect(
    db.query("select public.submit_contact($1,$2)", [
      "a".repeat(64),
      JSON.stringify({}),
    ]),
  ).rejects.toThrow();
});
it("variant stock is reserved separately and cancelled exactly once", async () => {
  await as("authenticated", buyer);
  const order = (await place(crypto.randomUUID(), 2, 30000, variant)).rows[0]
    .result;
  expect(
    (
      await db.query<{ stock: number }>(
        "select stock from public.product_variants",
      )
    ).rows[0].stock,
  ).toBe(3);
  await as("authenticated", admin);
  await db.query("select public.admin_set_order_status($1,$2)", [
    order.id,
    "cancelled",
  ]);
  await db.query("select public.admin_set_order_status($1,$2)", [
    order.id,
    "cancelled",
  ]);
  expect(
    (
      await db.query<{ stock: number }>(
        "select stock from public.product_variants",
      )
    ).rows[0].stock,
  ).toBe(5);
  await expect(
    db.query("select public.admin_set_order_status($1,$2)", [order.id, "new"]),
  ).rejects.toThrow("terminal status");
});
it("admin product RPC is rejected for ordinary users", async () => {
  await as("authenticated", buyer);
  await expect(
    db.query(`select public.admin_save_product('{}','[]')`),
  ).rejects.toThrow("forbidden");
});
it("public callers cannot read unpublished products", async () => {
  await as("authenticated", admin);
  await db.query("update public.products set published=false where id=$1", [
    product,
  ]);
  await as("anon", null);
  expect((await db.query("select * from public.products")).rows).toHaveLength(
    0,
  );
  expect(
    (await db.query("select * from public.product_variants")).rows,
  ).toHaveLength(0);
});
it("admin product and variant updates commit together", async () => {
  await as("authenticated", admin);
  const payload = {
    id: product,
    slug: "test",
    name: { tj: "Updated", ru: "Updated" },
    description: { tj: "D", ru: "D" },
    category_id: category,
    price_minor: 12000,
    old_price_minor: null,
    capacity: 30,
    stock: 7,
    type: "home",
    features: [],
    specs: {},
    published: true,
    featured: true,
  };
  await db.query("select public.admin_save_product($1,$2)", [
    JSON.stringify(payload),
    JSON.stringify([
      { id: variant, name: { tj: "V", ru: "V" }, price_minor: 16000, stock: 4 },
    ]),
  ]);
  expect(
    (
      await db.query<{ price_minor: number }>(
        "select price_minor from public.products",
      )
    ).rows[0].price_minor,
  ).toBe(12000);
  const broken = { ...payload, price_minor: -1 };
  await expect(
    db.query("select public.admin_save_product($1,$2)", [
      JSON.stringify(broken),
      "[]",
    ]),
  ).rejects.toThrow();
  expect(
    (
      await db.query<{ price_minor: number }>(
        "select price_minor from public.products",
      )
    ).rows[0].price_minor,
  ).toBe(12000);
});
it("service contact submissions are rate limited and unreadable to public", async () => {
  await as("service_role", null);
  const input = JSON.stringify({
    name: "Test",
    phone: "+992901234567",
    subject: "Question",
    message: "Test question for support",
  });
  for (let i = 0; i < 5; i++)
    await db.query("select public.submit_contact($1,$2)", [
      "b".repeat(64),
      input,
    ]);
  await expect(
    db.query("select public.submit_contact($1,$2)", ["b".repeat(64), input]),
  ).rejects.toThrow("rate limited");
  await as("authenticated", buyer);
  expect(
    (await db.query("select * from public.contact_messages")).rows,
  ).toHaveLength(0);
  await as("authenticated", admin);
  expect(
    (await db.query("select * from public.contact_messages")).rows,
  ).toHaveLength(5);
});

it("stores Telegram callback preferences through the service-only RPC", async () => {
  await db.exec("reset role; truncate private.contact_limits");
  await as("service_role", null);
  await db.query("select public.submit_contact($1,$2::jsonb)", [
    "b".repeat(64),
    JSON.stringify({
      name: "Test User",
      phone: "+992901234567",
      subject: "Help",
      message: "Please help choose a model",
      preferred_channel: "telegram",
      telegram_username: "test_user",
    }),
  ]);
  await db.exec("reset role");
  const result = await db.query<{
    preferred_channel: string;
    telegram_username: string;
  }>(
    "select preferred_channel,telegram_username from public.contact_messages where telegram_username='test_user'",
  );
  expect(result.rows[0]).toEqual({
    preferred_channel: "telegram",
    telegram_username: "test_user",
  });
});
it("rejects invalid contact preferences at the database boundary", async () => {
  await db.exec("reset role; truncate private.contact_limits");
  await as("service_role", null);
  for (const preference of [
    { preferred_channel: "telegram", telegram_username: "" },
    { preferred_channel: "unknown" },
  ]) {
    await expect(
      db.query("select public.submit_contact($1,$2::jsonb)", [
        "c".repeat(64),
        JSON.stringify({
          name: "Test User",
          phone: "+992901234567",
          subject: "Help",
          message: "Please help choose a model",
          ...preference,
        }),
      ]),
    ).rejects.toThrow();
  }
  await expect(
    db.query("select public.submit_contact(null,'{}'::jsonb)"),
  ).rejects.toThrow("invalid key");
});
