import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-all duration-200 ease-expo focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary hover:bg-primary/18",
        solid: "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70",
        destructive: "border-destructive/20 bg-destructive/12 text-destructive hover:bg-destructive/18",
        success: "border-success/20 bg-success/12 text-success hover:bg-success/18",
        warning: "border-warning/25 bg-warning/14 text-warning hover:bg-warning/20",
        info: "border-info/20 bg-info/12 text-info hover:bg-info/18",
        outline: "border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground",
        glass: "glass text-foreground",
        gradient: "border-transparent bg-gradient-primary text-white shadow-xs",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-0.5 text-[11px]",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Leading dot — use for live/state badges. */
  dot?: boolean
  /** Animates the dot. Only meaningful with `dot`. */
  pulse?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, pulse, children, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </div>
  )
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
