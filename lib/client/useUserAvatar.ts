"use client";

import { useEffect, useState } from "react";
import { DEFAULT_USER_POSE, USER_SELECTABLE_POSES, type AvatarPose } from "@/components/Avatar";

// There's no User model in this app (see README), so "your avatar" is a
// purely cosmetic, per-browser choice — localStorage is the right amount of
// persistence for it, not a database column.
const STORAGE_KEY = "outfitme.userAvatar";

export function useUserAvatar() {
  const [pose, setPoseState] = useState<AvatarPose>(DEFAULT_USER_POSE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (USER_SELECTABLE_POSES as string[]).includes(stored)) {
      setPoseState(stored as AvatarPose);
    }
  }, []);

  function setPose(next: AvatarPose) {
    setPoseState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return { pose, setPose };
}
