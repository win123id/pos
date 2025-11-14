"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "user";
  created_at: string;
}

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!params?.id) return;
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/users");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch profile");
        }

        const found = (result.data || []).find((u: Profile) => u.id === params.id);
        if (!found) {
          setError("Profile not found");
        } else {
          setProfile(found);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [params?.id]);

  const handleBack = () => {
    router.push("/profiles");
  };

  const handleChangePassword = () => {
    router.push("/auth/update-password");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile Detail</h1>
          <p className="text-muted-foreground text-lg">
            View user information and manage password
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back to profiles
          </Button>
          <Button variant="default" onClick={handleChangePassword}>
            Change password
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && !profile ? (
        <Card>
          <CardContent className="py-10 text-center">Loading profile...</CardContent>
        </Card>
      ) : !profile ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No profile data.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{profile.full_name || "No name"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{profile.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <span
                className={cn(
                  "inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1",
                  profile.role === "admin"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                )}
              >
                {profile.role}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created at</p>
              <p>{new Date(profile.created_at).toLocaleString()}</p>
            </div>

            <div className="pt-4">
              <Button variant="outline" onClick={handleChangePassword}>
                Change password for this user
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
