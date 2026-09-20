import { requireBackend } from "../lib/supabase";
import { checkoutSchema, contactSchema } from "../lib/validation";
import type { CartItem, Order } from "../types";
export async function createOrder(
  input: unknown,
  items: CartItem[],
  requestId: string,
  expectedTotal: number,
) {
  const payload = checkoutSchema.parse(input);
  const { data, error } = await requireBackend().rpc("place_order", {
    p_customer: payload,
    p_items: items,
    p_request_id: requestId,
    p_expected_total: expectedTotal,
  });
  if (error)
    throw new Error(
      error.message.includes("stock") || error.message.includes("price")
        ? "stockChanged"
        : "genericError",
    );
  return data as { id: string; number: number };
}
export async function listOrders(): Promise<Order[]> {
  const { data, error } = await requireBackend()
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error("genericError");
  return data as Order[];
}
export async function sendContact(input: unknown) {
  const payload = contactSchema.parse(input);
  const { error } = await requireBackend().functions.invoke("contact", {
    body: payload,
  });
  if (error) throw new Error("genericError");
}
