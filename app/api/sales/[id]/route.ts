import { requireAdmin } from "@/lib/authz/require-admin";
import { getSaleById } from "@/lib/sales/get-sale-by-id";
import { prepareSalePayload, SaleValidationError } from "@/lib/sales/service";
import type { SaleWriteResult } from "@/lib/sales/types";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();

    // ✅ NEW
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await getSaleById(supabase, id);

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
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const preparedSale = await prepareSalePayload(supabase, {
      customerId: body.customer_id,
      items: body.items,
    });

    const saleId = Number(id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return NextResponse.json({ error: "Sale ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("update_sale_with_items", {
      p_sale_id: saleId,
      p_customer_id: preparedSale.customerId,
      p_total_price: preparedSale.totalPrice,
      p_items: preparedSale.items,
    });

    if (error) throw error;

    const result = data as SaleWriteResult | null;

    if (!result) {
      throw new Error("Sale write RPC returned no result");
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof SaleValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err?.message === "Sale not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
