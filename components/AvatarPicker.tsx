"use client";

import { useState } from "react";
import { Avatar, USER_SELECTABLE_POSES, type AvatarPose } from "./Avatar";

export function AvatarPicker({
  pose,
  onPick,
}: {
  pose: AvatarPose;
  onPick: (pose: AvatarPose) => void;
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
        <Avatar pose={pose} size={32} label="Your avatar" />
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
            className="absolute right-0 top-10 z-20 flex gap-2 rounded-card border border-brass bg-porcelain p-3 shadow-card"
          >
            {USER_SELECTABLE_POSES.map((option) => (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={option === pose}
                onClick={() => {
                  onPick(option);
                  setOpen(false);
                }}
                className={`shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool ${
                  option === pose ? "ring-2 ring-deepPool" : ""
                }`}
              >
                <Avatar pose={option} size={40} label={`Use the ${option} avatar`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
