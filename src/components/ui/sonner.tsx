import { Toaster as Sonner, toast } from "sonner"
import { useTheme } from "@/contexts/ThemeContext"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Sonner wired to the app's own ThemeContext (it previously read `next-themes`,
 * which nothing in this app sets) and restyled onto the design-system tokens.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      offset={16}
      gap={10}
      visibleToasts={4}
      className="toaster group"
      toastOptions={{
        duration: 4200,
        classNames: {
          toast: [
            "group toast pointer-events-auto",
            "group-[.toaster]:rounded-[var(--radius-lg)] group-[.toaster]:border group-[.toaster]:border-border/70",
            "group-[.toaster]:bg-popover/95 group-[.toaster]:text-foreground",
            "group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-xl",
          ].join(" "),
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-[13px] group-[.toast]:leading-relaxed group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-[var(--radius-sm)] group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:rounded-[var(--radius-sm)] group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground",
          closeButton:
            "group-[.toast]:border-border group-[.toast]:bg-surface group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground",
          success: "group-[.toaster]:border-success/25",
          error: "group-[.toaster]:border-destructive/25",
          warning: "group-[.toaster]:border-warning/30",
          info: "group-[.toaster]:border-info/25",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
