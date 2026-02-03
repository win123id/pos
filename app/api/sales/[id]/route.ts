import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // ✅ NEW
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(name, email, phone, address),
        sale_items(
          *,
          products(id, name, type, price_per_unit, cost_price)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sale not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data });

  } catch (error: any) {
    console.error('Sale Detail GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sale details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { customer_id, total_price, items } = body;

    // update sale
    await supabase
      .from("sales")
      .update({
        customer_id,
        total_price,
      })
      .eq("id", id);

    // delete old items
    await supabase.from("sale_items").delete().eq("sale_id", id);

    // insert new items
    const itemsToInsert = items.map((item: any) => ({
      sale_id: id,
      product_id: item.product_id,
      quantity: item.quantity,
      width: item.width,
      height: item.height,
      description: item.description,
      item_total: item.item_total,
      price_per_unit: item.product.price_per_unit,
      cost_price: item.product.cost_price ?? null,
    }));

    await supabase.from("sale_items").insert(itemsToInsert);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
