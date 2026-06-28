import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      status: {
        active: "bg-success/15 text-success border border-success/20",
        closed: "bg-muted text-muted-foreground border border-border",
        draft: "bg-warning/15 text-warning border border-warning/20",
        pending: "bg-info/15 text-info border border-info/20",
        processing: "bg-info/15 text-info border border-info/20",
        completed: "bg-success/15 text-success border border-success/20",
        failed: "bg-destructive/15 text-destructive border border-destructive/20",
        scheduled: "bg-info/15 text-info border border-info/20",
        cancelled: "bg-muted text-muted-foreground border border-border",
        hired: "bg-success/15 text-success border border-success/20",
        rejected: "bg-destructive/15 text-destructive border border-destructive/20",
        interviewing: "bg-primary/15 text-primary border border-primary/20",
        offered: "bg-warning/15 text-warning border border-warning/20",
        applied: "bg-info/15 text-info border border-info/20",
        screening: "bg-primary/15 text-primary border border-primary/20",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Show a pulsing dot indicator */
  dot?: boolean
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children ?? status}
    </span>
  )
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
