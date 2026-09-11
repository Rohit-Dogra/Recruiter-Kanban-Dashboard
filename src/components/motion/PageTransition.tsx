import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DUR, EASE } from "@/lib/motion";

/**
 * Cross-fades routed content. Keyed on pathname so each page gets its own
 * entrance; `mode="wait"` avoids two pages overlapping mid-scroll.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const location = useLocation();
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className={cn(className)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: DUR.fast, ease: EASE.expo }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Infinite horizontal marquee. Duplicates its children once so the loop is
 * seamless; pauses on hover and freezes under reduced motion.
 */
export function Marquee({
  children,
  speed = "normal",
  reverse = false,
  pauseOnHover = true,
  className,
}: {
  children: React.ReactNode;
  speed?: "normal" | "slow";
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("group relative flex overflow-hidden mask-fade-edges", className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            "flex shrink-0 items-center gap-4 pr-4",
            !reduce && (speed === "slow" ? "animate-marquee-slow" : "animate-marquee"),
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
