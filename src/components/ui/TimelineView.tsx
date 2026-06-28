import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface TimelineItem {
  id: string | number
  title: string
  description?: string
  date: string
  icon?: LucideIcon
  status?: "completed" | "current" | "upcoming"
}

export interface TimelineViewProps extends React.HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[]
}

const TimelineView = React.forwardRef<HTMLOListElement, TimelineViewProps>(
  ({ items, className, ...props }, ref) => (
    <ol
      ref={ref}
      role="list"
      aria-label="Timeline"
      className={cn("relative space-y-6", className)}
      {...props}
    >
      {items.map((item, idx) => {
        const Icon = item.icon
        const isLast = idx === items.length - 1
        const isCurrent = item.status === "current"
        const isCompleted = item.status === "completed"

        return (
          <li key={item.id} className="relative flex gap-4">
            {/* Connector line */}
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-border"
                aria-hidden="true"
              />
            )}

            {/* Dot / icon */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                isCompleted && "border-success bg-success/15 text-success",
                isCurrent && "border-primary bg-primary/15 text-primary",
                !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground"
              )}
              aria-hidden="true"
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isCompleted && "bg-success",
                    isCurrent && "bg-primary",
                    !isCompleted && !isCurrent && "bg-muted-foreground"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              )}
              <time className="mt-1 block text-xs text-muted-foreground">{item.date}</time>
            </div>
          </li>
        )
      })}
    </ol>
  )
)
TimelineView.displayName = "TimelineView"

export { TimelineView }
