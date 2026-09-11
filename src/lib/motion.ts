import type { Transition, Variants } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════════════
   MOTION LANGUAGE
   One vocabulary for the whole product so every surface moves the same way.
   Rule of thumb: entrances are fast + expo-out, exits are faster, and nothing
   that the user is waiting on takes longer than 480ms.
   ══════════════════════════════════════════════════════════════════════════ */

export const EASE = {
  /** Signature entrance curve — quick start, long glide. */
  expo: [0.16, 1, 0.3, 1],
  quart: [0.25, 1, 0.5, 1],
  soft: [0.65, 0, 0.35, 1],
  /** Slight overshoot — use sparingly, on small elements only. */
  back: [0.34, 1.56, 0.64, 1],
} as const;

export const DUR = {
  instant: 0.12,
  fast: 0.2,
  base: 0.34,
  slow: 0.5,
} as const;

/** Physical spring used for pointer-driven motion (magnetics, tilt, cursors). */
export const springs = {
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  soft: { type: "spring", stiffness: 220, damping: 26, mass: 0.9 },
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
} satisfies Record<string, Transition>;

export const transitions = {
  base: { duration: DUR.base, ease: EASE.expo },
  fast: { duration: DUR.fast, ease: EASE.quart },
  slow: { duration: DUR.slow, ease: EASE.expo },
} satisfies Record<string, Transition>;

/* ── Entrance variants ─────────────────────────────────────────────────── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: transitions.base },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -14 },
  show: { opacity: 1, y: 0, transition: transitions.base },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: transitions.base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: transitions.base },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: transitions.base },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: transitions.base },
};

export const blurUp: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: DUR.slow, ease: EASE.expo } },
};

/** Parent container that releases children one after another. */
export const stagger = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Common `whileInView` config — reveal once, slightly before fully on screen. */
export const inView = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.2, margin: "0px 0px -80px 0px" },
} as const;

/* ── Interaction presets ───────────────────────────────────────────────── */

export const hoverLift = {
  whileHover: { y: -4, transition: transitions.fast },
  whileTap: { y: -1, scale: 0.99, transition: { duration: DUR.instant } },
} as const;

export const tapScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: springs.snappy,
} as const;

/* ── Route transitions ─────────────────────────────────────────────────── */

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.expo } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE.quart } },
};

/* ── Overlays (dialogs, sheets, popovers) ──────────────────────────────── */

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.fast } },
  exit: { opacity: 0, transition: { duration: DUR.instant } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: DUR.base, ease: EASE.expo } },
  exit: { opacity: 0, scale: 0.98, y: 6, transition: { duration: DUR.fast, ease: EASE.quart } },
};
