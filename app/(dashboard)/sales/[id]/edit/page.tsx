"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  sale_items?: SaleItemForm[];
}

export default function EditSalePage() {
  const params = useParams();
  const router = useRouter();
  
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("none");
  const [saleItems, setSaleItems] = useState<SaleItemForm[]>([]);
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
      const res = await fetch(`/api/sales/${params.id}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      const data = json.data;

      setOriginalSale(data);
      setSelectedCustomerId(data.customer_id?.toString() || "none");

      const transformedItems = data.sale_items?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product: item.products,
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

  const handleUpdateSale = async () => {
    if (saleItems.length === 0) {
      setError('Please add at least one item to the sale');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await fetch(`/api/sales/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomerId !== "none" ? parseInt(selectedCustomerId) : null,
          items: saleItems
        })
      });

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
          <SaleCustomerSelect
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onChange={setSelectedCustomerId}
          />

          <SaleItemsEditor
            products={products}
            saleItems={saleItems}
            emptyMessage='No items added. Click "Add Item" to get started.'
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
            submitLabel="Update Sale"
            loadingLabel="Updating..."
            onSubmit={handleUpdateSale}
          />
        </div>
      </div>
        </div>
      </main>
    </div>
  );
}
