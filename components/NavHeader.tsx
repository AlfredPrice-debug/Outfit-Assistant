"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { useUserAvatar } from "@/lib/client/useUserAvatar";
import { getUserAvatar } from "@/lib/avatars";

export function NavHeader({ current }: { current: "chat" | "saved" | "profile" }) {
  const { key } = useUserAvatar();

  return (
    <header className="flex items-center justify-between border-b border-brass px-5 py-4">
      <h1 className="font-display text-title text-espresso">Outfit Me</h1>
      <div className="flex items-center gap-4">
        {current !== "profile" && (
          <Link
            href="/profile"
            aria-label="Your profile"
            className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
          >
            <Avatar src={getUserAvatar(key).src} size={32} label="Your avatar" />
          </Link>
        )}
        <nav aria-label="Primary">
          {current === "chat" && (
            <Link
              href="/saved"
              className="font-utility text-utility uppercase text-deepPool underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
            >
              Saved outfits
            </Link>
          )}
          {(current === "saved" || current === "profile") && (
            <Link
              href="/"
              className="font-utility text-utility uppercase text-deepPool underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
            >
              Back to chat
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
