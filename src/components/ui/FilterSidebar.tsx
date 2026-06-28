import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface FilterSection {
  id: string
  label: string
  content: React.ReactNode
}

export interface FilterSidebarProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  sections: FilterSection[]
  onReset?: () => void
}

const FilterSidebar = React.forwardRef<HTMLElement, FilterSidebarProps>(
  ({ title = "Filters", sections, onReset, className, ...props }, ref) => (
    <aside
      ref={ref}
      role="complementary"
      aria-label={title}
      className={cn("flex w-64 shrink-0 flex-col gap-5 rounded-lg border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 gap-1 px-2 text-xs text-muted-foreground">
            <X className="h-3 w-3" aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>

      {sections.map((section) => (
        <fieldset key={section.id} className="space-y-2">
          <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.label}
          </legend>
          {section.content}
        </fieldset>
      ))}
    </aside>
  )
)
FilterSidebar.displayName = "FilterSidebar"

export { FilterSidebar }
