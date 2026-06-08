import { withAdminAuth } from "@/lib/api/admin-route";
import { DEFAULT_ITEMS_PER_PAGE, getPage } from "@/lib/api/pagination";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type ProductType = "size" | "quantity";

type MaybeArray<T> = T | T[];

interface ProductJoin {
  name: string;
  type: ProductType;
}

interface ProductTypeJoin {
  type: ProductType;
}

interface CustomerJoin {
  name: string | null;
}

interface SaleJoin {
  id: number;
  created_at: string;
  customers: MaybeArray<CustomerJoin> | null;
}

interface CogsItemJoinRow {
  id: number;
  sale_id: number;
  product_id: number | null;
  quantity: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
  item_total: number | null;
  cost_price: number | null;
  price_per_unit: number | null;
  products: MaybeArray<ProductJoin>;
  sales: MaybeArray<SaleJoin>;
}

interface CogsItemMetricsInput {
  cost_price: number | null;
  quantity: number | null;
  width: number | null;
  height: number | null;
  item_total: number | null;
  products: {
    type: ProductType;
  };
}

interface CogsItemRow extends CogsItemMetricsInput {
  id: number;
  sale_id: number;
  product_id: number | null;
  description: string | null;
  price_per_unit: number | null;
  products: {
    name: string;
    type: ProductType;
  };
  sales: {
    id: number;
    created_at: string;
    customers: {
      name: string | null;
    } | null;
  };
}

interface CogsTotalsJoinRow {
  quantity: number | null;
  width: number | null;
  height: number | null;
  item_total: number | null;
  cost_price: number | null;
  products: MaybeArray<ProductTypeJoin>;
}

interface CogsTotalsRow extends CogsItemMetricsInput {
  products: {
    type: ProductType;
  };
}

interface DateRangeFilter {
  startDate: string | null;
  endDate: string | null;
}

function getDateRangeFilter(searchParams: URLSearchParams): DateRangeFilter {
  const selectedYear = searchParams.get("year") || "";
  const selectedMonth = searchParams.get("month") || "";

  if (selectedYear && selectedMonth) {
    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10);

    return {
      startDate: new Date(year, month - 1, 1).toISOString(),
      endDate: new Date(year, month, 0, 23, 59, 59).toISOString(),
    };
  }

  if (selectedYear) {
    const year = parseInt(selectedYear, 10);

    return {
      startDate: new Date(year, 0, 1).toISOString(),
      endDate: new Date(year, 11, 31, 23, 59, 59).toISOString(),
    };
  }

  return {
    startDate: null,
    endDate: null,
  };
}

function applySalesCreatedAtFilter<
  T extends {
    gte(column: string, value: string): T;
    lte(column: string, value: string): T;
  },
>(query: T, range: DateRangeFilter) {
  if (!range.startDate || !range.endDate) {
    return query;
  }

  return query.gte("sales.created_at", range.startDate).lte("sales.created_at", range.endDate);
}

function calculateItemMetrics(
  item: CogsItemMetricsInput,
) {
  const costPrice = item.cost_price || 0;
  const quantity = item.quantity || 1;
  const width = item.width || 0;
  const height = item.height || 0;
  const unitCost = item.products.type === "size" ? width * height * costPrice : costPrice;
  const totalCost = unitCost * quantity;
  const totalRevenue = item.item_total || 0;

  return {
    unitCost,
    totalCost,
    totalRevenue,
  };
}

function firstJoined<T>(value: MaybeArray<T> | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function toCogsItemRow(item: CogsItemJoinRow): CogsItemRow | null {
  const product = firstJoined(item.products);
  const sale = firstJoined(item.sales);

  if (!product || !sale) {
    return null;
  }

  return {
    id: item.id,
    sale_id: item.sale_id,
    product_id: item.product_id,
    quantity: item.quantity,
    width: item.width,
    height: item.height,
    description: item.description,
    item_total: item.item_total,
    cost_price: item.cost_price,
    price_per_unit: item.price_per_unit,
    products: product,
    sales: {
      id: sale.id,
      created_at: sale.created_at,
      customers: firstJoined(sale.customers),
    },
  };
}

function toCogsTotalsRow(item: CogsTotalsJoinRow): CogsTotalsRow | null {
  const product = firstJoined(item.products);

  if (!product) {
    return null;
  }

  return {
    quantity: item.quantity,
    width: item.width,
    height: item.height,
    item_total: item.item_total,
    cost_price: item.cost_price,
    products: product,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const supabase = await createClient();
    const page = getPage(request);
    const { searchParams } = new URL(request.url);
    const dateRange = getDateRangeFilter(searchParams);

    let query = supabase
      .from("sale_items")
      .select(
        `
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
        `,
        { count: "exact" },
      );

    query = applySalesCreatedAtFilter(query, dateRange);

    const { data, error, count } = await query.range(
      (page - 1) * DEFAULT_ITEMS_PER_PAGE,
      page * DEFAULT_ITEMS_PER_PAGE - 1,
    );

    if (error) throw error;

    const processedData = ((data as CogsItemJoinRow[] | null) || [])
      .map(toCogsItemRow)
      .filter((item): item is CogsItemRow => item !== null)
      .map((item) => {
        const metrics = calculateItemMetrics(item);

        return {
          ...item,
          unit_cost: metrics.unitCost,
          total_cost: metrics.totalCost,
          total_revenue: metrics.totalRevenue,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.sales.created_at).getTime() - new Date(a.sales.created_at).getTime(),
      );

    let totalQuery = supabase.from("sale_items").select(
      `
        quantity,
        width,
        height,
        item_total,
        cost_price,
        products!inner(type),
        sales!inner(created_at)
      `,
    );

    totalQuery = applySalesCreatedAtFilter(totalQuery, dateRange);

    const { data: totalData, error: totalsError } = await totalQuery;

    if (totalsError) throw totalsError;

    const totals = ((totalData as CogsTotalsJoinRow[] | null) || [])
      .map(toCogsTotalsRow)
      .filter((item): item is CogsTotalsRow => item !== null)
      .reduce(
      (accumulator, item) => {
        const metrics = calculateItemMetrics(item);

        return {
          totalCOGS: accumulator.totalCOGS + metrics.totalCost,
          totalRevenue: accumulator.totalRevenue + metrics.totalRevenue,
        };
      },
      { totalCOGS: 0, totalRevenue: 0 },
    );

    return NextResponse.json({
      data: processedData,
      totalCount: count || 0,
      totalCOGS: totals.totalCOGS,
      totalRevenue: totals.totalRevenue,
      grossProfit: totals.totalRevenue - totals.totalCOGS,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / DEFAULT_ITEMS_PER_PAGE),
    });
  } catch (error: any) {
    console.error("COGS API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch COGS data" },
      { status: 500 },
    );
  }
}
