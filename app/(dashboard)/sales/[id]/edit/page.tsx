"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  id?: number;
  product_id: number;
  product: Product;
  quantity?: number;
  width?: number;
  height?: number;
  description: string;
  item_total: number;
}

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
  sale_items?: SaleItem[];
}

const roundToNearestThousand = (amount: number) => {
  return amount % 1000 === 0 ? amount : Math.ceil(amount / 1000) * 1000;
};

export default function EditSalePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("none");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [originalSale, setOriginalSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchSaleData();
      fetchProductsAndCustomers();
    }
  }, [params.id]);

  const fetchSaleData = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name, email, phone),
          sale_items(
            *,
            products(name, type, price_per_unit, cost_price)
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      
      setOriginalSale(data);
      setSelectedCustomerId(data.customer_id?.toString() || "none");
      
      // Transform sale items to the expected format
      const transformedItems = data.sale_items?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product: {
          id: item.products.id,
          name: item.products.name,
          type: item.products.type,
          price_per_unit: item.products.price_per_unit,
          cost_price: item.products.cost_price
        },
        quantity: item.quantity,
        width: item.width,
        height: item.height,
        description: item.description || '',
        item_total: item.item_total
      })) || [];
      
      setSaleItems(transformedItems);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch sale data');
    }
  };

  const fetchProductsAndCustomers = async () => {
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
    } else if (item.product.type === 'size' && item.width && item.height && item.quantity) {
      // Calculate area in cm² (width in cm × height in cm) × quantity
      const areaInCm2 = item.width * item.height;
      const rawTotal = areaInCm2 * item.product.price_per_unit * item.quantity;
      item.item_total = roundToNearestThousand(rawTotal);
    } else {
      item.item_total = 0;
    }

    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.item_total, 0);
  };

  const handleUpdateSale = async () => {
    if (saleItems.length === 0) {
      setError('Please add at least one item to the sale');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const total = calculateTotal();
      
      // Update sale
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          total_price: total,
          customer_id: selectedCustomerId !== "none" ? parseInt(selectedCustomerId) : null
        })
        .eq('id', params.id);

      if (saleError) throw saleError;

      // Delete existing sale items
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', params.id);

      if (deleteError) throw deleteError;

      // Create new sale items
      const saleItemsToInsert = saleItems.map(item => ({
        sale_id: parseInt(params.id as string),
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
      setError(error.message || 'Failed to update sale');
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !originalSale) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/sales"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Link>
        </div>
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg text-center">
          {error}
        </div>
      </div>
    );
  }

  if (!originalSale) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/sales"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Link>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Loading sale data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6 space-y-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/sales"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sales
            </Link>
          </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Edit Sale</h1>
        <p className="text-muted-foreground text-lg">
          Modify sale #{originalSale.id}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Sale Items</h2>
              <Button onClick={addSaleItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {saleItems.length > 0 ? (
              <div className="space-y-6">
                {saleItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Item {index + 1}</h3>
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
                          <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 1)}
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
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No items added. Click "Add Item" to get started.</p>
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
                onClick={handleUpdateSale}
                className="w-full" 
                disabled={isLoading || saleItems.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Updating...' : 'Update Sale'}
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
