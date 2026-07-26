"use client";

import { useEffect, useRef, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { ChatInput } from "@/components/ChatInput";
import { OutfitCard, type OutfitWithId } from "@/components/OutfitCard";
import { SwipeableOutfitStack } from "@/components/SwipeableOutfitStack";
import { Avatar } from "@/components/Avatar";
import { MessageActions } from "@/components/MessageActions";
import { useUserAvatar } from "@/lib/client/useUserAvatar";
import { useAssistantAvatar } from "@/lib/client/useAssistantAvatar";
import { getAssistantAvatar, getUserAvatar } from "@/lib/avatars";
import type { ChatStreamEvent } from "@/lib/streamEvents";
import type { ChatHistoryMessage } from "@/lib/apiTypes";

type UIMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      outfits: OutfitWithId[];
      sourceMessage: string;
      // Present only for messages generated while chatMode was "swipe";
      // conversation-mode messages render the plain static list instead.
      swipeState?: { kept: string[]; discarded: string[] };
    }
  | { id: string; role: "assistant-error"; content: string; sourceMessage: string }
  // Plain Outfit MC text bubbles that aren't outfit results: the intro, the
  // conversation/swipe question, and the follow-up prompt. `choices` is only
  // present on the mode question, and only rendered while chatMode is unset.
  | {
      id: string;
      role: "assistant-note";
      content: string;
      choices?: { label: string; mode: "conversation" | "swipe" }[];
    };

function buildIntroMessages(): UIMessage[] {
  return [
    { id: "intro", role: "assistant-note", content: "Hi, I'm Outfit MC!" },
    {
      id: "mode-question",
      role: "assistant-note",
      content: "How do you want to share your outfits?",
      choices: [
        { label: "Let me swipe!", mode: "swipe" },
        { label: "Let's talk", mode: "conversation" },
      ],
    },
  ];
}

interface PendingState {
  retrying: boolean;
}

// Real progress from the model is just growing JSON, not something worth
// showing a person. A wardrobe joke is a better use of the wait than a raw
// text dump, and it doesn't need to be literally true to feel like progress.
const THINKING_MESSAGES = [
  "Currently butt naked, one sec…",
  "Digging through a thousand shoes…",
  "Interrogating the closet…",
  "Untangling a pile of hangers…",
  "Arguing with itself about socks…",
  "Asking the mirror for a second opinion…",
  "Trying on look number 47…",
  "Googling \"does this match\"…",
];

function formatOutfitsAsText(outfits: OutfitWithId[]): string {
  return outfits
    .map((outfit, i) => {
      const layers = [
        `Top: ${outfit.itemsByLayer.top}`,
        `Bottom: ${outfit.itemsByLayer.bottom}`,
        outfit.itemsByLayer.outerwear ? `Outerwear: ${outfit.itemsByLayer.outerwear}` : null,
        `Shoes: ${outfit.itemsByLayer.shoes}`,
        outfit.itemsByLayer.accessories.length ? `Accessories: ${outfit.itemsByLayer.accessories.join(", ")}` : null,
      ].filter(Boolean);
      return `${i + 1}. ${outfit.title} (${outfit.occasion}, ${outfit.season})\n${layers.join("\n")}\n${outfit.rationale}`;
    })
    .join("\n\n");
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pending, setPending] = useState<PendingState | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<"conversation" | "swipe" | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { key: userAvatarKey } = useUserAvatar();
  const userAvatarSrc = getUserAvatar(userAvatarKey).src;
  const { key: assistantAvatarKey } = useAssistantAvatar();
  const assistantAvatarSrc = getAssistantAvatar(assistantAvatarKey).src;
  const assistantThinkingAvatarSrc = getAssistantAvatar(assistantAvatarKey).thinkingSrc;

  useEffect(() => {
    if (!pending || pending.retrying) return;
    const id = setInterval(() => {
      setThinkingIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [pending, pending?.retrying]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error();
        const data: { messages: ChatHistoryMessage[] } = await res.json();
        if (cancelled) return;
        let lastUserText = "";
        const loaded: UIMessage[] = data.messages.map((m) => {
          if (m.role === "user") {
            lastUserText = m.content ?? "";
            return { id: m.id, role: "user", content: m.content ?? "" };
          }
          return { id: m.id, role: "assistant", outfits: m.outfits ?? [], sourceMessage: lastUserText };
        });
        setMessages(loaded.length > 0 ? loaded : buildIntroMessages());
      } catch {
        if (!cancelled) setBanner("Couldn't load chat history. The database may be unavailable.");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function handleSwipeDecide(messageId: string, outfitId: string, direction: "left" | "right") {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || m.role !== "assistant" || !m.swipeState) return m;
        return {
          ...m,
          swipeState: {
            kept: direction === "right" ? [...m.swipeState.kept, outfitId] : m.swipeState.kept,
            discarded: direction === "left" ? [...m.swipeState.discarded, outfitId] : m.swipeState.discarded,
          },
        };
      }),
    );
  }

  function handleModeChoice(mode: "conversation" | "swipe", label: string) {
    if (chatMode !== null) return;
    setChatMode(mode);
    setMessages((prev) => [
      ...prev,
      { id: `mode-answer-${prev.length}`, role: "user", content: label },
      { id: `ideas-question-${prev.length + 1}`, role: "assistant-note", content: "What ideas are you looking for?" },
    ]);
  }

  function handleSwipeUndo(messageId: string, outfitId: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || m.role !== "assistant" || !m.swipeState) return m;
        return {
          ...m,
          swipeState: {
            kept: m.swipeState.kept.filter((id) => id !== outfitId),
            discarded: m.swipeState.discarded.filter((id) => id !== outfitId),
          },
        };
      }),
    );
  }

  async function sendMessage(text: string) {
    setBanner(null);
    // The conversation/swipe choice is only shown once, on a fresh chat. If
    // the user starts typing instead of clicking a button, it defaults to
    // conversation mode rather than staying unresolved.
    const effectiveMode = chatMode ?? "conversation";
    if (chatMode === null) setChatMode("conversation");
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}-${text.slice(0, 8)}`,
        role: "user",
        content: text,
      },
    ]);
    setThinkingIndex(Math.floor(Math.random() * THINKING_MESSAGES.length));
    setPending({ retrying: false });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong talking to the assistant.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let settled = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event: ChatStreamEvent = JSON.parse(line);
          if (event.type === "chunk") {
            // Real generation progress, but raw JSON isn't meaningful to show.
            // The thinking message rotation above is the visible signal.
          } else if (event.type === "retry") {
            setPending({ retrying: true });
          } else if (event.type === "warning") {
            setBanner(event.message);
          } else if (event.type === "result") {
            settled = true;
            setPending(null);
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${prev.length}`,
                role: "assistant",
                outfits: event.outfits,
                sourceMessage: text,
                swipeState: effectiveMode === "swipe" ? { kept: [], discarded: [] } : undefined,
              },
            ]);
          } else if (event.type === "error") {
            settled = true;
            setPending(null);
            setMessages((prev) => [
              ...prev,
              { id: `assistant-error-${prev.length}`, role: "assistant-error", content: event.message, sourceMessage: text },
            ]);
          }
        }
      }

      if (!settled) {
        setPending(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${prev.length}`,
            role: "assistant-error",
            content: "The connection ended unexpectedly before a response arrived.",
            sourceMessage: text,
          },
        ]);
      }
    } catch (err) {
      setPending(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${prev.length}`,
          role: "assistant-error",
          content: err instanceof Error ? err.message : "Something went wrong talking to the assistant.",
          sourceMessage: text,
        },
      ]);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain pt-16">
      <NavHeader current="chat" />
      <main className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        {banner && (
          <div role="alert" className="mb-4 rounded-small border border-brass bg-butter px-3 py-2 font-body text-small text-espresso">
            {banner}
          </div>
        )}

        <ul className="flex flex-col gap-6">
          {messages.map((message) => (
            <li key={message.id}>
              {message.role === "assistant-note" && (
                <div className="flex flex-col gap-3">
                  <Avatar src={assistantAvatarSrc} label="Outfit MC" />
                  <div className="max-w-[85%] rounded-card border border-brass bg-butter px-4 py-3 font-body text-body text-espresso shadow-card">
                    {message.content}
                  </div>
                  {message.choices && chatMode === null && (
                    <div className="flex gap-2">
                      {message.choices.map((choice) => (
                        <button
                          key={choice.mode}
                          type="button"
                          onClick={() => handleModeChoice(choice.mode, choice.label)}
                          className={
                            choice.mode === "swipe"
                              ? "rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
                              : "rounded-pill border border-brass px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
                          }
                        >
                          {choice.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {message.role === "user" && (
                <div className="ml-auto flex max-w-[85%] items-end justify-end gap-2">
                  <div className="rounded-card bg-amber px-4 py-3 font-body text-body text-espresso shadow-card">
                    {message.content}
                  </div>
                  <Avatar src={userAvatarSrc} label="You" />
                </div>
              )}
              {message.role === "assistant" && (
                <div className="flex flex-col gap-3">
                  <Avatar src={assistantAvatarSrc} label="Outfit MC" />
                  <div className="flex flex-col gap-6">
                    {message.swipeState ? (
                      <>
                        <SwipeableOutfitStack
                          outfits={message.outfits}
                          keptIds={message.swipeState.kept}
                          discardedIds={message.swipeState.discarded}
                          onDecide={(outfitId, direction) => handleSwipeDecide(message.id, outfitId, direction)}
                          onUndo={(outfitId) => handleSwipeUndo(message.id, outfitId)}
                        />
                        {message.outfits
                          .filter((outfit) => message.swipeState!.kept.includes(outfit.id))
                          .map((outfit) => (
                            <OutfitCard key={outfit.id} outfit={outfit} showAddToCloset />
                          ))}
                      </>
                    ) : (
                      message.outfits.map((outfit) => <OutfitCard key={outfit.id} outfit={outfit} />)
                    )}
                  </div>
                  <MessageActions
                    onRetry={() => sendMessage(message.sourceMessage)}
                    onCopy={() => formatOutfitsAsText(message.outfits)}
                  />
                </div>
              )}
              {message.role === "assistant-error" && (
                <div className="flex flex-col gap-3">
                  <Avatar src={assistantAvatarSrc} label="Outfit MC" />
                  <div
                    role="alert"
                    className="max-w-[85%] rounded-card border border-brass bg-butter px-4 py-3 font-body text-body text-espresso shadow-card"
                  >
                    {message.content}
                  </div>
                  <button
                    type="button"
                    onClick={() => sendMessage(message.sourceMessage)}
                    className="w-fit font-utility text-utility uppercase text-deepPool underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
                  >
                    Try again
                  </button>
                </div>
              )}
            </li>
          ))}

          {pending && (
            <li aria-live="polite" className="flex flex-col gap-3">
              <Avatar src={assistantThinkingAvatarSrc} label="Outfit MC" />
              <div className="max-w-[85%] rounded-card border border-brass bg-butter px-4 py-3 font-body text-body text-espresso shadow-card">
                {pending.retrying
                  ? "That didn't come back quite right, trying again…"
                  : THINKING_MESSAGES[thinkingIndex]}
              </div>
            </li>
          )}
        </ul>
        <div ref={bottomRef} />
      </main>
      <ChatInput onSend={sendMessage} disabled={Boolean(pending)} />
    </div>
  );
}
