import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  
  // If user is authenticated, redirect to POS dashboard
  if (data?.claims) {
    redirect("/protected");
  }
  
  // If not authenticated, middleware will redirect to login
  // This page should not be reachable without authentication
  return null;
}
