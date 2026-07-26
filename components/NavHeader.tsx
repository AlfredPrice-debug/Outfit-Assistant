"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Sidebar } from "./Sidebar";
import { useUserAvatar } from "@/lib/client/useUserAvatar";
import { getUserAvatar } from "@/lib/avatars";

export function NavHeader({ current }: { current: "chat" | "saved" | "profile" | "history" | "closet" }) {
  const { key } = useUserAvatar();

  return (
    <header className="fixed inset-x-0 top-0 z-40 mx-auto flex h-16 w-full max-w-app items-center justify-between border-b border-espresso bg-porcelain px-5">
      <Sidebar current={current} />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
        <Image src="/logo-icon.png" alt="" width={20} height={28} aria-hidden="true" />
        <Image src="/logo-wordmark.png" alt="OutFit Me" width={128} height={28} priority />
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
