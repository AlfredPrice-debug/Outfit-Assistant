"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { USER_AVATARS, getUserAvatar, type UserAvatarKey } from "@/lib/avatars";

export function AvatarPicker({
  avatarKey,
  onPick,
}: {
  avatarKey: UserAvatarKey;
  onPick: (key: UserAvatarKey) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Choose your avatar"
        className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
      >
        <Avatar src={getUserAvatar(avatarKey).src} size={32} label="Your avatar" />
      </button>

      {open && (
        <>
          {/* Click-outside catcher */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label="Avatar options"
            className="absolute right-0 top-10 z-20 grid w-max max-w-[min(90vw,320px)] grid-cols-6 gap-2 rounded-card border border-brass bg-porcelain p-3 shadow-card"
          >
            {USER_AVATARS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitemradio"
                aria-checked={option.key === avatarKey}
                onClick={() => {
                  onPick(option.key);
                  setOpen(false);
                }}
                className={`rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool ${
                  option.key === avatarKey ? "ring-2 ring-deepPool" : ""
                }`}
              >
                <Avatar src={option.src} size={40} label={option.label} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
