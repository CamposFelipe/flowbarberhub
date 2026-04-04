import type { Config } from "tailwindcss";

// Tailwind v4: cores e temas são configurados em globals.css via @theme inline.
const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};

export default config;
