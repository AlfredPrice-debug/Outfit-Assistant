import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // A warm, neutral palette that reads well as garment-focused UI on a phone.
        brand: {
          50: "#fdf8f3",
          100: "#f7ece0",
          200: "#edd4b8",
          500: "#a8702f",
          600: "#8a5a24",
          700: "#6d451c",
          900: "#3a2410",
        },
      },
    },
  },
  plugins: [],
};

export default config;
