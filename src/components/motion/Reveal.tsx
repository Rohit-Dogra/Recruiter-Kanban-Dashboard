import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { DUR, EASE } from "@/lib/motion";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 20 },
  down: { x: 0, y: -20 },
  left: { x: 26, y: 0 },
  right: { x: -26, y: 0 },
  none: { x: 0, y: 0 },
};

export interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /** Which way the element travels in from. */
  direction?: Direction;
  delay?: number;
  duration?: number;
  /** Adds a short blur-in — reserved for hero-level content. */
  blur?: boolean;
  /** Replay the reveal every time it scrolls into view. */
  repeat?: boolean;
  as?: React.ElementType;
}

/**
 * Scroll-triggered entrance. Collapses to a plain div when the user has asked
 * for reduced motion, so content is never hidden behind an animation that
 * will not run.
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(
  (
    { direction = "up", delay = 0, duration = DUR.base, blur = false, repeat = false, className, children, ...props },
    ref
  ) => {
    const reduce = useReducedMotion();
    const offset = offsets[direction];

    const variants: Variants = React.useMemo(
      () => ({
        hidden: reduce
          ? { opacity: 0 }
          : { opacity: 0, x: offset.x, y: offset.y, ...(blur ? { filter: "blur(10px)" } : null) },
        show: {
          opacity: 1,
          x: 0,
          y: 0,
          ...(blur ? { filter: "blur(0px)" } : null),
          transition: { duration: reduce ? 0.15 : duration, ease: EASE.expo, delay: reduce ? 0 : delay },
        },
      }),
      [reduce, offset.x, offset.y, blur, duration, delay]
    );

    return (
      <motion.div
        ref={ref}
        className={cn(className)}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: !repeat, amount: 0.15, margin: "0px 0px -60px 0px" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Reveal.displayName = "Reveal";

export interface StaggerProps extends HTMLMotionProps<"div"> {
  /** Gap between each child's entrance, in seconds. */
  gap?: number;
  delay?: number;
  repeat?: boolean;
}

/** Parent that releases `<StaggerItem>` children in sequence. */
export const Stagger = React.forwardRef<HTMLDivElement, StaggerProps>(
  ({ gap = 0.07, delay = 0, className, children, ...props }, ref) => {
    const reduce = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        className={cn(className)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: !props.repeat, amount: 0.1, margin: "0px 0px -60px 0px" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: reduce ? 0 : gap, delayChildren: reduce ? 0 : delay } },
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Stagger.displayName = "Stagger";

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.expo } },
};

export const StaggerItem = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <motion.div ref={ref} className={cn(className)} variants={staggerItemVariants} {...props}>
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = "StaggerItem";
