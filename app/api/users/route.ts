import { withAdminAuth } from "@/lib/api/admin-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ValidationError, validateType } from "@/lib/api/validation";
import { isNonEmptyString } from "@/lib/api/validation";
import { NextRequest, NextResponse } from "next/server";

async function bestEffortDeleteAuthUser(userId: string) {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch {
    // Ignore rollback failures so the original profile sync error can surface.
  }
}

export async function GET() {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    const usersWithDetails = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          return {
            id: profile.id,
            email: authUser?.user?.email || "No email",
            full_name: profile.full_name || "No name",
            role: profile.role || "user",
            created_at: profile.created_at,
          };
        } catch {
          return {
            id: profile.id,
            email: "No email",
            full_name: profile.full_name || "No name",
            role: profile.role || "user",
            created_at: profile.created_at,
          };
        }
      })
    );

    return NextResponse.json({ data: usersWithDetails });
  } catch (error: any) {
    console.error("Users GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const email = validateRequiredEmail(body?.email);
    const password = validateRequiredPassword(body?.password);
    const fullName = body?.fullName && isNonEmptyString(body.fullName)
      ? body.fullName.trim()
      : null;
    const role = validateType(body?.role, ["admin", "user"], "Role");

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) throw error;
    if (!data.user) throw new Error("User creation returned no user");

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (existingProfileError) {
      await bestEffortDeleteAuthUser(data.user.id);
      throw existingProfileError;
    }

    if (existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: fullName,
          role,
        })
        .eq("id", data.user.id);

      if (profileError) {
        await bestEffortDeleteAuthUser(data.user.id);
        throw profileError;
      }
    } else {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: fullName,
          role,
        });

      if (profileError) {
        await bestEffortDeleteAuthUser(data.user.id);
        throw profileError;
      }
    }

    return NextResponse.json({ data: { success: true, userId: data.user.id } });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Users POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const userId = validateUserId(body?.userId);
    const fullName = body?.fullName && isNonEmptyString(body.fullName)
      ? body.fullName.trim()
      : null;
    const role = validateType(body?.role, ["admin", "user"], "Role");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        role,
      })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Users PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAdminAuth();
    if (!auth.ok) {
      return auth.response;
    }

    const { userId } = await request.json();
    const id = validateUserId(userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Users DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}

function validateRequiredEmail(value: unknown): string {
  if (!isNonEmptyString(value)) {
    throw new ValidationError("Email is required");
  }

  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  return email;
}

function validateRequiredPassword(value: unknown): string {
  if (!isNonEmptyString(value)) {
    throw new ValidationError("Password is required");
  }

  return value;
}

function validateUserId(value: unknown): string {
  if (!isNonEmptyString(value)) {
    throw new ValidationError("User ID is required");
  }

  return value;
}
