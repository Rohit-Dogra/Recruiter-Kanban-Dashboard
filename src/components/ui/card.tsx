import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ══════════════════════════════════════════════════════════════════════════
   CARD
   `variant` picks the material, `interactive` opts into hover motion.
   Interactive cards get a pointer-tracked spotlight for free.
   ══════════════════════════════════════════════════════════════════════════ */

const cardVariants = cva(
  "relative rounded-2xl text-card-foreground transition-[transform,box-shadow,border-color] duration-300 ease-expo",
  {
    variants: {
      variant: {
        default: "border border-border/70 bg-gradient-card shadow-sm",
        flat: "border border-border/60 bg-surface",
        glass: "glass shadow-md",
        elevated: "border border-border/50 bg-gradient-card shadow-lg",
        outline: "border border-dashed border-border bg-transparent",
        gradient:
          "border border-primary/20 bg-gradient-card shadow-glow before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-aurora before:opacity-60 before:pointer-events-none",
      },
      interactive: {
        true: "group cursor-pointer hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-5",
        lg: "p-6 sm:p-7",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Adds a radial highlight that follows the pointer. */
  spotlight?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, padding, spotlight, children, ...props }, ref) => {
    const innerRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)

    React.useEffect(() => {
      const el = innerRef.current
      if (!el || !spotlight) return
      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`)
        el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`)
      }
      el.addEventListener("pointermove", onMove)
      return () => el.removeEventListener("pointermove", onMove)
    }, [spotlight])

    return (
      <div
        ref={innerRef}
        className={cn(cardVariants({ variant, interactive, padding }), spotlight && "group", className)}
        {...props}
      >
        {spotlight && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--primary) / 0.10), transparent 65%)",
            }}
          />
        )}
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-lg font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-3 p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
