import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode color palette with #ff422e accent
        "background": "#F5F5F5", // 🔄 Gray background
        "foreground": "#1A1A1A",
        "card": "#FFFFFF", // 🔄 White card
        "card-foreground": "#1A1A1A",
        "popover": "#FFFFFF",
        "popover-foreground": "#1A1A1A",
        "primary": "#37383C", // 🔄 Dark gray accent
        "primary-foreground": "#FFFFFF",
        "secondary": "#F5F5F5",
        "secondary-foreground": "#1A1A1A",
        "muted": "#F5F5F5",
        "muted-foreground": "#737373",
        "accent": "#37383C", // 🔄 Dark gray accent
        "accent-foreground": "#FFFFFF",
        "destructive": "#EF4444",
        "destructive-foreground": "#FFFFFF",
        "border": "#E5E5E5",
        "input": "#F0F0F0",
        "ring": "#262626", // 🔄 Gray 800 for focus state
        // Additional gray scale for light mode
        "gray": {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0A0A0A",
        },
      },
      borderRadius: {
        "sm": "0.375rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
      },
      spacing: {
        "xs": "0.25rem",
        "sm": "0.5rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "3rem",
        "4xl": "4rem",
      },
      boxShadow: {
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
      fontFamily: {
        "sans": ["Inter, Pretendard, ui-sans-serif, system-ui, sans-serif"],
        "mono": ["ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"],
      },
      fontSize: {
        "xs": ["0.75rem", { lineHeight: "1rem" }],
        "sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "base": ["1rem", { lineHeight: "1.5rem" }],
        "lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "xl": ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
