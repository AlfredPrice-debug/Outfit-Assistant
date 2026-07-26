"use client";

import { useEffect, useState } from "react";
import { ASSISTANT_AVATARS, DEFAULT_ASSISTANT_AVATAR_KEY, type AssistantAvatarKey } from "@/lib/avatars";

// Which headshot represents Outfit MC. Same reasoning as useUserAvatar: a
// purely cosmetic, per-browser choice with no database column to attach it to.
const STORAGE_KEY = "outfitme.assistantAvatar";
const VALID_KEYS = new Set<string>(ASSISTANT_AVATARS.map((option) => option.key));

export function useAssistantAvatar() {
  const [key, setKeyState] = useState<AssistantAvatarKey>(DEFAULT_ASSISTANT_AVATAR_KEY);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_KEYS.has(stored)) {
      setKeyState(stored as AssistantAvatarKey);
    }
  }, []);

  function setKey(next: AssistantAvatarKey) {
    setKeyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return { key, setKey };
}
