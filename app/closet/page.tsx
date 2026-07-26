"use client";

import { NavHeader } from "@/components/NavHeader";
import { ClosetSection } from "@/components/ClosetSection";

export default function ClosetPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain pt-16">
      <NavHeader current="closet" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <ClosetSection />
      </main>
    </div>
  );
}
