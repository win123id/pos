export function getPage(searchParams: URLSearchParams) {
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function getRange(page: number, perPage: number) {
  return {
    from: (page - 1) * perPage,
    to: page * perPage - 1,
  };
}

export function getTotalPages(count: number | null, perPage: number) {
  return Math.ceil((count || 0) / perPage);
}
