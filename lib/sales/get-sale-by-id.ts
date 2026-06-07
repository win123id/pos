import { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function getSaleById(supabase: ServerSupabase, saleId: number | string) {
  return supabase
    .from("sales")
    .select(`
      *,
      customers(name, email, phone, address),
      sale_items(
        *,
        products(id, name, type, price_per_unit, cost_price)
      )
    `)
    .eq("id", saleId)
    .single();
}
