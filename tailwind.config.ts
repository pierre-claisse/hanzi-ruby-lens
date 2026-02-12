import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        surface: "rgb(var(--color-background) / <alpha-value>)",
        content: "rgb(var(--color-text) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
      },
      fontFamily: {
        hanzi: ['"Noto Sans TC Variable"', "sans-serif"],
        sans: ['"Inter Variable"', "sans-serif"],
      },
      opacity: {
        "8": "0.08",
        "12": "0.12",
        "24": "0.24",
      },
    },
  },
  plugins: [],
} satisfies Config;
