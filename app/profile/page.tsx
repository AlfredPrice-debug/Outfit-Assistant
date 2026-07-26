"use client";

import { useEffect, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { Avatar } from "@/components/Avatar";
import { useUserAvatar } from "@/lib/client/useUserAvatar";
import { USER_AVATARS, getUserAvatar } from "@/lib/avatars";

export default function ProfilePage() {
  const { key, setKey } = useUserAvatar();
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const id = setTimeout(() => setJustSaved(false), 1500);
    return () => clearTimeout(id);
  }, [justSaved]);

  function pick(nextKey: typeof key) {
    if (nextKey === key) return;
    setKey(nextKey);
    setJustSaved(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain">
      <NavHeader current="profile" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar src={getUserAvatar(key).src} size={72} label="Your current avatar" />
          <h2 className="font-display text-title text-espresso">Your avatar</h2>
          <p className="max-w-xs font-body text-body text-espresso">
            There&apos;s no photo upload here — pick a character to stand in for you in chat instead.
          </p>
        </div>

        <div role="radiogroup" aria-label="Avatar options" className="grid grid-cols-4 gap-3">
          {USER_AVATARS.map((option) => {
            const selected = option.key === key;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => pick(option.key)}
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
          {justSaved ? "Saved" : " "}
        </p>
      </main>
    </div>
  );
}
