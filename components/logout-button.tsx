"use client";

import { Button } from "@/components/ui/button";
import { signOutClient } from "@/lib/session/sign-out";

export function LogoutButton() {
  const logout = async () => {
    await signOutClient();
  };

  return <Button onClick={logout}>Logout</Button>;
}
