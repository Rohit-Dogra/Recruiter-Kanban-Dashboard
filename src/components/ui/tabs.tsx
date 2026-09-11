import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const listVariants = cva("text-muted-foreground", {
  variants: {
    variant: {
      /** Segmented control — the sliding pill sits behind the active label. */
      pill: "inline-flex items-center justify-center gap-1 rounded-[var(--radius-lg)] border border-border/60 bg-surface-2 p-1 shadow-inset",
      /** Underlined tabs for page-level navigation. */
      line: "inline-flex items-center gap-1 border-b border-border",
      /** Horizontally scrollable chips — the mobile-friendly option. */
      scroll:
        "no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-[var(--radius-lg)] border border-border/60 bg-surface-2 p-1",
    },
  },
  defaultVariants: { variant: "pill" },
})

const triggerVariants = cva(
  [
    "group relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    "transition-all duration-200 ease-expo",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        pill: [
          "rounded-[var(--radius-md)] px-3.5 py-2 text-muted-foreground",
          "hover:text-foreground",
          "data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        ].join(" "),
        line: [
          "-mb-px rounded-none border-b-2 border-transparent px-3.5 pb-3 pt-2 text-muted-foreground",
          "hover:border-border-strong hover:text-foreground",
          "data-[state=active]:border-primary data-[state=active]:text-foreground",
        ].join(" "),
        scroll: [
          "rounded-[var(--radius-md)] px-3.5 py-2 text-muted-foreground",
          "hover:text-foreground",
          "data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "pill" },
  }
)

type TabsVariant = "pill" | "line" | "scroll"

const TabsVariantContext = React.createContext<TabsVariant>("pill")

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof listVariants>
>(({ className, variant = "pill", ...props }, ref) => (
  <TabsVariantContext.Provider value={(variant ?? "pill") as TabsVariant}>
    <TabsPrimitive.List ref={ref} className={cn(listVariants({ variant }), className)} {...props} />
  </TabsVariantContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof triggerVariants>
>(({ className, variant, ...props }, ref) => {
  const inherited = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(triggerVariants({ variant: variant ?? inherited }), className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "data-[state=active]:animate-fade-up",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
