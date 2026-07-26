"use client";

import { useEffect, useState } from "react";
import { DEFAULT_USER_AVATAR_KEY, USER_AVATARS, type UserAvatarKey } from "@/lib/avatars";

// There's no User model in this app (see README), so "your avatar" is a
// purely cosmetic, per-browser choice — localStorage is the right amount of
// persistence for it, not a database column.
const STORAGE_KEY = "outfitme.userAvatar";
const VALID_KEYS = new Set<string>(USER_AVATARS.map((option) => option.key));

export function useUserAvatar() {
  const [key, setKeyState] = useState<UserAvatarKey>(DEFAULT_USER_AVATAR_KEY);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_KEYS.has(stored)) {
      setKeyState(stored as UserAvatarKey);
    }
  }, []);

  function setKey(next: UserAvatarKey) {
    setKeyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return { key, setKey };
}
