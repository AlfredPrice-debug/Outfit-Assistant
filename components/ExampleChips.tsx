"use client";

const EXAMPLES = [
  "summer outfit ideas for a coffee date",
  "smart casual outfit for a work presentation",
  "cozy weekend outfit for a fall hike",
  "what to wear to a rooftop birthday party",
];

export function ExampleChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-5">
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => onPick(example)}
          className="rounded-pill bg-pool px-3 py-2 font-body text-small text-espresso hover:ring-2 hover:ring-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          {example}
        </button>
      ))}
    </div>
  );
}
