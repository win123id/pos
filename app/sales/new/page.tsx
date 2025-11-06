"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { Header } from "@/components/layout/header";

interface Product {
  id: number;
  name: string;
  type: 'size' | 'quantity';
  price_per_unit: number;
  cost_price?: number;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface SaleItem {
  product_id: number;
  product: Product;
  quantity?: number;
  width?: number;
  height?: number;
  description: string;
  item_total: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("none");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    setProducts(productsData || []);
    setCustomers(customersData || []);
  };

  const addSaleItem = () => {
    if (products.length === 0) return;
    
    const firstProduct = products[0];
    const newItem: SaleItem = {
      product_id: firstProduct.id,
      product: firstProduct,
      quantity: firstProduct.type === 'quantity' ? 1 : undefined,
      width: firstProduct.type === 'size' ? 0 : undefined,
      height: firstProduct.type === 'size' ? 0 : undefined,
      description: '',
      item_total: 0
    };
    setSaleItems([...saleItems, newItem]);
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: any) => {
    const updatedItems = [...saleItems];
    const item = updatedItems[index];
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        item.product = product;
        item.product_id = product.id;
        
        // Reset dimensions based on product type
        if (product.type === 'quantity') {
          item.quantity = 1;
          item.width = undefined;
          item.height = undefined;
        } else {
          item.width = 0;
          item.height = 0;
          item.quantity = undefined;
        }
      }
    } else {
      (item as any)[field] = value;
    }

    // Calculate item total
    if (item.product.type === 'quantity' && item.quantity) {
      item.item_total = item.quantity * item.product.price_per_unit;
    } else if (item.product.type === 'size' && item.width && item.height) {
      // Calculate area in cm² (width in cm × height in cm)
      const areaInCm2 = item.width * item.height;
      item.item_total = areaInCm2 * item.product.price_per_unit;
    }

    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.item_total, 0);
  };

  const handleSaveSale = async () => {
    if (saleItems.length === 0) {
      setError('Please add at least one item to the sale');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const total = calculateTotal();
      
      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_price: total,
          customer_id: selectedCustomerId !== "none" ? parseInt(selectedCustomerId) : null
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItemsToInsert = saleItems.map(item => ({
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

      router.push('/sales');
    } catch (error: any) {
      setError(error.message || 'Failed to save sale');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6 space-y-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
            <p className="text-muted-foreground text-lg">
              Create a new sales transaction
            </p>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
              {error}
            </div>
          )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Selection */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Customer Information</h2>
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer (Optional)</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer or leave empty for walk-in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Walk-in Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sale Items */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Sale Items</h2>
              <Button onClick={addSaleItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            {saleItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No items added. Click "Add Item" to start.
              </p>
            ) : (
              <div className="space-y-6">
                {saleItems.map((item, index) => (
                  <div key={index} className="border rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-lg">Item {index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSaleItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Product</Label>
                        <Select
                          value={item.product_id.toString()}
                          onValueChange={(value) => updateSaleItem(index, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({formatRupiah(product.price_per_unit)}/{product.type === 'size' ? 'cm²' : 'unit'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {item.product.type === 'quantity' ? (
                        <div className="grid gap-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-2">
                            <Label>Width (cm)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.width || 0}
                              onChange={(e) => updateSaleItem(index, 'width', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Height (cm)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.height || 0}
                              onChange={(e) => updateSaleItem(index, 'height', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>Description (Optional)</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updateSaleItem(index, 'description', e.target.value)}
                        placeholder="Add notes or description..."
                      />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <span className="font-semibold text-lg">Item Total:</span>
                        {item.product.type === 'size' && item.width && item.height && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.width}cm × {item.height}cm = {(item.width * item.height).toLocaleString('id-ID')}cm² × {formatRupiah(item.product.price_per_unit)}/cm²
                          </div>
                        )}
                        {item.product.type === 'quantity' && item.quantity && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.quantity} × {formatRupiah(item.product.price_per_unit)}/unit
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-xl text-primary">
                        {formatRupiah(item.item_total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(calculateTotal())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-4 border-t">
                <span>Total:</span>
                <span className="text-primary">{formatRupiah(calculateTotal())}</span>
              </div>
              <Button 
                onClick={handleSaveSale}
                className="w-full" 
                disabled={isLoading || saleItems.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Sale'}
              </Button>
            </div>
          </div>
        </div>
      </div>
        </div>
      </main>
    </div>
  );
}
