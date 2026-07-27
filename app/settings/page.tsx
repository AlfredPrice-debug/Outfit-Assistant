"use client";

import { useEffect, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { AskOutfitMC } from "@/components/AskOutfitMC";

type ChatMode = "conversation" | "swipe";

interface Settings {
  preferredChatMode: ChatMode;
  swipeCardCount: number;
  chatFollowUpCount: number;
}

const SWIPE_COUNT_OPTIONS = [2, 3, 4, 5];
const FOLLOW_UP_OPTIONS = [1, 2, 3, 4, 5];

function OptionBox({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-w-11 rounded-small px-4 py-2.5 font-utility text-utility uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool ${
        selected ? "bg-amber text-espresso" : "border border-brass text-espresso"
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't load settings.");
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load settings.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!justSaved) return;
    const id = setTimeout(() => setJustSaved(false), 1500);
    return () => clearTimeout(id);
  }, [justSaved]);

  async function save(next: Settings) {
    const previous = settings;
    setSettings(next);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save settings.");
      setSettings(data.settings);
      setJustSaved(true);
    } catch (err) {
      setSettings(previous);
      setError(err instanceof Error ? err.message : "Couldn't save settings.");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain pt-16">
      <NavHeader current="settings" />
      <main className="flex flex-1 flex-col gap-8 px-5 py-6">
        <h2 className="font-display text-title text-espresso">Settings</h2>

        {error && (
          <p role="alert" className="font-body text-small text-espresso">
            {error}
          </p>
        )}

        {!settings ? (
          <p className="font-body text-small text-espresso">Loading…</p>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h3 className="font-display text-title text-espresso">Preferred Chat Mode</h3>
              <p className="font-body text-body text-espresso">
                New chats start here. Swipe is cards only; Let&rsquo;s Talk can go back and forth.
              </p>
              <div role="radiogroup" aria-label="Preferred chat mode" className="flex gap-3">
                <OptionBox
                  selected={settings.preferredChatMode === "conversation"}
                  onClick={() => save({ ...settings, preferredChatMode: "conversation" })}
                >
                  Let&rsquo;s Talk
                </OptionBox>
                <OptionBox
                  selected={settings.preferredChatMode === "swipe"}
                  onClick={() => save({ ...settings, preferredChatMode: "swipe" })}
                >
                  Swipe
                </OptionBox>
              </div>
            </section>

            <hr className="border-brass" />

            <section className="flex flex-col gap-3">
              <h3 className="font-display text-title text-espresso">Swipe Card Count</h3>
              <p className="font-body text-body text-espresso">How many outfits to generate per swipe stack.</p>
              <div role="radiogroup" aria-label="Swipe card count" className="flex gap-3">
                {SWIPE_COUNT_OPTIONS.map((n) => (
                  <OptionBox
                    key={n}
                    selected={settings.swipeCardCount === n}
                    onClick={() => save({ ...settings, swipeCardCount: n })}
                  >
                    {n}
                  </OptionBox>
                ))}
              </div>
            </section>

            <hr className="border-brass" />

            <section className="flex flex-col gap-3">
              <h3 className="font-display text-title text-espresso">Chat Follow-Up Questions</h3>
              <p className="font-body text-body text-espresso">
                In Let&rsquo;s Talk mode, how many questions Outfit MC can ask before generating outfits regardless.
              </p>
              <div role="radiogroup" aria-label="Chat follow-up questions" className="flex gap-3">
                {FOLLOW_UP_OPTIONS.map((n) => (
                  <OptionBox
                    key={n}
                    selected={settings.chatFollowUpCount === n}
                    onClick={() => save({ ...settings, chatFollowUpCount: n })}
                  >
                    {n}
                  </OptionBox>
                ))}
              </div>
            </section>

            <p role="status" className="text-center font-utility text-utility uppercase text-espresso" aria-live="polite">
              {justSaved ? "Saved" : " "}
            </p>
          </>
        )}
      </main>
      <AskOutfitMC message="This is Settings. Pick whether new chats start with swiping or talking, how many outfits show up per swipe stack, and how many questions I'll ask in Let's Talk mode before I just generate outfits." />
    </div>
  );
}
