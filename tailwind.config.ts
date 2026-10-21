import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#08030e",
          panel: "#160527",
          border: "#5710a4",
          human: "#a000ff",
          ai: "#00f2ff",
          gold: "#ffd000",
        },
        // New theme colors
        yellow: "#ffd000",
        purple: "#a78bfa",
        "purple-light": "#e9d8fd",
        "purple-dark": "#6b46c1",
      },
      backgroundImage: {
        "purple-gradient":
          "linear-gradient(180deg, var(--purple-light, #e9d8fd), var(--purple-dark, #6b46c1))",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "flash": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "pop-in": "pop-in 250ms ease-out",
        "flash": "flash 700ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
