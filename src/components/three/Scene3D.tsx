import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/contexts/ThemeContext";

/* The whole three.js bundle lives behind this boundary — it is never part of
   the initial chunk, and never downloaded at all on devices that cannot use it. */
const TalentCore = React.lazy(() => import("@/components/three/TalentCore"));

/** Cheap WebGL capability probe, run once per session. */
function useWebGL(): boolean | null {
  const [supported, setSupported] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

/** CSS stand-in shown while the scene loads, and wherever WebGL is unavailable. */
function CoreFallback({ animated = true }: { animated?: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden>
      <div
        className={cn(
          "absolute h-52 w-52 rounded-full bg-gradient-hero opacity-30 blur-3xl sm:h-64 sm:w-64",
          animated && "animate-aurora-drift"
        )}
      />
      <div
        className={cn(
          "relative h-40 w-40 rounded-full border border-primary/30 sm:h-52 sm:w-52",
          "bg-[radial-gradient(circle_at_30%_25%,hsl(var(--primary)/0.35),transparent_60%)]",
          "shadow-glow-lg backdrop-blur-sm",
          animated && "animate-float-y"
        )}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "absolute rounded-full border border-primary/15",
            i === 0 && "h-60 w-60 sm:h-72 sm:w-72",
            i === 1 && "h-72 w-72 sm:h-96 sm:w-96",
            i === 2 && "h-80 w-80 sm:h-[26rem] sm:w-[26rem]",
            animated && "animate-[border-spin_var(--d)_linear_infinite]"
          )}
          style={{ ["--d" as string]: `${18 + i * 9}s` }}
        />
      ))}
    </div>
  );
}

export interface Scene3DProps {
  className?: string;
}

/**
 * Decides whether the hero gets real 3D, a still frame, or the CSS fallback:
 *   • reduced motion  → 3D rendered once, then frozen
 *   • no WebGL        → CSS fallback, no download
 *   • small screens   → 3D at reduced quality (fewer nodes, cheap material)
 */
export function Scene3D({ className }: Scene3DProps) {
  const reduce = useReducedMotion();
  const webgl = useWebGL();
  const isSmall = useMediaQuery("(max-width: 767px)");
  const isCoarse = useMediaQuery("(pointer: coarse)");
  const { isDark } = useTheme();

  if (webgl === null) {
    return (
      <div className={cn("relative", className)}>
        <CoreFallback animated={false} />
      </div>
    );
  }

  if (!webgl) {
    return (
      <div className={cn("relative", className)}>
        <CoreFallback animated={!reduce} />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <React.Suspense fallback={<CoreFallback animated={!reduce} />}>
        <TalentCore
          className="h-full w-full"
          still={!!reduce}
          quality={isSmall || isCoarse ? "low" : "high"}
          tone={isDark ? "dark" : "light"}
        />
      </React.Suspense>
    </div>
  );
}

export default Scene3D;
