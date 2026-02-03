import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');

    // Get total count
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Fetch paginated products
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

    if (error) throw error;
    
    return NextResponse.json({
      data: data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
    });

  } catch (error: any) {
    console.error('Products GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { name, type, price_per_unit, cost_price } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!type || !['size', 'quantity'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid product type is required' },
        { status: 400 }
      );
    }

    if (!price_per_unit || isNaN(parseFloat(price_per_unit)) || parseFloat(price_per_unit) <= 0) {
      return NextResponse.json(
        { error: 'Valid selling price is required' },
        { status: 400 }
      );
    }

    const submitData = {
      name,
      type,
      price_per_unit: parseFloat(price_per_unit),
      cost_price: cost_price ? parseFloat(cost_price) : null
    };

    const { error } = await supabase
      .from('products')
      .insert(submitData)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { message: 'Product created successfully' },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Products POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { id, name, type, price_per_unit, cost_price } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!type || !['size', 'quantity'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid product type is required' },
        { status: 400 }
      );
    }

    if (!price_per_unit || isNaN(parseFloat(price_per_unit)) || parseFloat(price_per_unit) <= 0) {
      return NextResponse.json(
        { error: 'Valid selling price is required' },
        { status: 400 }
      );
    }

    const submitData = {
      name,
      type,
      price_per_unit: parseFloat(price_per_unit),
      cost_price: cost_price ? parseFloat(cost_price) : null
    };

    const { data, error } = await supabase
      .from('products')
      .update(submitData)
      .eq('id', id)
      .select();
    
    if (error) {
      if (error.code === '42501') {
        return NextResponse.json(
          { error: "You don't have permission to update this data." },
          { status: 403 }
        );
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to update this data." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      data: data[0]
    });

  } catch (error: any) {
    console.error('Products PUT Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', parseInt(id))
      .select();

    if (error) {
      if (error.code === '42501') {
        return NextResponse.json(
          { error: "You don't have permission to delete this data." },
          { status: 403 }
        );
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to delete this data." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error('Products DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
