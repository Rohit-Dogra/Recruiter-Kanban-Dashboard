/**
 * Centralized design tokens for HirerMind.
 *
 * CSS custom properties (defined in src/index.css under :root / .dark) handle
 * theming at runtime.  This file exports the *same* values for programmatic use
 * — e.g. inline styles, chart colors, or any place where Tailwind classes
 * aren't practical.
 *
 * All color values are HSL strings that mirror the CSS variables.
 */

// ── Semantic color tokens (HSL values matching CSS custom properties) ────────

export const colors = {
  /** Core surfaces */
  background: { light: '0 0% 99%', dark: '220 20% 10%' },
  foreground: { light: '224 15% 15%', dark: '210 40% 98%' },

  card: { light: '0 0% 100%', dark: '220 18% 12%' },
  cardForeground: { light: '224 15% 15%', dark: '210 40% 98%' },

  popover: { light: '0 0% 100%', dark: '220 22% 9%' },
  popoverForeground: { light: '224 15% 15%', dark: '210 40% 98%' },

  /** Brand */
  primary: { light: '225 73% 50%', dark: '220 70% 65%' },
  primaryForeground: { light: '0 0% 100%', dark: '222 47% 11%' },

  secondary: { light: '220 14% 96%', dark: '220 18% 16%' },
  secondaryForeground: { light: '220 9% 46%', dark: '210 40% 98%' },

  muted: { light: '220 14% 96%', dark: '220 18% 16%' },
  mutedForeground: { light: '220 9% 46%', dark: '215 20.2% 65.1%' },

  accent: { light: '180 55% 92%', dark: '180 30% 20%' },
  accentForeground: { light: '180 60% 30%', dark: '180 55% 80%' },

  destructive: { light: '0 84% 60%', dark: '0 62.8% 30.6%' },
  destructiveForeground: { light: '0 0% 100%', dark: '210 40% 98%' },

  /** Borders & inputs */
  border: { light: '220 13% 91%', dark: '220 18% 18%' },
  input: { light: '220 13% 91%', dark: '220 18% 18%' },
  ring: { light: '225 73% 50%', dark: '220 70% 65%' },

  /** Status */
  success: { light: '142 76% 36%', dark: '142 76% 36%' },
  successForeground: { light: '0 0% 100%', dark: '0 0% 100%' },
  warning: { light: '38 92% 50%', dark: '38 92% 50%' },
  warningForeground: { light: '0 0% 100%', dark: '0 0% 100%' },
  info: { light: '221 83% 53%', dark: '221 83% 53%' },
  infoForeground: { light: '0 0% 100%', dark: '0 0% 100%' },

  /** Sidebar */
  sidebar: { light: '0 0% 98%', dark: '220 20% 10%' },
  sidebarForeground: { light: '220 15% 26%', dark: '220 15% 90%' },
} as const;

// ── Accent palette for charts, pipeline stages, feature cards, etc. ──────────

export const accentPalette = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  pink: '#ec4899',
  red: '#ef4444',
  green: '#22c55e',
} as const;

// ── Spacing tokens ───────────────────────────────────────────────────────────

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

// ── Border-radius tokens ─────────────────────────────────────────────────────

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

// ── Shadow tokens ────────────────────────────────────────────────────────────

export const shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  elegant: '0 10px 25px -5px hsl(225 73% 50% / 0.1), 0 4px 10px -2px hsl(225 73% 50% / 0.05)',
  glow: '0 0 20px hsl(225 80% 60% / 0.3)',
  card: '0 2px 10px -2px hsl(220 13% 91% / 0.4)',
} as const;

// ── Transition tokens ────────────────────────────────────────────────────────

export const transition = {
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// ── Convenience: all tokens in one object ────────────────────────────────────

export const tokens = {
  colors,
  accentPalette,
  spacing,
  radius,
  shadow,
  transition,
} as const;

export default tokens;
