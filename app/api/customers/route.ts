import {
  ensureAdminMutationResult,
  handleAdminMutationError,
} from "@/lib/api/admin-mutation";
import { getPage, getRange, getTotalPages } from "@/lib/api/pagination";
import { requireAdmin } from "@/lib/authz/require-admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ITEMS_PER_PAGE = 9;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = getPage(searchParams);
    const { from, to } = getRange(page, ITEMS_PER_PAGE);

    // Get total count
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Fetch paginated customers
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return NextResponse.json({
      data: data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: getTotalPages(count, ITEMS_PER_PAGE)
    });

  } catch (error: any) {
    console.error('Customers GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const body = await request.json();
    
    const { name, email, phone, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const submitData = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null
    };

    const { error } = await supabase
      .from('customers')
      .insert(submitData)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { message: 'Customer created successfully' },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Customers POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const body = await request.json();
    
    const { id, name, email, phone, address } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const submitData = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null
    };

    const { data, error } = await supabase
      .from('customers')
      .update(submitData)
      .eq('id', id)
      .select();
    
    const errorResponse = handleAdminMutationError(error, 'update');
    if (errorResponse) return errorResponse;
    if (error) throw error;

    const emptyResultResponse = ensureAdminMutationResult(data, 'update');
    if (emptyResultResponse) return emptyResultResponse;

    return NextResponse.json({
      message: 'Customer updated successfully',
      data: data[0]
    });

  } catch (error: any) {
    console.error('Customers PUT Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('id', parseInt(id))
      .select();

    const errorResponse = handleAdminMutationError(error, 'delete');
    if (errorResponse) return errorResponse;
    if (error) throw error;

    const emptyResultResponse = ensureAdminMutationResult(data, 'delete');
    if (emptyResultResponse) return emptyResultResponse;

    return NextResponse.json({
      message: 'Customer deleted successfully'
    });

  } catch (error: any) {
    console.error('Customers DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
