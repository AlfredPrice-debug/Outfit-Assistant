"use client";

import { useState, type FormEvent } from "react";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 flex items-end gap-2 border-t border-brand-200 bg-brand-50 p-3"
    >
      <label htmlFor="chat-input" className="sr-only">
        Describe an occasion, season, or vibe
      </label>
      <textarea
        id="chat-input"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
          }
        }}
        placeholder="e.g. summer outfit ideas for a coffee date"
        disabled={disabled}
        className="min-h-[2.75rem] flex-1 resize-none rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-base text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
