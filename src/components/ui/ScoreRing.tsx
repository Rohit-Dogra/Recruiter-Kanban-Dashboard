import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Score value 0–100 */
  score: number
  /** Diameter in px (default 52) */
  size?: number
  /** Stroke width in px (default 4) */
  strokeWidth?: number
  /** Show the numeric value in the centre */
  showLabel?: boolean
  /** Small caption under the number, e.g. "match" */
  caption?: string
}

/** Score → semantic colour. Same thresholds everywhere scores are shown. */
function scoreTone(score: number) {
  if (score >= 80) return { stroke: "hsl(var(--success))", text: "text-success", glow: "hsl(var(--success) / 0.35)" }
  if (score >= 60) return { stroke: "hsl(var(--warning))", text: "text-warning", glow: "hsl(var(--warning) / 0.35)" }
  if (score >= 40) return { stroke: "hsl(var(--primary))", text: "text-primary", glow: "hsl(var(--primary) / 0.35)" }
  return { stroke: "hsl(var(--destructive))", text: "text-destructive", glow: "hsl(var(--destructive) / 0.3)" }
}

/**
 * Animated radial score. The arc draws itself on mount (and re-draws when the
 * score changes) so a candidate's match reads as a measurement, not a label.
 */
const ScoreRing = React.forwardRef<HTMLDivElement, ScoreRingProps>(
  ({ score, size = 52, strokeWidth = 4, showLabel = true, caption, className, ...props }, ref) => {
    const reduce = useReducedMotion()
    const clamped = Math.max(0, Math.min(100, Math.round(score)))
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const tone = scoreTone(clamped)

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Score ${clamped} out of 100`}
        {...props}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: reduce ? circumference - (clamped / 100) * circumference : circumference }}
            animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
            transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 4px ${tone.glow})` }}
          />
        </svg>

        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span
              className={cn("font-display font-semibold tabular-nums", tone.text)}
              style={{ fontSize: size * 0.3 }}
            >
              {clamped}
            </span>
            {caption && (
              <span
                className="mt-0.5 font-mono uppercase tracking-wider text-muted-foreground"
                style={{ fontSize: Math.max(7, size * 0.15) }}
              >
                {caption}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)
ScoreRing.displayName = "ScoreRing"

export { ScoreRing, scoreTone }
