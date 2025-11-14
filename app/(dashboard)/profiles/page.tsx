"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "user";
  created_at: string;
}

export default function ProfilesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(userError?.message || "No authenticated user");
        }

        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, role, created_at")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile({
          id: user.id,
          email: user.email || "No email",
          full_name: profileRow?.full_name || undefined,
          role: (profileRow?.role as "admin" | "user") || "user",
          created_at: profileRow?.created_at || new Date().toISOString(),
        });

        setName(profileRow?.full_name || "");
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentProfile();
  }, []);

  const handleChangePassword = () => {
    router.push("/auth/update-password");
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);
      setSaveMessage(null);

      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, full_name: name || undefined });
      setSaveMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-lg">
          Manage your personal account information
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !profile ? (
            <div className="text-center py-8">Loading profile...</div>
          ) : !profile ? (
            <div className="text-center py-8 text-muted-foreground">
              No profile found for the current user.
            </div>
          ) : (
            <div className="p-4 border rounded-lg flex flex-col justify-between gap-4">
              <form onSubmit={handleSaveName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{profile.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      profile.role === "admin"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    )}
                  >
                    {profile.role}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>

                {saveMessage && (
                  <div className="text-xs text-green-600">{saveMessage}</div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button type="submit" disabled={isSaving} className="text-xs">
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleChangePassword}
                    variant="outline"
                    className="text-xs"
                  >
                    Change password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
