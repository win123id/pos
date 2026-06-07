export type ProductType = "size" | "quantity";

export type SaleItemInput = {
  product_id: number;
  quantity?: number | null;
  width?: number | null;
  height?: number | null;
  description?: string | null;
  item_total?: number;
  product?: {
    id?: number;
    name?: string;
    type?: ProductType;
    price_per_unit?: number;
    cost_price?: number | null;
  };
};

export type CanonicalProduct = {
  id: number;
  name: string;
  type: ProductType;
  price_per_unit: number;
  cost_price: number | null;
};

export type PricedSaleItem = {
  product_id: number;
  quantity: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
  item_total: number;
  price_per_unit: number;
  cost_price: number | null;
};

export type PreparedSalePayload = {
  customerId: number | null;
  totalPrice: number;
  items: PricedSaleItem[];
};

export type SaleWriteResult = {
  sale_id: number;
  total_price: number;
};
