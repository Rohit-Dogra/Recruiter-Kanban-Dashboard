import * as React from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

export interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  /** Decimal places to render. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Insert thousands separators. */
  separator?: boolean;
  /** Count-up duration in seconds. */
  duration?: number;
}

/**
 * Counts up to `value` the first time it scrolls into view, then re-animates
 * whenever `value` changes. Writes straight to the DOM node rather than through
 * state, so a page full of counters costs one render, not sixty per second.
 * Under prefers-reduced-motion it renders the final number immediately.
 */
export const AnimatedNumber = React.forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  (
    { value, decimals = 0, prefix = "", suffix = "", separator = true, duration = 1.4, className, ...props },
    ref
  ) => {
    const localRef = React.useRef<HTMLSpanElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLSpanElement);

    const reduce = useReducedMotion();
    const inView = useInView(localRef, { once: true, amount: 0.3 });

    const format = React.useCallback(
      (n: number) => {
        const fixed = n.toFixed(decimals);
        if (!separator) return `${prefix}${fixed}${suffix}`;
        const [int, dec] = fixed.split(".");
        const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `${prefix}${dec ? `${withSep}.${dec}` : withSep}${suffix}`;
      },
      [decimals, separator, prefix, suffix]
    );

    React.useEffect(() => {
      const node = localRef.current;
      if (!node) return;

      if (reduce) {
        node.textContent = format(value);
        return;
      }
      if (!inView) return;

      const controls = animate(0, value, {
        duration,
        ease: EASE.expo,
        onUpdate: (latest) => {
          node.textContent = format(latest);
        },
      });
      return () => controls.stop();
    }, [inView, value, reduce, duration, format]);

    return (
      <span ref={localRef} className={cn("tabular-nums", className)} {...props}>
        {format(reduce ? value : 0)}
      </span>
    );
  }
);
AnimatedNumber.displayName = "AnimatedNumber";
