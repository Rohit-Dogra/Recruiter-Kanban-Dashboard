import * as React from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { AnimatedNumber } from "@/components/motion/AnimatedNumber"
import { Skeleton } from "@/components/ui/skeleton"

type Tone = "brand" | "cyan" | "fuchsia" | "success" | "warning"

const tones: Record<Tone, { icon: string; glow: string; spark: string }> = {
  brand: { icon: "bg-primary/12 text-primary", glow: "from-primary/18", spark: "hsl(var(--primary))" },
  cyan: { icon: "bg-brand-cyan/12 text-brand-cyan", glow: "from-brand-cyan/18", spark: "hsl(var(--brand-cyan))" },
  fuchsia: {
    icon: "bg-brand-fuchsia/12 text-brand-fuchsia",
    glow: "from-brand-fuchsia/18",
    spark: "hsl(var(--brand-fuchsia))",
  },
  success: { icon: "bg-success/12 text-success", glow: "from-success/18", spark: "hsl(var(--success))" },
  warning: { icon: "bg-warning/14 text-warning", glow: "from-warning/18", spark: "hsl(var(--warning))" },
}

export interface StatCardProps extends Omit<HTMLMotionProps<"div">, "title"> {
  title: string
  value: string | number
  icon?: LucideIcon
  /** Percentage change — positive = up, negative = down, 0 = flat. */
  trend?: number
  trendLabel?: string
  /** Accent used for the icon chip, corner glow and sparkline. */
  tone?: Tone
  /** Optional series (6–16 points) rendered as a sparkline behind the value. */
  series?: number[]
  loading?: boolean
  /** Renders a chevron affordance and pointer feedback. */
  onClick?: () => void
}

/** Builds a smooth-ish polyline path for the sparkline. */
function sparkPath(values: number[], w: number, h: number): string {
  if (values.length < 2) return ""
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    { title, value, icon: Icon, trend, trendLabel, tone = "brand", series, loading, className, onClick, ...props },
    ref
  ) => {
    const reduce = useReducedMotion()
    const t = tones[tone]
    const numeric = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""))
    const suffix = typeof value === "string" ? (value.match(/[^0-9.,-]+$/)?.[0] ?? "") : ""
    const canAnimate = Number.isFinite(numeric) && !Number.isNaN(numeric)

    const direction = trend == null ? "flat" : trend > 0 ? "up" : trend < 0 ? "down" : "flat"
    const TrendIcon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus

    if (loading) {
      return (
        <div className={cn("surface-card p-4 sm:p-5", className)}>
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-11 w-11 rounded-[var(--radius-md)]" />
          </div>
          <Skeleton className="mt-4 h-3 w-32" />
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className={cn(
          "surface-card group relative overflow-hidden p-4 transition-[box-shadow,border-color] duration-300 ease-expo sm:p-5",
          "hover:border-primary/25 hover:shadow-lg",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onClick()
                }
              }
            : undefined
        }
        {...props}
      >
        {/* Corner glow reveals on hover */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
            t.glow
          )}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.1em] text-muted-foreground sm:truncate sm:text-[11px]">
              {title}
            </p>
            <p className="font-display text-[1.75rem] font-semibold leading-none tracking-tight text-foreground sm:text-[2rem]">
              {canAnimate ? <AnimatedNumber value={numeric} suffix={suffix} /> : value}
            </p>
          </div>

          {Icon && (
            <div
              aria-hidden
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] sm:h-11 sm:w-11 transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-6",
                t.icon
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          )}
        </div>

        {series && series.length > 1 && (
          <svg
            aria-hidden
            viewBox="0 0 100 28"
            preserveAspectRatio="none"
            className="mt-3 h-8 w-full opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          >
            <defs>
              <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.spark} stopOpacity="0.28" />
                <stop offset="100%" stopColor={t.spark} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${sparkPath(series, 100, 24)} L100,28 L0,28 Z`} fill={`url(#spark-${tone})`} />
            <path
              d={sparkPath(series, 100, 24)}
              fill="none"
              stroke={t.spark}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {trend != null && (
          <div className="relative mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 sm:mt-3.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                direction === "up" && "bg-success/12 text-success",
                direction === "down" && "bg-destructive/12 text-destructive",
                direction === "flat" && "bg-muted text-muted-foreground"
              )}
            >
              <TrendIcon className="h-3 w-3" aria-hidden />
              {direction === "up" ? "+" : ""}
              {trend}%
            </span>
            {trendLabel && (
              <span className="hidden truncate text-xs text-muted-foreground xs:inline">{trendLabel}</span>
            )}
          </div>
        )}
      </motion.div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
