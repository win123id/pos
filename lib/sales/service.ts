import { calculateSaleItemTotal, calculateSaleTotal } from "@/lib/sales/pricing";
import type {
  CanonicalProduct,
  PreparedSalePayload,
  PricedSaleItem,
  SaleItemInput,
} from "@/lib/sales/types";
import { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export class SaleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaleValidationError";
  }
}

function asPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function normalizeCustomerId(customerId: unknown) {
  if (customerId === null || customerId === undefined) {
    return null;
  }

  const parsed = Number(customerId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeDescription(description: string | null | undefined) {
  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

function normalizeItemInput(item: SaleItemInput) {
  return {
    productId: Number(item.product_id),
    quantity: item.quantity == null ? null : Number(item.quantity),
    width: item.width == null ? null : Number(item.width),
    height: item.height == null ? null : Number(item.height),
    description: normalizeDescription(item.description),
  };
}

async function loadCanonicalProducts(
  supabase: ServerSupabase,
  productIds: number[],
) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, type, price_per_unit, cost_price")
    .in("id", productIds);

  if (error) {
    throw new Error(error.message || "Failed to load products");
  }

  return new Map<number, CanonicalProduct>(
    (data || []).map((product) => [product.id, product as CanonicalProduct]),
  );
}

function priceSaleItem(
  input: ReturnType<typeof normalizeItemInput>,
  product: CanonicalProduct,
): PricedSaleItem {
  if (!Number.isInteger(input.productId) || input.productId <= 0) {
    throw new SaleValidationError("Each sale item must have a valid product");
  }

  if (!asPositiveNumber(input.quantity)) {
    throw new SaleValidationError(
      `Product \"${product.name}\" requires a quantity greater than 0`,
    );
  }

  if (product.type === "size") {
    if (!asPositiveNumber(input.width) || !asPositiveNumber(input.height)) {
      throw new SaleValidationError(
        `Product \"${product.name}\" requires width and height greater than 0`,
      );
    }
  }

  const quantity = input.quantity as number;
  const width = product.type === "size" ? (input.width as number) : null;
  const height = product.type === "size" ? (input.height as number) : null;

  const itemTotal = calculateSaleItemTotal({
    productType: product.type,
    pricePerUnit: product.price_per_unit,
    quantity,
    width,
    height,
  });

  return {
    product_id: product.id,
    quantity,
    width,
    height,
    description: input.description,
    item_total: itemTotal,
    price_per_unit: product.price_per_unit,
    cost_price: product.cost_price,
  };
}

export async function prepareSalePayload(
  supabase: ServerSupabase,
  input: {
    customerId?: unknown;
    items: SaleItemInput[];
  },
): Promise<PreparedSalePayload> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new SaleValidationError("At least one item is required");
  }

  const normalizedItems = input.items.map(normalizeItemInput);
  const productIds = [...new Set(normalizedItems.map((item) => item.productId))];

  if (productIds.some((productId) => !Number.isInteger(productId) || productId <= 0)) {
    throw new SaleValidationError("Each sale item must have a valid product");
  }

  const productsById = await loadCanonicalProducts(supabase, productIds);

  const items = normalizedItems.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new SaleValidationError(`Product ${item.productId} was not found`);
    }

    return priceSaleItem(item, product);
  });

  return {
    customerId: normalizeCustomerId(input.customerId),
    totalPrice: calculateSaleTotal(items),
    items,
  };
}
