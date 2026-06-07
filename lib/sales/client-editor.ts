export type Product = {
  id: number;
  name: string;
  type: "size" | "quantity";
  price_per_unit: number;
  cost_price?: number;
};

export type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
};

export type SaleItemForm = {
  id?: number;
  product_id: number;
  product: Product;
  quantity?: number;
  width?: number;
  height?: number;
  description: string;
  item_total: number;
};

export function roundToNearestThousand(amount: number) {
  return amount % 1000 === 0 ? amount : Math.ceil(amount / 1000) * 1000;
}

export function createEmptySaleItem(product: Product): SaleItemForm {
  return {
    product_id: product.id,
    product,
    quantity: product.type === "quantity" ? 1 : undefined,
    width: product.type === "size" ? 0 : undefined,
    height: product.type === "size" ? 0 : undefined,
    description: "",
    item_total: 0,
  };
}

export function recalculateSaleItem(item: SaleItemForm): SaleItemForm {
  if (item.product.type === "quantity" && item.quantity) {
    return {
      ...item,
      item_total: item.quantity * item.product.price_per_unit,
    };
  }

  if (item.product.type === "size" && item.width && item.height && item.quantity) {
    const areaInCm2 = item.width * item.height;
    const rawTotal = areaInCm2 * item.product.price_per_unit * item.quantity;

    return {
      ...item,
      item_total: roundToNearestThousand(rawTotal),
    };
  }

  return {
    ...item,
    item_total: 0,
  };
}

export function setSaleItemProduct(item: SaleItemForm, product: Product): SaleItemForm {
  return recalculateSaleItem({
    ...item,
    product,
    product_id: product.id,
    quantity: product.type === "quantity" ? 1 : undefined,
    width: product.type === "size" ? 0 : undefined,
    height: product.type === "size" ? 0 : undefined,
  });
}

export function calculateSaleItemsTotal(items: SaleItemForm[]) {
  return items.reduce((sum, item) => sum + item.item_total, 0);
}
