import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldBase } from "@/components/ui/input"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  /** Grows with its content instead of scrolling. */
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, autoResize, onChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement)

    const resize = React.useCallback(() => {
      const el = innerRef.current
      if (!el || !autoResize) return
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }, [autoResize])

    React.useEffect(resize, [resize, props.value, props.defaultValue])

    return (
      <textarea
        ref={innerRef}
        aria-invalid={error || undefined}
        onChange={(e) => {
          resize()
          onChange?.(e)
        }}
        className={cn(
          fieldBase,
          "min-h-[104px] resize-y px-3.5 py-3 text-[15px] leading-relaxed md:text-sm",
          autoResize && "resize-none overflow-hidden",
          error && "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/18",
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
