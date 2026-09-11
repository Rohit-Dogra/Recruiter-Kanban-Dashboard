import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Fades out at both ends — softer than a hard rule inside cards. */
  soft?: boolean
}

const Separator = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, soft, ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        soft ? "bg-transparent" : "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        soft &&
          (orientation === "horizontal"
            ? "bg-gradient-to-r from-transparent via-border to-transparent"
            : "bg-gradient-to-b from-transparent via-border to-transparent"),
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
