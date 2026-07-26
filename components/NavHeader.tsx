"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { Sidebar } from "./Sidebar";
import { useUserAvatar } from "@/lib/client/useUserAvatar";
import { getUserAvatar } from "@/lib/avatars";

export function NavHeader({ current }: { current: "chat" | "saved" | "profile" | "history" }) {
  const { key } = useUserAvatar();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-brass bg-porcelain px-5 py-4">
      <div className="flex items-center gap-3">
        <Sidebar current={current} />
        <h1 className="font-display text-title text-espresso">OutFit Me</h1>
      </div>
      {current !== "profile" && (
        <Link
          href="/profile"
          aria-label="Your profile"
          className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          <Avatar src={getUserAvatar(key).src} size={32} label="Your avatar" />
        </Link>
      )}
    </header>
  );
}
