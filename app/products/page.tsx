"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package, Save, X } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Header } from "@/components/layout/header";

interface Product {
  id: number;
  name: string;
  type: 'size' | 'quantity';
  price_per_unit: number;
  cost_price?: number;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const supabase = createClient();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'quantity' as 'size' | 'quantity',
    price_per_unit: '',
    cost_price: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get total count
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch paginated products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'quantity',
      price_per_unit: '',
      cost_price: ''
    });
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name,
        type: formData.type,
        price_per_unit: parseFloat(formData.price_per_unit),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(submitData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(submitData);
        
        if (error) throw error;
      }

      await fetchProducts();
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      type: product.type,
      price_per_unit: product.price_per_unit.toString(),
      cost_price: product.cost_price?.toString() || ''
    });
    setIsAddingProduct(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (error: any) {
      setError(error.message || 'Failed to delete product');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Products</h1>
              <p className="text-muted-foreground text-lg">
                Manage your product inventory
              </p>
            </div>
        <Button 
          onClick={() => setIsAddingProduct(true)}
          disabled={isAddingProduct}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {isAddingProduct && (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Product Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'size' | 'quantity') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantity">Quantity-based</SelectItem>
                    <SelectItem value="size">Size-based (per m²)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price_per_unit">Selling Price per {formData.type === 'size' ? 'm²' : 'unit'}</Label>
                <Input
                  id="price_per_unit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost_price">Cost Price per {formData.type === 'size' ? 'm²' : 'unit'} (Optional)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading products...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Product Name</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Selling Price</th>
                      <th className="text-left p-3 font-medium">Cost Price</th>
                      <th className="text-left p-3 font-medium">Margin</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? (
                      products.map((product) => {
                        const margin = product.cost_price 
                          ? ((product.price_per_unit - product.cost_price) / product.price_per_unit * 100)
                          : 0;
                        
                        return (
                          <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-medium">{product.name}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                                {product.type === 'size' ? 'Size-based' : 'Quantity-based'}
                              </span>
                            </td>
                            <td className="p-3 font-semibold">
                              {formatRupiah(product.price_per_unit)}/{product.type === 'size' ? 'm²' : 'unit'}
                            </td>
                            <td className="p-3">
                              {product.cost_price ? formatRupiah(product.cost_price) : '-'}
                            </td>
                            <td className="p-3">
                              {product.cost_price ? (
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  margin > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {margin.toFixed(1)}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <Package className="h-12 w-12 opacity-50" />
                            <p>No products found. Add your first product to get started.</p>
                            <Button 
                              onClick={() => setIsAddingProduct(true)}
                              variant="outline"
                            >
                              Add your first product →
                            </Button>
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
