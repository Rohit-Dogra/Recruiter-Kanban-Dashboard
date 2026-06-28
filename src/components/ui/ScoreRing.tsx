import * as React from "react"
import { cn } from "@/lib/utils"

export interface ScoreRingProps extends React.SVGAttributes<SVGSVGElement> {
  /** Score value 0–100 */
  score: number
  /** Diameter in px (default 48) */
  size?: number
  /** Stroke width in px (default 4) */
  strokeWidth?: number
  /** Show numeric label in center */
  showLabel?: boolean
}

function scoreColor(score: number): string {
  if (score >= 80) return "hsl(var(--success))"
  if (score >= 60) return "hsl(var(--warning))"
  return "hsl(var(--destructive))"
}

const ScoreRing = React.forwardRef<SVGSVGElement, ScoreRingProps>(
  ({ score, size = 48, strokeWidth = 4, showLabel = true, className, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, score))
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (clamped / 100) * circumference

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Score: ${clamped} out of 100`}
        className={cn("shrink-0", className)}
        {...props}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor(clamped)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
        {showLabel && (
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            className="fill-foreground text-xs font-semibold"
            style={{ fontSize: size * 0.28 }}
          >
            {clamped}
          </text>
        )}
      </svg>
    )
  }
)
ScoreRing.displayName = "ScoreRing"

export { ScoreRing }
