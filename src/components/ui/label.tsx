import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "inline-flex items-center gap-1.5 text-[13px] font-medium leading-none text-foreground/85 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "",
        /** Uppercase micro-label for dense panels and table filters. */
        eyebrow: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /** Appends a subtle required marker. */
  required?: boolean
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, variant, required, children, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant }), className)} {...props}>
      {children}
      {required && (
        <span className="text-destructive" aria-hidden>
          *
        </span>
      )}
    </LabelPrimitive.Root>
  )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label, labelVariants }
