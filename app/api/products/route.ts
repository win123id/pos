import { withAdminAuth, handleAdminError, ensureAdminResult } from "@/lib/api/admin-route";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ITEMS_PER_PAGE, getPage } from "@/lib/api/pagination";
import { ValidationError, validateName, validateType, validatePrice, validateId } from "@/lib/api/validation";
import { NextRequest, NextResponse } from "next/server";

interface Product {
  id: number;
  name: string;
  type: "size" | "quantity";
  price_per_unit: number;
  cost_price?: number | null;
  created_at: string;
}

async function getAllProducts(page: number, perPage: number) {
  const supabase = await createClient();
  const { from, to } = { from: (page - 1) * perPage, to: page * perPage - 1 };

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message || "Failed to fetch products");
  }

  return { data: (data as Product[]) || [], totalCount: count || 0 };
}

async function createProduct(data: Partial<Product>) {
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("products")
    .insert(data)
    .select();

  if (error) {
    throw new Error(error.message || "Failed to create product");
  }

  return created;
}

async function updateProduct(id: number, data: Partial<Product>) {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("products")
    .update(data)
    .eq("id", id)
    .select();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message || "Failed to update product");
  }

  return updated;
}

async function deleteProduct(id: number) {
  const supabase = await createClient();

  const { data: deleted, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message || "Failed to delete product");
  }

  return deleted;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const page = getPage(request);
    const { data, totalCount } = await getAllProducts(page, DEFAULT_ITEMS_PER_PAGE);

    return NextResponse.json({
      data,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil((totalCount || 0) / DEFAULT_ITEMS_PER_PAGE),
    });
  } catch (error: any) {
    console.error("Products GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const name = validateName(body?.name, "Product name");
    const type = validateType(body?.type, ["size", "quantity"], "Product type");
    const price_per_unit = validatePrice(body?.price_per_unit, "Selling price");

    const cost_price =
      body?.cost_price != null ? validatePrice(body.cost_price, "Cost price") : null;

    const data = await createProduct({
      name,
      type,
      price_per_unit,
      cost_price,
    });

    return NextResponse.json(
      { message: "Product created successfully", data },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Products POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const id = validateId(body?.id);
    const name = validateName(body?.name, "Product name");
    const type = validateType(body?.type, ["size", "quantity"], "Product type");
    const price_per_unit = validatePrice(body?.price_per_unit, "Selling price");

    const cost_price =
      body?.cost_price != null ? validatePrice(body.cost_price, "Cost price") : null;

    const data = await updateProduct(id, {
      name,
      type,
      price_per_unit,
      cost_price,
    });

    const errorResponse = handleAdminError(null, "update");
    if (errorResponse) {
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const emptyResponse = ensureAdminResult(data, "update");
    if (emptyResponse) {
      return NextResponse.json(emptyResponse, { status: 403 });
    }

    const updatedProduct = data![0];

    return NextResponse.json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Products PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!isPositiveInteger(id)) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const data = await deleteProduct(id);

    const errorResponse = handleAdminError(null, "delete");
    if (errorResponse) {
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const emptyResponse = ensureAdminResult(data, "delete");
    if (emptyResponse) {
      return NextResponse.json(emptyResponse, { status: 403 });
    }

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Products DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
