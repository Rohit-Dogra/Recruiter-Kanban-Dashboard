import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: LucideIcon
  /** Percentage change — positive = up, negative = down */
  trend?: number
  trendLabel?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon: Icon, trend, trendLabel, className, ...props }, ref) => {
    const isPositive = trend != null && trend >= 0

    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {trend != null && (
          <div className="mt-3 flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}
            >
              {isPositive ? "+" : ""}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
