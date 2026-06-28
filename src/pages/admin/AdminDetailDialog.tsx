import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

export const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

interface AdminDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isLoading?: boolean;
  children: ReactNode;
}

const AdminDetailDialog = ({ open, onOpenChange, title, isLoading, children }: AdminDetailDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pt-2">{children}</div>
      )}
    </DialogContent>
  </Dialog>
);

export default AdminDetailDialog;
