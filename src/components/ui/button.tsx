import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/* ══════════════════════════════════════════════════════════════════════════
   BUTTON
   Depth model: every raised variant gets a hairline top highlight (inset
   shadow) plus a soft drop shadow, lifts 1px on hover, and sinks on press.
   The `hero` variant adds a sheen that sweeps across on hover.
   ══════════════════════════════════════════════════════════════════════════ */

const buttonVariants = cva(
  [
    "group/btn relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap",
    "font-medium tracking-[-0.01em] ring-offset-background",
    "transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-expo",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    "active:translate-y-px active:scale-[0.985]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-inset hover:-translate-y-px hover:bg-primary/92 hover:shadow-glow",
        hero:
          "bg-gradient-primary text-white shadow-glow hover:-translate-y-px hover:shadow-glow-lg before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-sheen before:transition-transform before:duration-700 before:ease-expo hover:before:translate-x-full",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-inset hover:-translate-y-px hover:bg-destructive/92 hover:shadow-md",
        success:
          "bg-success text-success-foreground shadow-sm shadow-inset hover:-translate-y-px hover:bg-success/92 hover:shadow-md",
        warning:
          "bg-warning text-warning-foreground shadow-sm shadow-inset hover:-translate-y-px hover:bg-warning/92 hover:shadow-md",
        info:
          "bg-info text-info-foreground shadow-sm shadow-inset hover:-translate-y-px hover:bg-info/92 hover:shadow-md",
        outline:
          "border border-border bg-surface/70 text-foreground shadow-xs backdrop-blur-sm hover:-translate-y-px hover:border-border-strong hover:bg-surface-2 hover:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:-translate-y-px hover:bg-secondary/75 hover:shadow-xs",
        ghost:
          "text-muted-foreground hover:bg-secondary hover:text-foreground",
        subtle:
          "bg-primary/10 text-primary hover:bg-primary/16",
        glass:
          "glass text-foreground shadow-sm hover:-translate-y-px hover:shadow-md",
        link:
          "h-auto p-0 text-primary underline-offset-4 hover:underline active:translate-y-0 active:scale-100",
      },
      size: {
        xs: "h-7 rounded-[var(--radius-xs)] px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 rounded-[var(--radius-sm)] px-3.5 text-[13px]",
        default: "h-10 rounded-[var(--radius-md)] px-4 text-sm",
        lg: "h-11 rounded-[var(--radius-md)] px-6 text-sm",
        xl: "h-13 rounded-[var(--radius-lg)] px-8 text-base",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
        "icon-sm": "h-8 w-8 rounded-[var(--radius-sm)] [&_svg]:size-4",
        "icon-lg": "h-11 w-11 rounded-[var(--radius-lg)] [&_svg]:size-5",
      },
      /** Pill geometry for CTAs and filter chips. */
      pill: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Swaps the label for a spinner and blocks interaction. */
  loading?: boolean
  /** Text shown while `loading` (defaults to the normal children). */
  loadingText?: string
  /** Briefly shows a check — drive this from your mutation's success state. */
  success?: boolean
  successText?: string
  /** Rendered before the label. Hidden while loading. */
  icon?: React.ReactNode
  /** Rendered after the label. */
  iconRight?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      pill,
      asChild = false,
      loading = false,
      loadingText,
      success = false,
      successText,
      icon,
      iconRight,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    // `asChild` forwards to a single element (a Link, say) — decorating it with
    // our own spinner/icon markup would break Slot's single-child contract.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, pill, className }))}
          ref={ref}
          disabled={disabled}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    const busy = loading || success

    return (
      <button
        className={cn(buttonVariants({ variant, size, pill, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        data-success={success || undefined}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {success && !loading && <Check className="animate-scale-in" aria-hidden />}
        {!busy && icon}
        <span className={cn("inline-flex items-center gap-2", busy && "contents")}>
          {loading ? loadingText ?? children : success ? successText ?? children : children}
        </span>
        {!busy && iconRight}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
