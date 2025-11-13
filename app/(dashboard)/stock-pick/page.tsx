"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchStockPrice, fetchMultipleStockPrices, StockPriceData } from "@/lib/yahoo-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, TrendingDown, Target, Shield, X, Save, RefreshCw, Edit } from "lucide-react";

interface StockPick {
  id: string;
  ticker: string;
  companyName: string;
  currentPrice: number;
  support1: number;
  support2: number;
  takeProfit1: number;
  takeProfit2: number;
  notes: string;
  createdAt: string;
  updatedAt?: number;
  livePrice?: StockPriceData;
}

export default function StockPickPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const [stockPicks, setStockPicks] = useState<StockPick[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserRole(profile?.role || 'user');
      }
      setIsLoadingRole(false);
    };

    fetchUserRole();
  }, [supabase]);

  // Fetch stocks from Supabase
  const fetchStocks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stocks:', error);
        return;
      }

      const formattedStocks: StockPick[] = data.map(stock => ({
        id: stock.id,
        ticker: stock.ticker,
        companyName: stock.company_name,
        currentPrice: stock.current_price,
        support1: stock.support1,
        support2: stock.support2,
        takeProfit1: stock.take_profit1,
        takeProfit2: stock.take_profit2,
        notes: stock.notes || '',
        createdAt: stock.created_at,
        updatedAt: new Date(stock.updated_at).getTime()
      }));

      setStockPicks(formattedStocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    // Initial price fetch after stocks are loaded
    if (stockPicks.length > 0 && !isLoadingStocks) {
      fetchLivePrices();
    }
  }, [stockPicks.length, isLoadingStocks]);

  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingStock, setEditingStock] = useState<StockPick | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    ticker: '',
    companyName: '',
    currentPrice: '',
    support1: '',
    support2: '',
    takeProfit1: '',
    takeProfit2: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      ticker: '',
      companyName: '',
      currentPrice: '',
      support1: '',
      support2: '',
      takeProfit1: '',
      takeProfit2: '',
      notes: ''
    });
    setEditingStock(null);
    setIsAddingStock(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Validate that currentPrice is not empty
      if (!formData.currentPrice || parseFloat(formData.currentPrice) === 0) {
        console.error('Current price is required. Please fetch the stock price first.');
        alert('Silakan klik ikon refresh untuk mengambil harga saham terlebih dahulu.');
        return;
      }
      
      const stockData = {
        ticker: formData.ticker.toUpperCase(),
        company_name: formData.companyName,
        current_price: parseFloat(formData.currentPrice),
        support1: parseFloat(formData.support1),
        support2: parseFloat(formData.support2),
        take_profit1: parseFloat(formData.takeProfit1),
        take_profit2: parseFloat(formData.takeProfit2),
        notes: formData.notes,
        user_id: user.id
      };

      if (editingStock) {
        // Update existing stock
        const { error } = await supabase
          .from('stocks')
          .update(stockData)
          .eq('id', editingStock.id);
        
        if (error) {
          console.error('Error updating stock:', error);
          return;
        }
        
        // Update local state to preserve livePrice
        setStockPicks(prevStocks => 
          prevStocks.map(stock => 
            stock.id === editingStock.id 
              ? {
                  ...stock,
                  ticker: stockData.ticker,
                  companyName: stockData.company_name,
                  currentPrice: stockData.current_price,
                  support1: stockData.support1,
                  support2: stockData.support2,
                  takeProfit1: stockData.take_profit1,
                  takeProfit2: stockData.take_profit2,
                  notes: stockData.notes,
                  // Keep existing livePrice and updatedAt
                  livePrice: stock.livePrice,
                  updatedAt: Date.now()
                }
              : stock
          )
        );
      } else {
        // Insert new stock
        const { data, error } = await supabase
          .from('stocks')
          .insert(stockData)
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting stock:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          return;
        }
        
        // Add new stock to local state
        if (data) {
          const newStock: StockPick = {
            id: data.id,
            ticker: data.ticker,
            companyName: data.company_name,
            currentPrice: data.current_price,
            support1: data.support1,
            support2: data.support2,
            takeProfit1: data.take_profit1,
            takeProfit2: data.take_profit2,
            notes: data.notes || '',
            createdAt: data.created_at,
            updatedAt: new Date(data.updated_at).getTime()
          };
          setStockPicks(prevStocks => [newStock, ...prevStocks]);
        }
      }

      resetForm();
    } catch (error) {
      console.error('Error saving stock:', error);
    }
  };

  const handleEdit = (stock: StockPick) => {
    setEditingStock(stock);
    setFormData({
      ticker: stock.ticker,
      companyName: stock.companyName, // Keep for reference but not shown in form
      currentPrice: stock.currentPrice.toString(), // Keep for reference but not shown in form
      support1: stock.support1.toString(),
      support2: stock.support2.toString(),
      takeProfit1: stock.takeProfit1.toString(),
      takeProfit2: stock.takeProfit2.toString(),
      notes: stock.notes
    });
    setIsAddingStock(true);
    
    // Scroll to form after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.getElementById('stock-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus saham ini?')) {
      try {
        const { error } = await supabase
          .from('stocks')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting stock:', error);
          return;
        }

        // Refresh stocks list
        await fetchStocks();
      } catch (error) {
        console.error('Error deleting stock:', error);
      }
    }
  };

  const fetchLivePrices = async () => {
    setIsLoadingPrices(true);
    try {
      const tickers = stockPicks.map(stock => stock.ticker);
      const priceMap = await fetchMultipleStockPrices(tickers);
      
      setStockPicks(prevStocks => 
        prevStocks.map(stock => {
          const livePrice = priceMap.get(stock.ticker);
          return {
            ...stock,
            livePrice: livePrice,
            currentPrice: livePrice?.regularMarketPrice || stock.currentPrice,
            companyName: livePrice?.companyName || stock.companyName
          };
        })
      );
      
      setLastPriceUpdate(new Date());
    } catch (error) {
      console.error('Error fetching live prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  const fetchSingleStockPrice = async (ticker: string) => {
    // Prevent duplicate calls
    if (fetchSingleStockPrice.loading) {
      return;
    }
    
    fetchSingleStockPrice.loading = true;
    
    try {
      const priceData = await fetchStockPrice(ticker);
      if (priceData) {
        // Update form data
        setFormData(prev => ({
          ...prev,
          currentPrice: priceData.regularMarketPrice.toString(),
          companyName: priceData.companyName || prev.companyName
        }));
        
        // Update existing stock card if it exists
        setStockPicks(prevStocks => {
          const updatedStocks = prevStocks.map(stock => {
            if (stock.ticker === ticker) {
              const updatedStock = {
                ...stock,
                currentPrice: priceData.regularMarketPrice,
                companyName: priceData.companyName || stock.companyName,
                livePrice: priceData,
                updatedAt: Date.now()
              };
              
              // Also update the database with new price (fire and forget)
              setTimeout(() => {
                updateStockPrice(stock.id, priceData.regularMarketPrice, priceData.companyName);
              }, 100);
              
              return updatedStock;
            }
            return stock;
          });
          
          return updatedStocks;
        });
        
        // Update last price update time
        setLastPriceUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching single stock price:', error);
    } finally {
      setTimeout(() => {
        fetchSingleStockPrice.loading = false;
      }, 500);
    }
  };
  
  // Add loading flag to function
  fetchSingleStockPrice.loading = false;

  // Update stock price in database
  const updateStockPrice = async (stockId: string, newPrice: number, companyName?: string) => {
    try {
      const updateData: any = {
        current_price: newPrice
      };
      
      if (companyName) {
        updateData.company_name = companyName;
      }
      
      const { error } = await supabase
        .from('stocks')
        .update(updateData)
        .eq('id', stockId);
      
      if (error) {
        console.error('Error updating stock price in database:', error);
      }
    } catch (error) {
      console.error('Error updating stock price:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPriceChangeColor = (current: number, target: number) => {
    if (target > current) return 'text-green-600';
    if (target < current) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = (current: number, target: number) => {
    if (target > current) return <TrendingUp className="h-4 w-4" />;
    if (target < current) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const truncateCompanyName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Stock Pick Indonesia</h1>
                <p className="text-muted-foreground text-lg">
                  Analisis saham dengan support dan take profit
                </p>
              </div>
              {!isLoadingRole && userRole === 'admin' && (
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setIsAddingStock(true)}
                    disabled={isAddingStock}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Saham
                  </Button>
                  <Button 
                    onClick={fetchLivePrices}
                    disabled={isLoadingPrices}
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                    {isLoadingPrices ? 'Memuat...' : 'Refresh Harga'}
                  </Button>
                </div>
              )}
            </div>

            {isAddingStock && (
              <Card id="stock-form">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {editingStock ? 'Edit Saham' : 'Tambah Saham Baru'}
                      </CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="ticker">Kode Saham *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="ticker"
                            value={formData.ticker}
                            onChange={(e) => {
                              const newTicker = e.target.value.toUpperCase();
                              setFormData({ ...formData, ticker: newTicker });
                              
                              // Auto-fetch price when ticker is complete (ends with .JK)
                              if (newTicker.endsWith('.JK') && newTicker.length >= 6) {
                                setTimeout(() => {
                                  fetchSingleStockPrice(newTicker);
                                }, 800); // Longer delay to avoid premature API calls
                              }
                            }}
                            placeholder="BBCA.JK"
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fetchSingleStockPrice(formData.ticker)}
                            disabled={!formData.ticker || formData.ticker.length < 3}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.companyName && (
                          <div className="text-xs text-green-600 mt-1">
                            Company: {formData.companyName}
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="support1">Support 1 *</Label>
                        <Input
                          id="support1"
                          type="number"
                          value={formData.support1}
                          onChange={(e) => setFormData({ ...formData, support1: e.target.value })}
                          placeholder="9000"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="support2">Support 2 *</Label>
                        <Input
                          id="support2"
                          type="number"
                          value={formData.support2}
                          onChange={(e) => setFormData({ ...formData, support2: e.target.value })}
                          placeholder="8750"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="takeProfit1">Take Profit 1 *</Label>
                        <Input
                          id="takeProfit1"
                          type="number"
                          value={formData.takeProfit1}
                          onChange={(e) => setFormData({ ...formData, takeProfit1: e.target.value })}
                          placeholder="9500"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="takeProfit2">Take Profit 2 *</Label>
                        <Input
                          id="takeProfit2"
                          type="number"
                          value={formData.takeProfit2}
                          onChange={(e) => setFormData({ ...formData, takeProfit2: e.target.value })}
                          placeholder="9750"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Catatan</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Analisis atau catatan tambahan"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        {editingStock ? 'Update Saham' : 'Simpan Saham'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Batal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stockPicks.length > 0 ? (
                stockPicks.map((stock) => (
                  <Card 
                    key={`${stock.id}-${stock.updatedAt || stock.createdAt}`} 
                    className={`hover:shadow-lg transition-shadow ${
                      editingStock?.id === stock.id ? 'ring-2 ring-blue-500 shadow-blue-200' : ''
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-2xl font-bold text-blue-600">
                              {stock.ticker}
                            </CardTitle>
                            {editingStock?.id === stock.id && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                <Edit className="h-3 w-3" />
                                Editing
                              </div>
                            )}
                          </div>
                          <CardDescription className="text-sm mt-1 line-clamp-1" title={stock.companyName}>
                            {truncateCompanyName(stock.companyName)}
                          </CardDescription>
                        </div>
                        {!isLoadingRole && userRole === 'admin' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(stock)}
                            >
                              <Target className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(stock.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Current Price */}
                      <div className="text-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Harga Saat Ini</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatCurrency(stock.currentPrice)}
                        </div>
                        {stock.livePrice ? (
                          <div className="mt-1">
                            <div className={`text-xs font-medium ${
                              stock.livePrice.regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stock.livePrice.regularMarketChange >= 0 ? '+' : ''}
                              {stock.livePrice.regularMarketChange.toFixed(2)} ({stock.livePrice.regularMarketChangePercent.toFixed(2)}%)
                            </div>
                            <div className="text-xs text-gray-500">
                              {stock.livePrice.marketState === 'OPEN' ? 'Market Open' : stock.livePrice.marketState === 'REGULAR' ? 'Market Regular' : 'Market Closed'}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <div className="text-xs text-gray-400">
                              No live data
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Support Levels */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                          <Shield className="h-4 w-4" />
                          Support Levels
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-red-50 rounded-lg">
                            <div className="text-xs text-red-600">S1</div>
                            <div className="text-sm font-bold text-red-900">
                              {formatCurrency(stock.support1)}
                            </div>
                            <div className="flex items-center justify-center mt-1">
                              {getPriceChangeIcon(stock.currentPrice, stock.support1)}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded-lg">
                            <div className="text-xs text-red-600">S2</div>
                            <div className="text-sm font-bold text-red-900">
                              {formatCurrency(stock.support2)}
                            </div>
                            <div className="flex items-center justify-center mt-1">
                              {getPriceChangeIcon(stock.currentPrice, stock.support2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Take Profit Levels */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                          <Target className="h-4 w-4" />
                          Take Profit Levels
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="text-xs text-green-600">TP1</div>
                            <div className="text-sm font-bold text-green-900">
                              {formatCurrency(stock.takeProfit1)}
                            </div>
                            <div className="flex items-center justify-center mt-1">
                              {getPriceChangeIcon(stock.currentPrice, stock.takeProfit1)}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="text-xs text-green-600">TP2</div>
                            <div className="text-sm font-bold text-green-900">
                              {formatCurrency(stock.takeProfit2)}
                            </div>
                            <div className="flex items-center justify-center mt-1">
                              {getPriceChangeIcon(stock.currentPrice, stock.takeProfit2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {stock.notes && (
                        <div className="pt-3 border-t">
                          <div className="text-xs text-muted-foreground">
                            <strong>Catatan:</strong> {stock.notes}
                          </div>
                        </div>
                      )}

                      {/* Date */}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Ditambahkan: {new Date(stock.createdAt).toLocaleDateString('id-ID')}
                        {lastPriceUpdate && (
                          <div className="mt-1">
                            Update harga: {lastPriceUpdate.toLocaleTimeString('id-ID')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="p-12 text-center">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Belum ada saham</h3>
                    <p className="text-muted-foreground mb-4">
                      {!isLoadingRole && userRole === 'admin' 
                        ? 'Tambahkan saham pertama untuk memulai analisis Anda'
                        : 'Belum ada data saham yang tersedia'
                      }
                    </p>
                    {!isLoadingRole && userRole === 'admin' && (
                      <Button 
                        onClick={() => setIsAddingStock(true)}
                        variant="outline"
                      >
                        Tambah Saham Pertama →
                      </Button>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
