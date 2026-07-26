"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function GateForm({ next, configError }: { next: string; configError: boolean }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(
    configError ? "The app isn't fully configured yet (APP_PASSCODE is missing on the server)." : null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      router.replace(next || "/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="passcode" className="text-sm font-medium text-brand-900">
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoComplete="current-password"
          required
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full rounded-lg border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "passcode-error" : undefined}
        />
      </div>
      {error && (
        <p id="passcode-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || !passcode}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 text-base font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900 disabled:opacity-50"
      >
        {submitting ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
