import Link from "next/link";

export function NavHeader({
  current,
  extra,
}: {
  current: "chat" | "saved";
  extra?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-brass px-5 py-4">
      <h1 className="font-display text-title text-espresso">Outfit Me</h1>
      <div className="flex items-center gap-4">
        {extra}
        <nav aria-label="Primary">
          {current === "chat" ? (
            <Link
              href="/saved"
              className="font-utility text-utility uppercase text-deepPool underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
            >
              Saved outfits
            </Link>
          ) : (
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
