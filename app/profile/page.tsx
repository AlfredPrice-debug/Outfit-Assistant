"use client";

import { useEffect, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { Avatar } from "@/components/Avatar";
import { ClosetSection } from "@/components/ClosetSection";
import { useUserAvatar } from "@/lib/client/useUserAvatar";
import { useAssistantAvatar } from "@/lib/client/useAssistantAvatar";
import { USER_AVATARS, ASSISTANT_AVATARS, getUserAvatar, getAssistantAvatar } from "@/lib/avatars";

function useJustSaved() {
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const id = setTimeout(() => setJustSaved(false), 1500);
    return () => clearTimeout(id);
  }, [justSaved]);

  return [justSaved, setJustSaved] as const;
}

export default function ProfilePage() {
  const { key: userKey, setKey: setUserKey } = useUserAvatar();
  const [userJustSaved, setUserJustSaved] = useJustSaved();

  const { key: assistantKey, setKey: setAssistantKey } = useAssistantAvatar();
  const [assistantJustSaved, setAssistantJustSaved] = useJustSaved();

  function pickUser(nextKey: typeof userKey) {
    if (nextKey === userKey) return;
    setUserKey(nextKey);
    setUserJustSaved(true);
  }

  function pickAssistant(nextKey: typeof assistantKey) {
    if (nextKey === assistantKey) return;
    setAssistantKey(nextKey);
    setAssistantJustSaved(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain">
      <NavHeader current="profile" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar src={getUserAvatar(userKey).src} size={72} label="Your current avatar" />
          <h2 className="font-display text-title text-espresso">Your avatar</h2>
        </div>

        <div role="radiogroup" aria-label="Avatar options" className="grid grid-cols-4 gap-3">
          {USER_AVATARS.map((option) => {
            const selected = option.key === userKey;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => pickUser(option.key)}
                className={`flex flex-col items-center gap-1.5 rounded-card border p-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool ${
                  selected ? "border-deepPool bg-butter" : "border-brass bg-porcelain"
                }`}
              >
                <Avatar src={option.src} size={56} label={option.label} />
                <span className="font-utility text-utility uppercase text-espresso">{option.label}</span>
              </button>
            );
          })}
        </div>

        <p role="status" className="text-center font-utility text-utility uppercase text-espresso" aria-live="polite">
          {userJustSaved ? "Saved" : " "}
        </p>

        <hr className="border-brass" />

        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar src={getAssistantAvatar(assistantKey).src} size={72} label="Outfit MC's current headshot" />
          <h2 className="font-display text-title text-espresso">Outfit MC</h2>
          <p className="max-w-xs font-body text-body text-espresso">
            Pick which headshot Outfit MC uses to greet you and talk you through outfit ideas.
          </p>
        </div>

        <div role="radiogroup" aria-label="Outfit MC headshot options" className="grid grid-cols-3 gap-3">
          {ASSISTANT_AVATARS.map((option) => {
            const selected = option.key === assistantKey;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => pickAssistant(option.key)}
                className={`flex flex-col items-center gap-1.5 rounded-card border p-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool ${
                  selected ? "border-deepPool bg-butter" : "border-brass bg-porcelain"
                }`}
              >
                <Avatar src={option.src} size={56} label={option.label} />
                <span className="font-utility text-utility uppercase text-espresso">{option.label}</span>
              </button>
            );
          })}
        </div>

        <p role="status" className="text-center font-utility text-utility uppercase text-espresso" aria-live="polite">
          {assistantJustSaved ? "Saved" : " "}
        </p>

        <hr className="border-brass" />

        <ClosetSection />
      </main>
    </div>
  );
}
