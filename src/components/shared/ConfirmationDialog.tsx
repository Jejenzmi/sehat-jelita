import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Save, CheckCircle, XCircle, Info } from "lucide-react";
import { ReactNode } from "react";

export type ConfirmationType = "delete" | "save" | "confirm" | "warning" | "info";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmationType;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const iconMap: Record<ConfirmationType, ReactNode> = {
  delete: <Trash2 className="h-6 w-6 text-destructive" />,
  save: <Save className="h-6 w-6 text-primary" />,
  confirm: <CheckCircle className="h-6 w-6 text-success" />,
  warning: <AlertTriangle className="h-6 w-6 text-warning" />,
  info: <Info className="h-6 w-6 text-info" />,
};

const buttonVariantMap: Record<ConfirmationType, string> = {
  delete: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  save: "bg-primary text-primary-foreground hover:bg-primary/90",
  confirm: "bg-success text-white hover:bg-success/90",
  warning: "bg-warning text-white hover:bg-warning/90",
  info: "bg-info text-white hover:bg-info/90",
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  type = "confirm",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              {iconMap[type]}
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={buttonVariantMap[type]}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Memproses...
              </span>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier usage
import { useState, useCallback } from "react";

interface UseConfirmationOptions {
  title: string;
  description: string | ReactNode;
  type?: ConfirmationType;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmationOptions>({
    title: "",
    description: "",
    type: "confirm",
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: UseConfirmationOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolver?.(true);
    setIsOpen(false);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    resolver?.(false);
    setIsOpen(false);
  }, [resolver]);

  const ConfirmDialog = useCallback(
    () => (
      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={options.title}
        description={options.description}
        type={options.type}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [isOpen, options, handleConfirm, handleCancel]
  );

  return { confirm, ConfirmDialog };
}
