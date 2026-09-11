import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `shimmer` sweeps a highlight across; `pulse` is the quieter fallback. */
  variant?: "shimmer" | "pulse"
}

/**
 * Placeholder block. Defaults to a sweeping shimmer, which reads as "loading"
 * more clearly than opacity pulsing on large surfaces.
 */
function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-[var(--radius-md)] bg-muted/70",
        variant === "shimmer" ? "shimmer" : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

/** Convenience: n lines of text, last one short like real prose. */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText }
