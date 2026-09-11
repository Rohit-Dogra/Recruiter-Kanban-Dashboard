import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Hairline reading-progress bar pinned to the top of the viewport. Sits above
 * the floating header so it reads as chrome, not content.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-primary"
    />
  );
}

export default ScrollProgress;
