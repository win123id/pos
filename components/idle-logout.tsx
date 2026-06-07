"use client";

import { signOutClient } from "@/lib/session/sign-out";
import { useEffect, useRef } from "react";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const LAST_ACTIVITY_KEY = "pos:last-activity-at";

export function IdleLogout() {
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };

    const signOutIfIdle = async () => {
      if (isSigningOutRef.current) {
        return;
      }

      const lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? Date.now());

      if (Date.now() - lastActivityAt < IDLE_TIMEOUT_MS) {
        return;
      }

      isSigningOutRef.current = true;
      await signOutClient({ reason: "idle" });
    };

    updateLastActivity();

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "focus",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, updateLastActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void signOutIfIdle();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        void signOutIfIdle();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    const intervalId = window.setInterval(() => {
      void signOutIfIdle();
    }, CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, updateLastActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
