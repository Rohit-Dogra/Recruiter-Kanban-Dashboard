import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders as a full-screen Sheet on mobile (<768px) and a centered Dialog on desktop.
 * Requirement 16.5: Use full-screen sheets instead of centered dialogs below 768px.
 */
export function ResponsiveDialog({ open, onOpenChange, children, className }: ResponsiveDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={`h-[90vh] overflow-y-auto ${className ?? ""}`}>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>{children}</DialogContent>
    </Dialog>
  );
}

export function ResponsiveDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Wrapper = isMobile ? SheetHeader : DialogHeader;
  return <Wrapper className={className}>{children}</Wrapper>;
}

export function ResponsiveDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Wrapper = isMobile ? SheetTitle : DialogTitle;
  return <Wrapper className={className}>{children}</Wrapper>;
}

export function ResponsiveDialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Wrapper = isMobile ? SheetDescription : DialogDescription;
  return <Wrapper className={className}>{children}</Wrapper>;
}

export function ResponsiveDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Wrapper = isMobile ? SheetFooter : DialogFooter;
  return <Wrapper className={className}>{children}</Wrapper>;
}
