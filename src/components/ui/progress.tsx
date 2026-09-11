import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Paints the bar from a semantic scale instead of the brand gradient. */
  tone?: "brand" | "success" | "warning" | "destructive" | "info"
  /** Adds a travelling highlight — use only for indeterminate-feeling waits. */
  animated?: boolean
}

const tones: Record<NonNullable<ProgressProps["tone"]>, string> = {
  brand: "bg-gradient-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, tone = "brand", animated, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary shadow-inset", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 rounded-full transition-transform duration-700 ease-expo",
          tones[tone],
          animated && "shimmer"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
