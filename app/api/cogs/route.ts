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
    let query = supabase
      .from('sale_items')
      .select(`
        id,
        sale_id,
        product_id,
        quantity,
        width,
        height,
        description,
        item_total,
        cost_price,
        price_per_unit,
        products!inner(
          name,
          type
        ),
        sales!inner(
          id,
          created_at,
          customers(name)
        )
      `, { count: 'exact' });

    // Apply date filters
    if (selectedYear && selectedMonth) {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59);
      
      query = query
        .gte('sales.created_at', startDate.toISOString())
        .lte('sales.created_at', endDate.toISOString());
    } else if (selectedYear) {
      const startDate = new Date(parseInt(selectedYear), 0, 1);
      const endDate = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
      
      query = query
        .gte('sales.created_at', startDate.toISOString())
        .lte('sales.created_at', endDate.toISOString());
    }

    // Get filtered data
    const { data, error, count } = await query
      .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

    if (error) throw error;
    
    // Calculate COGS metrics
    const processedData = (data || []).map((item: any) => {
      const product = item.products;
      const costPrice = item.cost_price || 0;  // From sale_items
      const pricePerUnit = item.price_per_unit || 0;  // From sale_items
      
      let unitCost = costPrice;
      let quantity = item.quantity || 1;
      
      // For size-based products, calculate cost based on dimensions
      if (product.type === 'size') {
        const width = item.width || 0;
        const height = item.height || 0;
        unitCost = width * height * costPrice;
      }
      
      const totalCost = unitCost * quantity;
      const totalRevenue = item.item_total || 0;
      
      return {
        ...item,
        unit_cost: unitCost,
        total_cost: totalCost,
        total_revenue: totalRevenue
      };
    }).sort((a: any, b: any) => new Date(b.sales.created_at).getTime() - new Date(a.sales.created_at).getTime());
    
    // Calculate totals for the filtered period
    const totalSupabase = await createClient();
    let totalQuery = totalSupabase
      .from('sale_items')
      .select(`
        quantity,
        width,
        height,
        item_total,
        cost_price,
        price_per_unit,
        products!inner(type),
        sales!inner(created_at)
      `);
    
    if (selectedYear && selectedMonth) {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59);
      
      totalQuery = totalQuery
        .gte('sales.created_at', startDate.toISOString())
        .lte('sales.created_at', endDate.toISOString());
    } else if (selectedYear) {
      const startDate = new Date(parseInt(selectedYear), 0, 1);
      const endDate = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
      
      totalQuery = totalQuery
        .gte('sales.created_at', startDate.toISOString())
        .lte('sales.created_at', endDate.toISOString());
    }

    const { data: totalData } = await totalQuery;
    
    let totalCOGSCalc = 0;
    let totalRevenueCalc = 0;
    
    totalData?.forEach((item: any) => {
      const costPrice = item.cost_price || 0;  // From sale_items
      let unitCost = costPrice;
      let quantity = item.quantity || 1;
      
      if (item.products.type === 'size') {
        const width = item.width || 0;
        const height = item.height || 0;
        unitCost = width * height * costPrice;
      }
      
      totalCOGSCalc += unitCost * quantity;
      totalRevenueCalc += item.item_total || 0;
    });
    
    const grossProfitCalc = totalRevenueCalc - totalCOGSCalc;
    
    return NextResponse.json({
      data: processedData,
      totalCount: count || 0,
      totalCOGS: totalCOGSCalc,
      totalRevenue: totalRevenueCalc,
      grossProfit: grossProfitCalc,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
    });

  } catch (error: any) {
    console.error('COGS API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch COGS data' },
      { status: 500 }
    );
  }
}
