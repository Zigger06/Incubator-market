-- Incubator Market: prices are integer dirams (1 TJS = 100 dirams).
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '' check(length(name)<=100),
 address text not null default '' check(length(address)<=300),
 phone text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table private.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.admins where user_id=(select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create function private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,phone) values(new.id,new.phone);return new;end;
$$;
create trigger create_user_profile after insert on auth.users for each row execute function private.create_profile();
insert into public.profiles(id,phone) select id,phone from auth.users on conflict(id) do nothing;
create function private.touch_updated() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new;end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated();

create table public.categories(id uuid primary key default gen_random_uuid(),slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),name jsonb not null check(jsonb_typeof(name)='object' and name ?& array['tj','ru'] and length(name->>'tj')>0 and length(name->>'ru')>0),created_at timestamptz not null default now());
create table public.products(
 id uuid primary key default gen_random_uuid(),slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),name jsonb not null check(jsonb_typeof(name)='object' and name ?& array['tj','ru'] and length(name->>'tj')>0 and length(name->>'ru')>0),description jsonb not null default '{"tj":"","ru":""}',category_id uuid not null references public.categories(id),
 price_minor bigint not null check(price_minor between 0 and 1000000000),old_price_minor bigint check(old_price_minor>=price_minor),capacity integer not null check(capacity between 1 and 100000),stock integer not null default 0 check(stock between 0 and 100000),type text not null default 'home' check(length(type)<=50),features text[] not null default '{}',specs jsonb not null default '{}' check(jsonb_typeof(specs)='object'),published boolean not null default false,featured boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index products_category on public.products(category_id);
create index products_catalog on public.products(published,capacity,price_minor);
create trigger products_updated before update on public.products for each row execute function private.touch_updated();
create table public.product_variants(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id) on delete cascade,name jsonb not null check(jsonb_typeof(name)='object' and name ?& array['tj','ru'] and length(name->>'tj')>0 and length(name->>'ru')>0),price_minor bigint not null check(price_minor between 0 and 1000000000),stock integer not null default 0 check(stock between 0 and 100000),active boolean not null default true,created_at timestamptz not null default now());
create index variants_product on public.product_variants(product_id);
create table public.product_images(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id) on delete cascade,url text not null check(url ~ '^https://'),storage_path text,position integer not null default 0,created_at timestamptz not null default now());
create index images_product on public.product_images(product_id,position);
create table public.favorites(user_id uuid not null references auth.users(id) on delete cascade,product_id uuid not null references public.products(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,product_id));
create table public.orders(
 id uuid primary key default gen_random_uuid(),number bigint generated always as identity unique,user_id uuid not null references auth.users(id),request_id uuid not null,status text not null default 'new' check(status in ('new','confirmed','processing','shipped','delivered','cancelled')),name text not null check(length(name) between 2 and 100),phone text not null check(phone ~ '^\+992[0-9]{9}$'),city text not null check(length(city) between 2 and 100),address text not null default '' check(length(address)<=300),delivery text not null check(delivery in ('delivery','pickup')),comment text not null default '' check(length(comment)<=1000),total_minor bigint not null default 0 check(total_minor>=0),currency text not null default 'TJS' check(currency='TJS'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,request_id),check(delivery='pickup' or length(address)>=3)
);
create index orders_user_created on public.orders(user_id,created_at desc);
create trigger orders_updated before update on public.orders for each row execute function private.touch_updated();
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,product_id uuid references public.products(id) on delete set null,variant_id uuid references public.product_variants(id) on delete set null,name jsonb not null,variant_name jsonb,quantity integer not null check(quantity between 1 and 99),unit_price_minor bigint not null check(unit_price_minor>=0));
create index order_items_order on public.order_items(order_id);
create table public.contact_messages(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 100),phone text not null check(phone ~ '^\+992[0-9]{9}$'),subject text not null check(length(subject) between 2 and 150),message text not null check(length(message) between 10 and 3000),created_at timestamptz not null default now());
create table public.site_settings(id text primary key check(id='store'),value jsonb not null check(jsonb_typeof(value)='object'),updated_at timestamptz not null default now());
create trigger settings_updated before update on public.site_settings for each row execute function private.touch_updated();
create table private.contact_limits(key text primary key,window_start timestamptz not null default now(),count integer not null default 0);

-- Remove Supabase default broad grants, then expose only required operations.
revoke all on public.profiles,public.categories,public.products,public.product_variants,public.product_images,public.favorites,public.orders,public.order_items,public.contact_messages,public.site_settings from anon,authenticated;
grant select on public.categories,public.products,public.product_variants,public.product_images,public.site_settings to anon,authenticated;
grant select on public.profiles,public.favorites,public.orders,public.order_items,public.contact_messages to authenticated;
grant update(name,address) on public.profiles to authenticated;
grant insert,update,delete on public.categories,public.products,public.product_variants,public.product_images,public.site_settings to authenticated;
grant insert,delete on public.favorites to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select public.is_admin()));
create policy profiles_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy categories_read on public.categories for select to anon,authenticated using(true);
create policy categories_admin on public.categories for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy products_read on public.products for select to anon,authenticated using(published or (select public.is_admin()));
create policy products_admin on public.products for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy variants_read on public.product_variants for select to anon,authenticated using((active and exists(select 1 from public.products p where p.id=product_id and p.published)) or (select public.is_admin()));
create policy variants_admin on public.product_variants for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy images_read on public.product_images for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.published) or (select public.is_admin()));
create policy images_admin on public.product_images for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy favorites_own on public.favorites for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy orders_read on public.orders for select to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));
create policy order_items_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=(select auth.uid()) or (select public.is_admin()))));
create policy messages_admin_read on public.contact_messages for select to authenticated using((select public.is_admin()));
create policy settings_read on public.site_settings for select to anon,authenticated using(true);
create policy settings_admin on public.site_settings for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

-- Atomic order creation: authenticated only, authoritative price, ordered row locks,
-- idempotent retry, inventory reservation and customer-level rate limiting.
create function public.place_order(p_customer jsonb,p_items jsonb,p_request_id uuid,p_expected_total bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); existing public.orders; order_id uuid; order_number bigint; item jsonb; p public.products; v public.product_variants; qty integer; unit_price bigint; total bigint:=0; variant_id uuid;
begin
 if uid is null then raise exception 'authentication required';end if;
 if p_request_id is null or p_expected_total is null then raise exception 'invalid request';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into existing from public.orders where user_id=uid and request_id=p_request_id;
 if found then return jsonb_build_object('id',existing.id,'number',existing.number);end if;
 if (select count(*) from public.orders where user_id=uid and created_at>now()-interval '1 hour')>=10 then raise exception 'rate limited';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'invalid items';end if;
 if exists(select 1 from jsonb_array_elements(p_items) x group by x->>'product_id',coalesce(x->>'variant_id','') having count(*)>1) then raise exception 'duplicate item';end if;
 insert into public.orders(user_id,request_id,name,phone,city,address,delivery,comment) values(uid,p_request_id,trim(p_customer->>'name'),p_customer->>'phone',trim(p_customer->>'city'),coalesce(trim(p_customer->>'address'),''),p_customer->>'delivery',coalesce(p_customer->>'comment','')) returning id,number into order_id,order_number;
 for item in select x from jsonb_array_elements(p_items) x order by x->>'product_id',x->>'variant_id' loop
  if coalesce(item->>'quantity','') !~ '^[0-9]+$' then raise exception 'invalid quantity';end if;
  qty:=(item->>'quantity')::integer; if qty not between 1 and 99 then raise exception 'invalid quantity';end if;
  select * into p from public.products where id=(item->>'product_id')::uuid and published for update;
  if not found then raise exception 'stock unavailable';end if;
  variant_id:=nullif(item->>'variant_id','')::uuid;v:=null;
  if variant_id is not null then
   select * into v from public.product_variants where id=variant_id and product_id=p.id and active for update;
   if not found or v.stock<qty then raise exception 'stock unavailable';end if;
   unit_price:=v.price_minor;update public.product_variants set stock=stock-qty where id=v.id;
  else
   if p.stock<qty then raise exception 'stock unavailable';end if;
   unit_price:=p.price_minor;update public.products set stock=stock-qty where id=p.id;
  end if;
  total:=total+qty*unit_price;
  insert into public.order_items(order_id,product_id,variant_id,name,variant_name,quantity,unit_price_minor) values(order_id,p.id,variant_id,p.name,v.name,qty,unit_price);
 end loop;
 if total<>p_expected_total then raise exception 'price changed';end if;
 update public.orders set total_minor=total where id=order_id;
 return jsonb_build_object('id',order_id,'number',order_number);
end;
$$;
revoke all on function public.place_order(jsonb,jsonb,uuid,bigint) from public,anon;
grant execute on function public.place_order(jsonb,jsonb,uuid,bigint) to authenticated;

create function public.admin_set_order_status(p_order_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare o public.orders;i public.order_items;
begin
 if not public.is_admin() then raise exception 'forbidden';end if;
 if p_status not in ('new','confirmed','processing','shipped','delivered','cancelled') then raise exception 'invalid status';end if;
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'order missing';end if;
 if o.status=p_status then return;end if;
 if o.status in ('delivered','cancelled') then raise exception 'terminal status';end if;
 if p_status='cancelled' then
  for i in select * from public.order_items where order_id=o.id order by product_id,variant_id loop
   if i.variant_id is not null then update public.product_variants set stock=stock+i.quantity where id=i.variant_id;
   elsif i.product_id is not null and i.variant_name is null then update public.products set stock=stock+i.quantity where id=i.product_id;end if;
  end loop;
 end if;
 update public.orders set status=p_status where id=o.id;
end;
$$;
revoke all on function public.admin_set_order_status(uuid,text) from public,anon;
grant execute on function public.admin_set_order_status(uuid,text) to authenticated;

-- Save product and variants together. Removed variants are archived, preserving order refs.
create function public.admin_save_product(p_product jsonb,p_variants jsonb) returns void language plpgsql security definer set search_path='' as $$
declare p public.products; v jsonb; vid uuid;
begin
 if not public.is_admin() then raise exception 'forbidden';end if;
 if jsonb_typeof(p_variants) is distinct from 'array' or jsonb_array_length(p_variants)>100 then raise exception 'invalid variants';end if;
 p:=jsonb_populate_record(null::public.products,p_product);
 insert into public.products(id,slug,name,description,category_id,price_minor,old_price_minor,capacity,stock,type,features,specs,published,featured)
 values(p.id,p.slug,p.name,p.description,p.category_id,p.price_minor,p.old_price_minor,p.capacity,p.stock,p.type,p.features,p.specs,p.published,p.featured)
 on conflict(id) do update set slug=excluded.slug,name=excluded.name,description=excluded.description,category_id=excluded.category_id,price_minor=excluded.price_minor,old_price_minor=excluded.old_price_minor,capacity=excluded.capacity,stock=excluded.stock,type=excluded.type,features=excluded.features,specs=excluded.specs,published=excluded.published,featured=excluded.featured;
 update public.product_variants set active=false where product_id=p.id;
 for v in select x from jsonb_array_elements(p_variants) x loop
  vid:=(v->>'id')::uuid;
  if exists(select 1 from public.product_variants where id=vid and product_id<>p.id) then raise exception 'invalid variant';end if;
  insert into public.product_variants(id,product_id,name,price_minor,stock,active) values(vid,p.id,v->'name',(v->>'price_minor')::bigint,(v->>'stock')::integer,true)
  on conflict(id) do update set name=excluded.name,price_minor=excluded.price_minor,stock=excluded.stock,active=true;
 end loop;
end;
$$;
revoke all on function public.admin_save_product(jsonb,jsonb) from public,anon;
grant execute on function public.admin_save_product(jsonb,jsonb) to authenticated;

-- Only Edge Function service_role can invoke this. No public insert or read access.
create function public.submit_contact(p_hash text,p_message jsonb) returns void language plpgsql security definer set search_path='' as $$
declare k text; n integer;
begin
 if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid key';end if;
 -- Lock global first to keep ordering consistent across requests.
 foreach k in array array['global',p_hash] loop
  insert into private.contact_limits(key,window_start,count) values(k,now(),1)
  on conflict(key) do update set count=case when private.contact_limits.window_start<now()-interval '1 hour' then 1 else private.contact_limits.count+1 end,window_start=case when private.contact_limits.window_start<now()-interval '1 hour' then now() else private.contact_limits.window_start end
  returning count into n;
  if n>(case when k='global' then 100 else 5 end) then raise exception 'rate limited';end if;
 end loop;
 delete from private.contact_limits where window_start<now()-interval '2 days';
 insert into public.contact_messages(name,phone,subject,message) values(trim(p_message->>'name'),p_message->>'phone',trim(p_message->>'subject'),trim(p_message->>'message'));
end;
$$;
revoke all on function public.submit_contact(text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_contact(text,jsonb) to service_role;

-- Product photos are public by design; only admins can change them.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy product_image_upload on storage.objects for insert to authenticated with check(bucket_id='product-images' and (select public.is_admin()));
create policy product_image_update on storage.objects for update to authenticated using(bucket_id='product-images' and (select public.is_admin())) with check(bucket_id='product-images' and (select public.is_admin()));
create policy product_image_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and (select public.is_admin()));
create policy product_image_admin_read on storage.objects for select to authenticated using(bucket_id='product-images' and (select public.is_admin()));
