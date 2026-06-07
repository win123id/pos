"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SaleCustomerSelect } from "@/app/(dashboard)/sales/_components/sale-customer-select";
import { SaleItemsEditor } from "@/app/(dashboard)/sales/_components/sale-items-editor";
import { SaleSummaryCard } from "@/app/(dashboard)/sales/_components/sale-summary-card";
import {
  calculateSaleItemsTotal,
  createEmptySaleItem,
  Customer,
  Product,
  recalculateSaleItem,
  SaleItemForm,
  setSaleItemProduct,
} from "@/lib/sales/client-editor";

export default function NewSalePage() {
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("none");
  const [saleItems, setSaleItems] = useState<SaleItemForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/customers")
      ]);

      const productsJson = await productsRes.json();
      const customersJson = await customersRes.json();

      setProducts(productsJson.data || []);
      setCustomers(customersJson.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load products or customers");
    }
  };

  const addSaleItem = () => {
    if (products.length === 0) return;
    setSaleItems([...saleItems, createEmptySaleItem(products[0])]);
  };

  const updateSaleItem = (index: number, field: keyof SaleItemForm, value: string | number) => {
    const updatedItems = [...saleItems];
    let item = { ...updatedItems[index] };
    
    if (field === 'product_id') {
      const productId = typeof value === "string" ? parseInt(value, 10) : Number(value);
      const product = products.find((p) => p.id === productId);
      if (product) {
        item = setSaleItemProduct(item, product);
      }
    } else {
      if (field === "description") {
        item.description = String(value);
      }

      if (field === "quantity" || field === "width" || field === "height") {
        item[field] = Number(value);
      }

      item = recalculateSaleItem(item);
    }

    updatedItems[index] = item;
    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return calculateSaleItemsTotal(saleItems);
  };

  const handleSaveSale = async () => {
    if (saleItems.length === 0) {
      setError('Please add at least one item to the sale');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: selectedCustomerId !== "none" ? parseInt(selectedCustomerId) : null,
          items: saleItems
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save sale');
      }

      router.push('/sales');
    } catch (error: any) {
      setError(error.message || 'Failed to save sale');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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
          <SaleCustomerSelect
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onChange={setSelectedCustomerId}
          />

          <SaleItemsEditor
            products={products}
            saleItems={saleItems}
            emptyMessage='No items added. Click "Add Item" to start.'
            onAddItem={addSaleItem}
            onRemoveItem={removeSaleItem}
            onUpdateItem={updateSaleItem}
          />
        </div>

        <div className="space-y-8">
          <SaleSummaryCard
            total={calculateTotal()}
            isLoading={isLoading}
            disabled={saleItems.length === 0}
            submitLabel="Save Sale"
            loadingLabel="Saving..."
            onSubmit={handleSaveSale}
          />
        </div>
      </div>
    </div>
  );
}
