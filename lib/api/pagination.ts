import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ITEMS_PER_PAGE = 10;

export function getPage(request: NextRequest): number {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function getRange(page: number, perPage: number = DEFAULT_ITEMS_PER_PAGE) {
  return {
    from: (page - 1) * perPage,
    to: page * perPage - 1,
  };
}

export function getTotalPages(count: number | null, perPage: number = DEFAULT_ITEMS_PER_PAGE) {
  return Math.ceil((count || 0) / perPage);
}

export { DEFAULT_ITEMS_PER_PAGE };
