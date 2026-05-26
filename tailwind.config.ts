import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        brand: {
          primary: "hsl(var(--brand-primary))",
          "primary-soft": "hsl(var(--brand-primary-soft))",
          secondary: "hsl(var(--brand-secondary))",
          accent: "hsl(var(--brand-accent))",
          surface: "hsl(var(--brand-surface))",
          "surface-2": "hsl(var(--brand-surface-2))",
          card: "hsl(var(--brand-card))",
          border: "hsl(var(--brand-border))",
          "border-strong": "hsl(var(--brand-border-strong))",
          text: "hsl(var(--brand-text))",
          "text-muted": "hsl(var(--brand-text-muted))",
          success: "hsl(var(--brand-success))",
          warning: "hsl(var(--brand-warning))",
          danger: "hsl(var(--brand-danger))",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
