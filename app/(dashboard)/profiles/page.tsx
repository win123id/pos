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
  avatar_url?: string | null;
}

export default function ProfilesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

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
          .select("full_name, role, created_at, avatar_url")
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
          avatar_url: profileRow?.avatar_url || null,
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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      setIsUploadingAvatar(true);
      setAvatarMessage(null);
      setError(null);

      // Basic validation
      const maxSizeBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeBytes) {
        throw new Error("Avatar must be smaller than 2MB.");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Avatar must be a JPG, PNG, or WebP image.");
      }

      const supabase = createClient();

      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${profile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "0",
          upsert: true,
        });
      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: cacheBustedUrl })
        .eq("id", profile.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: cacheBustedUrl });
      setAvatarMessage("Avatar updated successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update avatar");
    } finally {
      setIsUploadingAvatar(false);
      // Clear the file input value so the same file can be re-selected if needed
      event.target.value = "";
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
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm font-medium">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{(profile.full_name || profile.email || "?").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={isUploadingAvatar}
                    />
                    {avatarMessage && (
                      <p className="text-xs text-green-600">{avatarMessage}</p>
                    )}
                    {isUploadingAvatar && (
                      <p className="text-xs text-muted-foreground">Uploading avatar...</p>
                    )}
                  </div>
                </div>

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
