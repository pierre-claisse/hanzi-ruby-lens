import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        vermillion: "rgb(var(--color-vermillion) / <alpha-value>)",
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
