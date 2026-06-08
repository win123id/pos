import { ensureAdminResult, withAdminAuth } from "@/lib/api/admin-route";
import { createCrudService } from "@/lib/api/crud";
import { DEFAULT_ITEMS_PER_PAGE, getPage } from "@/lib/api/pagination";
import {
  ValidationError,
  isPositiveInteger,
  validateId,
  validateName,
  validatePrice,
  validateType,
} from "@/lib/api/validation";
import { NextRequest, NextResponse } from "next/server";

interface Product {
  id: number;
  name: string;
  type: "size" | "quantity";
  price_per_unit: number;
  cost_price?: number | null;
  created_at: string;
}

const products = createCrudService<
  Product,
  Pick<Product, "name" | "type" | "price_per_unit" | "cost_price">,
  Pick<Product, "name" | "type" | "price_per_unit" | "cost_price">
>("products", "products");

export async function GET(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const page = getPage(request);
    const { data, totalCount } = await products.list(page, DEFAULT_ITEMS_PER_PAGE);

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

    const data = await products.create({
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

    const data = await products.update(id, {
      name,
      type,
      price_per_unit,
      cost_price,
    });

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

    const data = await products.delete(id);

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
