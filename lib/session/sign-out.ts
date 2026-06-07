import { createClient } from "@/lib/supabase/client";

type SignOutOptions = {
  reason?: "idle";
};

export async function signOutClient(options?: SignOutOptions) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const target = options?.reason === "idle" ? "/auth/login?reason=idle" : "/auth/login";
  window.location.href = target;
}
