import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./index.html",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      screens: {
        "2xl": "1320px",
      },
    },
    extend: {
      screens: {
        xs: "420px",
      },
      fontFamily: {
        sans: ["Geist", "Inter Tight", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Geist", "Inter Tight", "system-ui", "sans-serif"],
        accent: ["Instrument Serif", "Georgia", "serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          soft: "hsl(var(--primary-soft))",
        },
        brand: {
          violet: "hsl(var(--brand-violet))",
          indigo: "hsl(var(--brand-indigo))",
          cyan: "hsl(var(--brand-cyan))",
          fuchsia: "hsl(var(--brand-fuchsia))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-aurora": "var(--gradient-aurora)",
        "gradient-card": "var(--gradient-card)",
        "gradient-subtle": "var(--gradient-subtle)",
        "gradient-sheen": "var(--gradient-sheen)",
        "gradient-border": "var(--gradient-border)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
        "glow-lg": "var(--shadow-glow-lg)",
        inset: "var(--shadow-inset)",
        /* Back-compat aliases for older markup */
        elegant: "var(--shadow-lg)",
        card: "var(--shadow-sm)",
      },
      transitionTimingFunction: {
        expo: "var(--ease-out-expo)",
        quart: "var(--ease-out-quart)",
        spring: "var(--ease-spring)",
        soft: "var(--ease-in-out-soft)",
        smooth: "var(--ease-out-quart)",
      },
      transitionDuration: {
        fast: "140ms",
        base: "240ms",
        slow: "420ms",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "2.25rem",
      },
      spacing: {
        4.5: "1.125rem",
        13: "3.25rem",
        18: "4.5rem",
        22: "5.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(3%,-4%,0) scale(1.07)" },
          "66%": { transform: "translate3d(-3%,3%,0) scale(0.96)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "marquee-x": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%, 100%": { transform: "scale(1.7)", opacity: "0" },
        },
        "border-spin": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 220ms var(--ease-out-quart)",
        "accordion-up": "accordion-up 180ms var(--ease-out-quart)",
        "fade-up": "fade-up 480ms var(--ease-out-expo) both",
        "fade-in": "fade-in 320ms var(--ease-out-quart) both",
        "scale-in": "scale-in 240ms var(--ease-out-expo) both",
        "aurora-drift": "aurora-drift 22s var(--ease-in-out-soft) infinite",
        "float-y": "float-y 6s var(--ease-in-out-soft) infinite",
        shimmer: "shimmer 1.9s var(--ease-in-out-soft) infinite",
        marquee: "marquee-x 38s linear infinite",
        "marquee-slow": "marquee-x 64s linear infinite",
        "pulse-ring": "pulse-ring 2.4s var(--ease-out-quart) infinite",
        "border-spin": "border-spin 6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
