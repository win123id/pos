import type { ProductType } from "@/lib/sales/types";
import { ceilToNearestThousand } from "@/lib/utils/math";

export function calculateSaleItemTotal(input: {
  productType: ProductType;
  pricePerUnit: number;
  quantity: number;
  width?: number | null;
  height?: number | null;
}) {
  if (input.productType === "quantity") {
    return input.quantity * input.pricePerUnit;
  }

  const width = input.width ?? 0;
  const height = input.height ?? 0;
  const rawTotal = width * height * input.quantity * input.pricePerUnit;
  return ceilToNearestThousand(rawTotal);
}

export function calculateSaleTotal(items: Array<{ item_total: number }>) {
  return items.reduce((sum, item) => sum + item.item_total, 0);
}
