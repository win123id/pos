"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/currency";
import type { Product, SaleItemForm } from "@/lib/sales/client-editor";
import { Plus, Trash2 } from "lucide-react";

type SaleItemsEditorProps = {
  products: Product[];
  saleItems: SaleItemForm[];
  emptyMessage: string;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof SaleItemForm, value: string | number) => void;
};

export function SaleItemsEditor({
  products,
  saleItems,
  emptyMessage,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: SaleItemsEditorProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Sale Items</h2>
        <Button onClick={onAddItem} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {saleItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{emptyMessage}</p>
      ) : (
        <div className="space-y-6">
          {saleItems.map((item, index) => (
            <div key={item.id ?? index} className="border rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-lg">Item {index + 1}</h4>
                <Button variant="outline" size="sm" onClick={() => onRemoveItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Product</Label>
                  <Select
                    value={item.product_id.toString()}
                    onValueChange={(value) => onUpdateItem(index, "product_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({formatRupiah(product.price_per_unit)}/
                          {product.type === "size" ? "cm²" : "unit"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {item.product.type === "quantity" ? (
                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => onUpdateItem(index, "quantity", parseInt(e.target.value) || 1)}
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
                        onChange={(e) => onUpdateItem(index, "width", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Height (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.height || 0}
                        onChange={(e) => onUpdateItem(index, "height", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) => onUpdateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Description (Optional)</Label>
                <Input
                  value={item.description || ""}
                  onChange={(e) => onUpdateItem(index, "description", e.target.value)}
                  placeholder="Add notes or description..."
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <span className="font-semibold text-lg">Item Total:</span>
                  {item.product.type === "size" && item.width && item.height && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.width}cm × {item.height}cm = {(item.width * item.height).toLocaleString("id-ID")}
                      cm² × {formatRupiah(item.product.price_per_unit)}/cm²
                    </div>
                  )}
                  {item.product.type === "quantity" && item.quantity && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.quantity} × {formatRupiah(item.product.price_per_unit)}/unit
                    </div>
                  )}
                </div>
                <span className="font-bold text-xl text-primary">{formatRupiah(item.item_total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
