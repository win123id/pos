"use client";

import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/currency";
import { Save } from "lucide-react";

type SaleSummaryCardProps = {
  total: number;
  isLoading: boolean;
  disabled?: boolean;
  submitLabel: string;
  loadingLabel: string;
  onSubmit: () => void;
};

export function SaleSummaryCard({
  total,
  isLoading,
  disabled,
  submitLabel,
  loadingLabel,
  onSubmit,
}: SaleSummaryCardProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 sticky top-24">
      <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatRupiah(total)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-4 border-t">
          <span>Total:</span>
          <span className="text-primary">{formatRupiah(total)}</span>
        </div>
        <Button onClick={onSubmit} className="w-full" disabled={disabled || isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? loadingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}
