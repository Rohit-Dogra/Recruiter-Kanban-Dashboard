import * as React from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps extends HTMLMotionProps<"div"> {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  /** A quieter second action — "Learn more", "Import instead". */
  secondaryLabel?: string
  onSecondaryAction?: () => void
  /** `error` swaps the accent to destructive for failure states. */
  tone?: "default" | "error"
  /** Compact fits inside a card or column; full owns the page. */
  size?: "sm" | "md"
}

/**
 * The one component for "there is nothing here (yet)" and "this failed".
 * Gives every empty surface a clear next action instead of a dead end.
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon: Icon,
      title,
      description,
      actionLabel,
      onAction,
      secondaryLabel,
      onSecondaryAction,
      tone = "default",
      size = "md",
      className,
      ...props
    },
    ref
  ) => {
    const reduce = useReducedMotion()
    const isError = tone === "error"

    return (
      <motion.div
        ref={ref}
        role="status"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden rounded-[var(--radius-xl)] text-center",
          "border border-dashed border-border bg-surface-2/40",
          size === "md" ? "gap-3 px-6 py-14" : "gap-2.5 px-5 py-9",
          className
        )}
        {...props}
      >
        {/* Soft radial wash keeps the dashed box from reading as unfinished */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-60",
            isError
              ? "[background:radial-gradient(50%_60%_at_50%_0%,hsl(var(--destructive)/0.08),transparent_70%)]"
              : "[background:radial-gradient(50%_60%_at_50%_0%,hsl(var(--primary)/0.08),transparent_70%)]"
          )}
        />

        {Icon && (
          <div className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-[var(--radius-lg)] blur-xl",
                isError ? "bg-destructive/20" : "bg-primary/20"
              )}
            />
            <div
              aria-hidden
              className={cn(
                "relative flex items-center justify-center rounded-[var(--radius-lg)] border",
                size === "md" ? "h-14 w-14" : "h-11 w-11",
                isError
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : "border-primary/20 bg-primary/10 text-primary"
              )}
            >
              <Icon className={size === "md" ? "h-6 w-6" : "h-5 w-5"} />
            </div>
          </div>
        )}

        <h3
          className={cn(
            "relative font-display font-semibold tracking-tight text-foreground",
            size === "md" ? "text-lg" : "text-base"
          )}
        >
          {title}
        </h3>

        {description && (
          <p className="relative max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}

        {(actionLabel || secondaryLabel) && (
          <div className="relative mt-2 flex flex-col gap-2 sm:flex-row">
            {actionLabel && onAction && (
              <Button variant={isError ? "outline" : "hero"} size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
            {secondaryLabel && onSecondaryAction && (
              <Button variant="ghost" size="sm" onClick={onSecondaryAction}>
                {secondaryLabel}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
