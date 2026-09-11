import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  /** Node pinned inside the left edge (an icon, usually). */
  startAdornment?: React.ReactNode
  /** Node pinned inside the right edge (a reveal toggle, unit, action). */
  endAdornment?: React.ReactNode
  /** Paints the destructive state and wires aria-invalid. */
  error?: boolean
}

/* Shared field chrome — reused by Textarea and SelectTrigger so every control
   in a form reads as the same material. */
export const fieldBase = [
  "w-full rounded-[var(--radius-md)] border border-input bg-surface-2/60 text-foreground",
  "shadow-xs transition-[border-color,box-shadow,background-color] duration-200 ease-expo",
  "placeholder:text-muted-foreground/70",
  "hover:border-border-strong hover:bg-surface-2",
  "focus-visible:border-primary/60 focus-visible:bg-surface focus-visible:outline-none",
  "focus-visible:ring-[3px] focus-visible:ring-primary/18",
  "disabled:cursor-not-allowed disabled:opacity-55",
].join(" ")

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, endAdornment, error, ...props }, ref) => {
    const field = (
      <input
        type={type}
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          fieldBase,
          "h-11 px-3.5 py-2 text-[15px] md:h-10 md:text-sm",
          "file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium file:text-secondary-foreground",
          error &&
            "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/18",
          startAdornment && "pl-10",
          endAdornment && "pr-10",
          className
        )}
        {...props}
      />
    )

    if (!startAdornment && !endAdornment) return field

    return (
      <div className="relative w-full">
        {startAdornment && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-4">
            {startAdornment}
          </span>
        )}
        {field}
        {endAdornment && (
          <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-4">
            {endAdornment}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
