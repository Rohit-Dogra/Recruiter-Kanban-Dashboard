import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Pipeline / lifecycle state pill. Tones are grouped by meaning so the same
 * colour always means the same thing across jobs, applications and interviews.
 */
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize transition-colors duration-200",
  {
    variants: {
      status: {
        /* neutral / dormant */
        closed: "border-border bg-secondary text-muted-foreground",
        cancelled: "border-border bg-secondary text-muted-foreground",
        archived: "border-border bg-secondary text-muted-foreground",
        /* in-flight */
        pending: "border-info/20 bg-info/10 text-info",
        processing: "border-info/20 bg-info/10 text-info",
        applied: "border-info/20 bg-info/10 text-info",
        scheduled: "border-info/20 bg-info/10 text-info",
        /* active brand states */
        active: "border-success/20 bg-success/10 text-success",
        screening: "border-primary/22 bg-primary/10 text-primary",
        interviewing: "border-primary/22 bg-primary/10 text-primary",
        shortlisted: "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan",
        reviewed: "border-brand-fuchsia/25 bg-brand-fuchsia/10 text-brand-fuchsia",
        /* attention */
        draft: "border-warning/25 bg-warning/12 text-warning",
        offered: "border-warning/25 bg-warning/12 text-warning",
        /* terminal */
        completed: "border-success/20 bg-success/10 text-success",
        hired: "border-success/25 bg-success/12 text-success",
        failed: "border-destructive/20 bg-destructive/10 text-destructive",
        rejected: "border-destructive/20 bg-destructive/10 text-destructive",
      },
      size: {
        sm: "px-2 py-0 text-[10px]",
        default: "",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Show a leading dot; add `pulse` for live states. */
  dot?: boolean
  pulse?: boolean
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, size, dot = false, pulse = false, children, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children ?? status}
    </span>
  )
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
