import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // A tinted, blurred scrim reads as depth rather than a flat black wash.
      "fixed inset-0 z-50 bg-[hsl(250_40%_6%/0.55)] backdrop-blur-[6px]",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Hide the built-in close affordance (for flows with their own controls). */
  hideClose?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
        "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain",
        "rounded-[var(--radius-xl)] border border-border/70 bg-popover p-6 text-popover-foreground shadow-xl",
        "duration-300 ease-expo",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=open]:slide-in-from-bottom-2",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]",
        // Full-bleed bottom sheet on phones — far better reach than a centred box.
        "max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0",
        "max-sm:rounded-b-none max-sm:rounded-t-[var(--radius-2xl)] max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        "max-sm:data-[state=open]:slide-in-from-bottom-8",
        className
      )}
      {...props}
    >
      {/* Grab handle — signals the sheet is dismissible on touch */}
      <div
        aria-hidden
        className="mx-auto mb-2 hidden h-1 w-10 shrink-0 rounded-full bg-border-strong max-sm:block"
      />
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          data-compact
          className={cn(
            "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full",
            "text-muted-foreground transition-all duration-200 ease-expo",
            "hover:bg-secondary hover:text-foreground hover:rotate-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 pr-8 text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3",
      "[&>button]:max-sm:w-full",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-xl font-semibold leading-tight tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
