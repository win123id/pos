"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer } from "@/lib/sales/client-editor";

type SaleCustomerSelectProps = {
  customers: Customer[];
  selectedCustomerId: string;
  onChange: (value: string) => void;
};

export function SaleCustomerSelect({
  customers,
  selectedCustomerId,
  onChange,
}: SaleCustomerSelectProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Customer Information</h2>
      <div className="grid gap-2">
        <Label htmlFor="customer">Customer (Optional)</Label>
        <Select value={selectedCustomerId} onValueChange={onChange}>
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
  );
}
