import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export type SkeletonVariant = "cards" | "table" | "split" | "kanban" | "stats"

export interface PageSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: SkeletonVariant
  /** Number of placeholder items (default 6 for cards/kanban, 5 for table rows) */
  count?: number
}

/* Skeletons mirror the real layout closely enough that nothing jumps when the
   data lands — same radii, same spacing, same column counts. */

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="surface-card p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-11 w-11 rounded-[var(--radius-md)]" />
          </div>
          <Skeleton className="mt-4 h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="surface-card space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-1.5 pt-1.5">
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border/70">
      <div className="flex gap-4 border-b border-border bg-surface-2/70 px-4 py-3">
        {[40, 24, 20, 16].map((w, i) => (
          <Skeleton key={i} className="h-3" style={{ flex: w }} />
        ))}
      </div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border/50 px-4 py-3.5 last:border-0">
          {[40, 24, 20, 16].map((w, c) => (
            <Skeleton key={c} className="h-3.5" style={{ flex: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function SplitSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="space-y-2.5 lg:w-2/5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/70 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="surface-card flex-1 space-y-4 p-5">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
      </div>
    </div>
  )
}

function KanbanSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:overflow-x-auto">
      {Array.from({ length: count }, (_, col) => (
        <div
          key={col}
          className="w-full shrink-0 space-y-2.5 rounded-[var(--radius-xl)] border border-border/70 bg-surface-2/50 p-3 lg:w-[288px]"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-4 w-24" />
          </div>
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="space-y-2 rounded-[var(--radius-lg)] border border-border/70 bg-surface p-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const PageSkeleton = React.forwardRef<HTMLDivElement, PageSkeletonProps>(
  ({ variant, count, className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      className={cn("animate-fade-in", className)}
      {...props}
    >
      <span className="sr-only">Loading…</span>
      {variant === "stats" && <StatsSkeleton count={count} />}
      {variant === "cards" && <CardsSkeleton count={count} />}
      {variant === "table" && <TableSkeleton count={count} />}
      {variant === "split" && <SplitSkeleton />}
      {variant === "kanban" && <KanbanSkeleton count={count} />}
    </div>
  )
)
PageSkeleton.displayName = "PageSkeleton"

export { PageSkeleton }
