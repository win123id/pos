import { ensureAdminResult, withAdminAuth } from "@/lib/api/admin-route";
import { createCrudService } from "@/lib/api/crud";
import { DEFAULT_ITEMS_PER_PAGE, getPage } from "@/lib/api/pagination";
import {
  ValidationError,
  isPositiveInteger,
  validateEmail,
  validateId,
  validateName,
  validatePhone,
} from "@/lib/api/validation";
import { NextRequest, NextResponse } from "next/server";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

const customers = createCrudService<
  Customer,
  Pick<Customer, "name" | "email" | "phone" | "address">,
  Pick<Customer, "name" | "email" | "phone" | "address">
>("customers", "customers");

export async function GET(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const page = getPage(request);
    const { data, totalCount } = await customers.list(page, DEFAULT_ITEMS_PER_PAGE);

    return NextResponse.json({
      data,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil((totalCount || 0) / DEFAULT_ITEMS_PER_PAGE),
    });
  } catch (error: any) {
    console.error("Customers GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
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
    const name = validateName(body?.name, "Customer name");
    const email = validateEmail(body?.email);
    const phone = validatePhone(body?.phone);
    const address = body?.address && typeof body.address === "string" && body.address.trim().length > 0
      ? body.address.trim()
      : null;

    const data = await customers.create({
      name,
      email,
      phone,
      address,
    });

    return NextResponse.json(
      { message: "Customer created successfully", data },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Customers POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
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
    const name = validateName(body?.name, "Customer name");
    const email = validateEmail(body?.email);
    const phone = validatePhone(body?.phone);
    const address = body?.address && typeof body.address === "string" && body.address.trim().length > 0
      ? body.address.trim()
      : null;

    const data = await customers.update(id, {
      name,
      email,
      phone,
      address,
    });

    const emptyResponse = ensureAdminResult(data, "update");
    if (emptyResponse) {
      return NextResponse.json(emptyResponse, { status: 403 });
    }

    const updatedCustomer = data![0];

    return NextResponse.json({
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Customers PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update customer" },
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
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const data = await customers.delete(id);

    const emptyResponse = ensureAdminResult(data, "delete");
    if (emptyResponse) {
      return NextResponse.json(emptyResponse, { status: 403 });
    }

    return NextResponse.json({
      message: "Customer deleted successfully",
    });
  } catch (error: any) {
    console.error("Customers DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
