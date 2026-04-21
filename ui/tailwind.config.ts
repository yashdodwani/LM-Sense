import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0B0F",
        surface: "#12141A",
        "surface-2": "#1A1D26",
        border: "#1E2028",
        "border-2": "#2A2D38",
        accent: "#3B82F6",
        "accent-dim": "#1D4ED8",
        "accent-glow": "rgba(59,130,246,0.15)",
        muted: "#6B7280",
        "muted-fg": "#9CA3AF",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        "danger-dim": "rgba(239,68,68,0.15)",
        "success-dim": "rgba(34,197,94,0.15)",
        "warning-dim": "rgba(245,158,11,0.15)",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-ibm-mono)", "IBM Plex Mono", "monospace"],
        display: ["var(--font-syne)", "Syne", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(59,130,246,0.2)",
        "glow-sm": "0 0 10px rgba(59,130,246,0.15)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern":
          "linear-gradient(rgba(30,32,40,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,32,40,0.5) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
