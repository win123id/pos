import { NextResponse } from "next/server";

export function forbiddenMutationResponse(action: string) {
  return NextResponse.json(
    { error: `You don't have permission to ${action} this data.` },
    { status: 403 },
  );
}

export function handleAdminMutationError(
  error: { code?: string } | null,
  action: string,
) {
  if (error?.code === "42501") {
    return forbiddenMutationResponse(action);
  }

  return null;
}

export function ensureAdminMutationResult<T>(
  data: T[] | null,
  action: string,
) {
  if (!data || data.length === 0) {
    return forbiddenMutationResponse(action);
  }

  return null;
}
