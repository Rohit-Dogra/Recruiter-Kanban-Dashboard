import * as React from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/* ══════════════════════════════════════════════════════════════════════════
   BRAND MARK
   A hand-drawn glyph replaces the generic lucide "Brain" icon the product used
   everywhere: three candidate nodes converging on a single match point. It
   scales cleanly, works in one colour, and is unmistakably this product's.
   ══════════════════════════════════════════════════════════════════════════ */

export function LogoMark({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("h-full w-full", className)}
      {...props}
    >
      {/* Converging paths */}
      <path
        d="M6 8.5C12 8.5 13.5 16 20.5 16M6 16h14.5M6 23.5C12 23.5 13.5 16 20.5 16"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Candidate nodes */}
      <circle cx="6" cy="8.5" r="2.1" fill="currentColor" opacity="0.8" />
      <circle cx="6" cy="16" r="2.1" fill="currentColor" opacity="0.8" />
      <circle cx="6" cy="23.5" r="2.1" fill="currentColor" opacity="0.8" />
      {/* The match */}
      <circle cx="22.5" cy="16" r="4.6" fill="currentColor" />
      <circle cx="22.5" cy="16" r="7.6" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
    </svg>
  );
}

export interface LogoProps {
  /** Hide the wordmark — for collapsed rails and tight chrome. */
  compact?: boolean;
  /** Secondary line under the wordmark. Pass `null` to omit. */
  tagline?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-8 w-8 rounded-[10px]", mark: "h-4 w-4", name: "text-[15px]", tag: "text-[9px]" },
  md: { box: "h-9 w-9 rounded-[11px]", mark: "h-5 w-5", name: "text-base", tag: "text-[9.5px]" },
  lg: { box: "h-11 w-11 rounded-[13px]", mark: "h-6 w-6", name: "text-lg", tag: "text-[10px]" },
};

export function Logo({ compact = false, tagline = BRAND.tagline, className, size = "md" }: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-primary text-white",
          "shadow-glow transition-transform duration-300 ease-spring group-hover:scale-105",
          s.box
        )}
      >
        {/* sheen sweeps on hover */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-sheen transition-transform duration-700 ease-expo group-hover:translate-x-full" />
        <LogoMark className={s.mark} />
      </span>

      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={cn("font-display font-semibold tracking-[-0.02em] text-foreground", s.name)}>
            {BRAND.name}
          </span>
          {tagline && (
            <span className={cn("mt-1 font-mono uppercase tracking-[0.18em] text-muted-foreground", s.tag)}>
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export default Logo;
