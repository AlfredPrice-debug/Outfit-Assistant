import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The full palette, and nothing outside it, see DESIGN.md-equivalent
        // rules in the project brief. Every surface, border, and text color
        // in the app resolves to one of these seven.
        porcelain: "#FFFFFF",
        butter: "#EFC673",
        brass: "#C79340",
        amber: "#B5801B",
        pool: "#45B2D4",
        deepPool: "#1B7A99",
        espresso: "#2A211C",
      },
      fontFamily: {
        // Grandstander is the bubble display face: title and card titles
        // only. Nunito is body prose. Outfit (the font, not the app) is the
        // small-caps-style utility face for labels and button text.
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        utility: ["var(--font-utility)", "sans-serif"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "1.15" }],
        title: ["24px", { lineHeight: "1.25" }],
        lead: ["18px", { lineHeight: "1.4" }],
        body: ["16px", { lineHeight: "1.5" }],
        small: ["14px", { lineHeight: "1.4" }],
        utility: ["12px", { lineHeight: "1.3", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        card: "24px",
        pill: "9999px",
        small: "12px",
      },
      boxShadow: {
        // The one soft shadow the design allows: outfit cards and chat
        // message bubbles, giving each a slight raised, shaded feel.
        card: "0 4px 16px rgba(42, 33, 28, 0.10)",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
