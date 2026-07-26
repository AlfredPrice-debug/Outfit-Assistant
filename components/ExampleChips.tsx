"use client";

const EXAMPLES = [
  "summer outfit ideas for a coffee date",
  "smart casual outfit for a work presentation",
  "cozy weekend outfit for a fall hike",
  "what to wear to a rooftop birthday party",
];

export function ExampleChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-4">
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => onPick(example)}
          className="rounded-full border border-brand-200 bg-white px-3 py-2 text-sm text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {example}
        </button>
      ))}
    </div>
  );
}
