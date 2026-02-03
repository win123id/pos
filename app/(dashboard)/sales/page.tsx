"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/currency";
import { Plus, Eye, Calendar, User, ShoppingCart, Edit, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";

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
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [totalSales, setTotalSales] = useState<number>(0);

  useEffect(() => {
    fetchSales();
  }, [currentPage, selectedMonth, selectedYear]);

  const fetchSales = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(selectedYear && { year: selectedYear }),
        ...(selectedMonth && { month: selectedMonth })
      });

      const response = await fetch(`/api/sales?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales');
      }
      
      const data = await response.json();
      
      setSales(data.data || []);
      setTotalCount(data.totalCount || 0);
      setTotalSales(data.totalSales || 0);
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
      const response = await fetch(`/api/sales?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete sale');
      }

      // Refresh the sales list
      await fetchSales();
    } catch (error: any) {
      setError(error.message || 'Failed to delete sale');
    }
  };

  const handleGeneratePDF = async (sale: Sale, event?: React.MouseEvent<HTMLButtonElement>) => {
    // Get button reference for loading state
    const downloadButton = event?.currentTarget;
    
    try {
      // Show loading state by adding a visual indicator instead of changing icon
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.style.opacity = '0.5';
      }

      // Call server-side PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sale }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get PDF blob
      const pdfBlob = await response.blob();

      // Only proceed if we have actual data
      if (pdfBlob.size > 0) {
        // Create download link
        const pdfUrl = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `invoice-${String(sale.id).padStart(6, '0')}.pdf`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(pdfUrl);
        }, 100);
      } else {
        console.log('Waiting for download manager to handle file...');
      }

    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      // Restore button state (keep the original icon)
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.style.opacity = '1';
      }
    }
  };

  return (
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

      {/* Filters and Total Sales */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
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
                setCurrentPage(1); // Reset to first page when filter changes
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

        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
          <div className="text-sm text-muted-foreground">Total Sales</div>
          <div className="text-xl font-bold text-primary">
            {formatRupiah(totalSales)}
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedYear && selectedMonth 
              ? `For ${new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              : selectedYear 
              ? `For ${selectedYear}`
              : 'All Time'}
          </div>
        </div>
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
                                onClick={(e) => handleGeneratePDF(sale, e)}
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
  );
}
