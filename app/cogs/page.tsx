"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/currency";
import { 
  TrendingDown, 
  Package, 
  Calendar,
  DollarSign,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";

interface COGSItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  width?: number;
  height?: number;
  description: string;
  unit_cost: number;
  total_cost: number;
  total_revenue: number;
  cost_price: number;
  price_per_unit: number;
  products: {
    name: string;
    type: 'size' | 'quantity';
  };
  sales: {
    id: number;
    created_at: string;
    customers: {
      name: string;
    } | null;
  };
}

const ITEMS_PER_PAGE = 10;

export default function COGSPage() {
  const supabase = createClient();
  
  const [cogsItems, setCOGSItems] = useState<COGSItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [totalCOGS, setTotalCOGS] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [grossProfit, setGrossProfit] = useState<number>(0);

  useEffect(() => {
    fetchCOGS();
  }, [currentPage, selectedMonth, selectedYear]);

  const fetchCOGS = async () => {
    setIsLoading(true);
    setError(null);

    try {
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
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

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
      }).sort((a, b) => new Date(b.sales.created_at).getTime() - new Date(a.sales.created_at).getTime());
      
      // Calculate totals for the filtered period
      let totalQuery = supabase
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
      
      setCOGSItems(processedData as COGSItem[]);
      setTotalCount(count || 0);
      setTotalCOGS(totalCOGSCalc);
      setTotalRevenue(totalRevenueCalc);
      setGrossProfit(grossProfitCalc);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch COGS data');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getProfitMargin = () => {
    if (totalRevenue === 0) return '0.0';
    return ((grossProfit / totalRevenue) * 100).toFixed(1);
  };

  const getProfitMarginColor = () => {
    const margin = parseFloat(getProfitMargin());
    if (margin >= 50) return 'text-green-600';
    if (margin >= 30) return 'text-yellow-600';
    if (margin >= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Cost of Goods Sold</h1>
              <p className="text-muted-foreground text-lg">
                Track your product costs and profit margins
              </p>
            </div>
          </div>

          {/* Filters and Metrics */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Years</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedYear}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-600 font-medium">Total Revenue</div>
                <div className="text-xl font-bold text-blue-900">
                  {formatRupiah(totalRevenue)}
                </div>
              </div>

              {/* Total COGS */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-sm text-red-600 font-medium">Total COGS</div>
                <div className="text-xl font-bold text-red-900">
                  {formatRupiah(totalCOGS)}
                </div>
              </div>

              {/* Gross Profit */}
              <div className={`bg-gradient-to-br rounded-xl p-4 ${
                grossProfit >= 0 
                  ? 'from-green-50 to-green-100 border-green-200' 
                  : 'from-orange-50 to-orange-100 border-orange-200'
              } border`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    grossProfit >= 0 ? 'bg-green-500' : 'bg-orange-500'
                  }`}>
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  {grossProfit >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className={`text-sm font-medium ${
                  grossProfit >= 0 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  Gross Profit
                </div>
                <div className={`text-xl font-bold ${
                  grossProfit >= 0 ? 'text-green-900' : 'text-orange-900'
                }`}>
                  {formatRupiah(grossProfit)}
                </div>
                <div className={`text-xs font-medium mt-1 ${getProfitMarginColor()}`}>
                  Margin: {getProfitMargin()}%
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* COGS Table */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading COGS data...
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Product</th>
                          <th className="text-left p-3 font-medium">Customer</th>
                          <th className="text-center p-3 font-medium">Quantity</th>
                          <th className="text-right p-3 font-medium">Unit Cost</th>
                          <th className="text-right p-3 font-medium">Total Cost</th>
                          <th className="text-right p-3 font-medium">Revenue</th>
                          <th className="text-right p-3 font-medium">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cogsItems.length > 0 ? (
                          cogsItems.map((item) => {
                            const profit = item.total_revenue - item.total_cost;
                            const profitMargin = item.total_revenue > 0 
                              ? ((profit / item.total_revenue) * 100).toFixed(1)
                              : '0.0';
                            
                            return (
                              <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="p-3">
                                  <div className="text-sm">
                                    {new Date(item.sales.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(item.sales.created_at).toLocaleTimeString()}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium">{item.products.name}</div>
                                  <div className="text-xs text-muted-foreground capitalize">
                                    {item.products.type}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="text-sm">
                                    {item.sales.customers?.name || 'Walk-in Customer'}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="text-sm">
                                    {item.products.type === 'size' 
                                      ? `${item.width || 0}×${item.height || 0} cm`
                                      : item.quantity || 1
                                    }
                                  </div>
                                  {item.products.type === 'size' && (
                                    <div className="text-xs text-muted-foreground">
                                      ×{item.quantity || 1}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="text-sm font-medium">
                                    {formatRupiah(item.unit_cost)}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="text-sm font-medium text-red-600">
                                    {formatRupiah(item.total_cost)}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="text-sm font-medium text-blue-600">
                                    {formatRupiah(item.total_revenue)}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className={`text-sm font-bold ${
                                    profit >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatRupiah(profit)}
                                  </div>
                                  <div className={`text-xs ${getProfitMarginColor()}`}>
                                    {profitMargin}%
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-muted-foreground">
                              No COGS data found for the selected period
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                        {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{' '}
                        {totalCount} items
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-input bg-background rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-input bg-background rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
  );
}
