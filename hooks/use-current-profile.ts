"use client";

import { useEffect, useState } from "react";

export type CurrentProfile = {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "user";
  created_at: string;
  avatar_url: string | null;
};

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/profiles", {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch profile");
        }

        setProfile(result.profile || null);
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }

        setError(err.message || "Failed to fetch profile");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [reloadToken]);

  return {
    profile,
    isLoading,
    error,
    refresh: () => setReloadToken((value) => value + 1),
  };
}
