import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f7f5",
        ink: "#141414",
        signal: {
          DEFAULT: "#2f6fed",
          soft: "#e8f0fe",
          dim: "#1d4fb8",
        },
        line: "#e4e2dd",
        "line-dark": "#2a2a2a",
        surface: "#111111",
      },
      fontFamily: {
        display: ["var(--font-display)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      fontSize: {
        base: ["1rem", "1.6"],
      },
    },
  },
  plugins: [],
};
export default config;
