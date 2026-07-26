"use client";

import { NavHeader } from "@/components/NavHeader";
import { ClosetSection } from "@/components/ClosetSection";
import { AskOutfitMC } from "@/components/AskOutfitMC";

export default function ClosetPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain pt-16">
      <NavHeader current="closet" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <ClosetSection />
      </main>
      <AskOutfitMC message="This is My Closet, where you log what you already own. Add a top, bottom, outerwear, shoes, or an accessory like a watch, and next time you ask me for outfit ideas in chat, I'll mix pieces from here in with new suggestions." />
    </div>
  );
}
