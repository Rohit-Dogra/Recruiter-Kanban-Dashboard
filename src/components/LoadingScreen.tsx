import { motion, useReducedMotion } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

/**
 * Full-page loading state. The brand mark sits inside a pulsing ring rather
 * than a generic spinner, so the wait still looks like this product.
 */
const LoadingScreen = ({ message = "Loading…", showLogo = true }: LoadingScreenProps) => {
  const reduce = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex min-h-svh flex-col items-center justify-center gap-7 overflow-hidden bg-background"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora opacity-80" />

      {showLogo && (
        <div className="relative">
          {!reduce && (
            <>
              <span className="absolute inset-0 animate-pulse-ring rounded-[var(--radius-xl)] bg-primary/30" />
              <span
                className="absolute inset-0 animate-pulse-ring rounded-[var(--radius-xl)] bg-primary/20"
                style={{ animationDelay: "0.8s" }}
              />
            </>
          )}
          <motion.div
            animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-primary text-white shadow-glow-lg"
          >
            <LogoMark className="h-8 w-8" />
          </motion.div>
        </div>
      )}

      <div className="relative flex flex-col items-center gap-3">
        {/* Indeterminate track — communicates progress without faking a percentage */}
        <span className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
          <motion.span
            className="block h-full w-1/3 rounded-full bg-gradient-primary"
            animate={reduce ? undefined : { x: ["-100%", "300%"] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
          />
        </span>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
