import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface MagneticProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  /** How far the element follows the cursor, in px. */
  strength?: number;
  /** The inner content trails slightly further for a parallax feel. */
  innerStrength?: number;
  disabled?: boolean;
}

/**
 * Wraps a control so it leans toward the pointer. Pointer-capable devices only —
 * on touch, and under reduced-motion, it renders as a plain wrapper.
 */
export const Magnetic = React.forwardRef<HTMLDivElement, MagneticProps>(
  ({ strength = 10, innerStrength = 4, disabled = false, className, children, ...props }, ref) => {
    const reduce = useReducedMotion();
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const [canHover, setCanHover] = React.useState(false);
    React.useEffect(() => {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      setCanHover(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }, []);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.6 });
    const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.6 });
    const innerX = useTransform(sx, (v) => (v / strength) * innerStrength);
    const innerY = useTransform(sy, (v) => (v / strength) * innerStrength);

    const active = canHover && !disabled && !reduce;

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!active || !localRef.current) return;
      const rect = localRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(relX * strength * 2);
      y.set(relY * strength * 2);
    };

    const reset = () => {
      x.set(0);
      y.set(0);
    };

    // Touch devices and reduced-motion users get the element, no pointer physics.
    if (!active) {
      return (
        <motion.div ref={localRef} className={cn("inline-flex", className)} {...props}>
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={localRef}
        className={cn("inline-flex", className)}
        style={{ x: sx, y: sy }}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        {...props}
      >
        <motion.div style={{ x: innerX, y: innerY }} className="inline-flex w-full">
          {children}
        </motion.div>
      </motion.div>
    );
  }
);
Magnetic.displayName = "Magnetic";

export interface TiltProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  /** Max rotation in degrees. */
  max?: number;
  /** Adds a light sheen that tracks the pointer. */
  glare?: boolean;
  scale?: number;
}

/** 3D pointer tilt for cards. Degrades to a static card without a fine pointer. */
export const Tilt = React.forwardRef<HTMLDivElement, TiltProps>(
  ({ max = 7, glare = true, scale = 1.01, className, children, style, ...props }, ref) => {
    const reduce = useReducedMotion();
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const [canHover, setCanHover] = React.useState(false);
    React.useEffect(() => {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      setCanHover(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }, []);

    const px = useMotionValue(0.5);
    const py = useMotionValue(0.5);
    const srx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 240, damping: 24 });
    const sry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 240, damping: 24 });

    const active = canHover && !reduce;

    const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!active || !localRef.current) return;
      const rect = localRef.current.getBoundingClientRect();
      px.set((e.clientX - rect.left) / rect.width);
      py.set((e.clientY - rect.top) / rect.height);
      localRef.current.style.setProperty("--glare-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      localRef.current.style.setProperty("--glare-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };

    const onLeave = () => {
      px.set(0.5);
      py.set(0.5);
    };

    if (!active) {
      return (
        <motion.div ref={localRef} className={className} style={style} {...props}>
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={localRef}
        className={cn("relative [transform-style:preserve-3d]", className)}
        style={{ rotateX: srx, rotateY: sry, transformPerspective: 900, ...(style as object) }}
        whileHover={{ scale }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        {...props}
      >
        {children}
        {glare && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [background:radial-gradient(240px_circle_at_var(--glare-x,50%)_var(--glare-y,50%),hsl(var(--primary)/0.14),transparent_70%)] group-hover:opacity-100"
          />
        )}
      </motion.div>
    );
  }
);
Tilt.displayName = "Tilt";

/**
 * Follows the pointer with a soft radial highlight. Pair with `group` on the
 * parent — used on cards, list rows and nav items.
 */
export function Spotlight({ className, size = 320 }: { className?: string; size?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100",
        className
      )}
      style={{
        background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--primary) / 0.12), transparent 65%)`,
      }}
    />
  );
}
