import { requireAdmin } from "@/lib/authz/require-admin";

export async function withAdminAuth() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { ok: false, response: auth.response };
  }
  return { ok: true };
}

export function forbiddenResponse(action: string) {
  return {
    error: `You don't have permission to ${action} this data.`,
    statusCode: 403,
  };
}

export function handleAdminError(error: { code?: string } | null, action: string) {
  if (error?.code === "42501") {
    return forbiddenResponse(action);
  }
  return null;
}

export function ensureAdminResult<T>(data: T[] | null, action: string) {
  if (!data || data.length === 0) {
    return forbiddenResponse(action);
  }
  return null;
}
