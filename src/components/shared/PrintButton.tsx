import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  areaId?: string;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

/**
 * PrintButton — prints a specific DOM element (or whole page).
 * Mark the printable container with `id={areaId}` and class `print-area`.
 */
export function PrintButton({
  areaId,
  label = "Cetak",
  className,
  variant = "outline",
  size = "sm",
}: PrintButtonProps) {
  const handlePrint = () => {
    if (!areaId) {
      window.print();
      return;
    }

    const el = document.getElementById(areaId);
    if (!el) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    // Collect all stylesheets
    const stylesheets = Array.from(document.styleSheets)
      .map(ss => {
        try {
          return Array.from(ss.cssRules)
            .map(rule => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cetak</title>
          <style>${stylesheets}</style>
        </head>
        <body>
          ${el.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handlePrint}>
      <Printer className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
