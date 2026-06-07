import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type AdminContext = {
  userId: string;
};

type AdminResult =
  | { ok: true; context: AdminContext }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: userError?.message || "No authenticated user" },
        { status: 401 },
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      ),
    };
  }

  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return {
    ok: true,
    context: {
      userId: user.id,
    },
  };
}
