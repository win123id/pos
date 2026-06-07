import { requireAdmin } from '@/lib/authz/require-admin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Get auth users for each profile
    const usersWithDetails = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          return {
            id: profile.id,
            email: authUser.user?.email || 'No email',
            full_name: profile.full_name || 'No name',
            role: profile.role || 'user',
            created_at: profile.created_at
          };
        } catch (err) {
          return {
            id: profile.id,
            email: 'No email',
            full_name: profile.full_name || 'No name',
            role: profile.role || 'user',
            created_at: profile.created_at
          };
        }
      })
    );

    return NextResponse.json({ data: usersWithDetails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { email, password, fullName, role } = await request.json();

    // Create user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) throw error;

    // Update the profile created by trigger with full_name and role
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          role: role
        })
        .eq('id', data.user.id);

      if (profileError) throw profileError;
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { userId, fullName, role } = await request.json();

    // Update profiles table
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: fullName,
        role: role
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { userId } = await request.json();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
