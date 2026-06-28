import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export type SkeletonVariant = "cards" | "table" | "split" | "kanban"

export interface PageSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: SkeletonVariant
  /** Number of placeholder items (default 6 for cards/kanban, 5 for table rows) */
  count?: number
}

function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border p-5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-border">
      {/* Header */}
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {[1, 2, 3, 4].map((c) => (
          <Skeleton key={c} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {[1, 2, 3, 4].map((c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SplitSkeleton() {
  return (
    <div className="flex gap-4">
      {/* List */}
      <div className="w-2/5 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      {/* Detail */}
      <div className="flex-1 space-y-4 rounded-lg border border-border p-5">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  )
}

function KanbanSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto">
      {Array.from({ length: count }, (_, col) => (
        <div key={col} className="w-72 shrink-0 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="space-y-2 rounded-lg border border-border bg-card p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
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
      aria-label="Loading content"
      className={cn("animate-in fade-in-50", className)}
      {...props}
    >
      <span className="sr-only">Loading…</span>
      {variant === "cards" && <CardsSkeleton count={count} />}
      {variant === "table" && <TableSkeleton count={count} />}
      {variant === "split" && <SplitSkeleton />}
      {variant === "kanban" && <KanbanSkeleton count={count} />}
    </div>
  )
)
PageSkeleton.displayName = "PageSkeleton"

export { PageSkeleton }
