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
    <header className="fixed inset-x-0 top-0 z-40 mx-auto flex h-16 w-full max-w-app items-center justify-between border-b border-brass bg-porcelain px-5">
      <Sidebar current={current} />
      <Image
        src="/logo-wordmark.png"
        alt="OutFit Me"
        width={128}
        height={28}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        priority
      />
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
