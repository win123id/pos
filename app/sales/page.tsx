"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/currency";
import { Plus, Eye, Calendar, User, ShoppingCart, Edit, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { Header } from "@/components/layout/header";

interface Sale {
  id: number;
  total_price: number;
  created_at: string;
  customer_id?: number | null;
  customers?: {
    name: string;
    email?: string;
    phone?: string;
  } | null;
  sale_items?: {
    id: number;
    product_id: number;
    product: {
      id: number;
      name: string;
      type: 'size' | 'quantity';
      price_per_unit: number;
    };
    quantity?: number;
    width?: number;
    height?: number;
    description: string;
    item_total: number;
  }[];
}

const ITEMS_PER_PAGE = 10;

export default function SalesPage() {
  const supabase = createClient();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, [currentPage]);

  const fetchSales = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get total count
      const { count } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true });

      // Fetch paginated sales with customer information and items
      const { data, error } = await supabase
        .from('sales')
        .select(`
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
        `)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      // Two-step type assertion to handle the type mismatch
      setSales((data || []) as unknown as Sale[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch sales');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }

    try {
      // First delete sale items
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (itemsError) throw itemsError;

      // Then delete the sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (saleError) throw saleError;

      // Refresh the sales list
      await fetchSales();
    } catch (error: any) {
      setError(error.message || 'Failed to delete sale');
    }
  };

  const handleGeneratePDF = async (sale: Sale) => {
    try {
      // Import the PDF generation function
      const { generateSalePDF } = await import('@/lib/currency');
      
      // Generate and download the PDF
      await generateSalePDF(sale);
    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
              <p className="text-muted-foreground text-lg">
                View and manage all your sales transactions
              </p>
            </div>
        <Link 
          href="/sales/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          New Sale
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading sales...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Sale ID</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-left p-3 font-medium">Date & Time</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length > 0 ? (
                      sales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">#{sale.id}</td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">
                                {sale.customers?.name || 'Walk-in Customer'}
                              </p>
                              {sale.customers?.phone && (
                                <p className="text-sm text-muted-foreground">{sale.customers.phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">
                                  {new Date(sale.created_at).toLocaleDateString('id-ID')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(sale.created_at).toLocaleTimeString('id-ID')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatRupiah(sale.total_price)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-2">
                              <Link 
                                href={`/sales/${sale.id}`}
                                className="inline-flex items-center justify-center rounded-lg border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link 
                                href={`/sales/${sale.id}/edit`}
                                className="inline-flex items-center justify-center rounded-lg border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                                title="Edit Sale"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleGeneratePDF(sale)}
                                className="inline-flex items-center justify-center rounded-lg border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSale(sale.id)}
                                className="inline-flex items-center justify-center rounded-lg border border-input bg-background p-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                title="Delete Sale"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <ShoppingCart className="h-12 w-12 opacity-50" />
                            <p>No sales found. Start by creating a new sale.</p>
                            <Link 
                              href="/sales/new"
                              className="text-primary hover:underline"
                            >
                              Create your first sale →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
        </div>
        </div>
      </main>
    </div>
  );
}
