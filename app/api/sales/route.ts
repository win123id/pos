import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const selectedYear = searchParams.get('year') || '';
    const selectedMonth = searchParams.get('month') || '';

    // Build query with filters
    let query = supabase.from('sales').select(`
      id,
      total_price,
      created_at,
      customer_id,
      customers(name, email, phone),
      sale_items(
        id,
        product_id,
        quantity,
        width,
        height,
        description,
        item_total,
        products(name, type, price_per_unit)
      )
    `, { count: 'exact' });

    // Apply date filters
    if (selectedYear && selectedMonth) {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59);
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    } else if (selectedYear) {
      const startDate = new Date(parseInt(selectedYear), 0, 1);
      const endDate = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    // Get filtered data
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

    if (error) throw error;
    
    // Calculate total sales for the filtered period
    let totalQuery = supabase.from('sales').select('total_price');
    
    if (selectedYear && selectedMonth) {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59);
      
      totalQuery = totalQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    } else if (selectedYear) {
      const startDate = new Date(parseInt(selectedYear), 0, 1);
      const endDate = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
      
      totalQuery = totalQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    const { data: totalData } = await totalQuery;
    const total = totalData?.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0) || 0;
    
    return NextResponse.json({
      data: data || [],
      totalCount: count || 0,
      totalSales: total,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
    });

  } catch (error: any) {
    console.error('Sales GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { customer_id, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Calculate total
    const total = items.reduce((sum: number, item: any) => sum + item.item_total, 0);

    // Create sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        total_price: total,
        customer_id: customer_id || null
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // Create sale items
    const saleItemsToInsert = items.map((item: any) => ({
      sale_id: saleData.id,
      product_id: item.product_id,
      quantity: item.quantity || null,
      width: item.width || null,
      height: item.height || null,
      item_total: item.item_total,
      description: item.description || null,
      cost_price: item.product.cost_price || null,
      price_per_unit: item.product.price_per_unit
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({
      message: 'Sale created successfully',
      data: saleData
    }, { status: 201 });

  } catch (error: any) {
    console.error('Sales POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create sale' },
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
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    // First delete sale items
    const { data: itemsData, error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', parseInt(id))
      .select();

    if (itemsError) {
      if (itemsError.code === '42501') {
        return NextResponse.json(
          { error: "You don't have permission to delete this data." },
          { status: 403 }
        );
      }
      throw itemsError;
    }

    if (!itemsData || itemsData.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to delete this data." },
        { status: 403 }
      );
    }

    // Then delete the sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .delete()
      .eq('id', parseInt(id))
      .select();

    if (saleError) {
      if (saleError.code === '42501') {
        return NextResponse.json(
          { error: "You don't have permission to delete this data." },
          { status: 403 }
        );
      }
      throw saleError;
    }

    if (!saleData || saleData.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to delete this data." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: 'Sale deleted successfully'
    });

  } catch (error: any) {
    console.error('Sales DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete sale' },
      { status: 500 }
    );
  }
}
