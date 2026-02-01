import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface PrintReceiptProps {
  billing: {
    invoice_number: string;
    billing_date: string;
    payment_date?: string;
    payment_method?: string;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    paid_amount?: number;
    status: string;
  };
  patient: {
    full_name: string;
    medical_record_number: string;
    address?: string;
  };
  items: {
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  onPrint?: () => void;
}

export function PrintReceipt({ billing, patient, items, onPrint }: PrintReceiptProps) {
  const { hospitalInfo } = useSystemSettings();
  const printRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Kwitansi ${billing.invoice_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 18px; }
              .header p { margin: 2px 0; font-size: 12px; color: #666; }
              .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .info-section { font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #f5f5f5; }
              .totals { text-align: right; font-size: 12px; }
              .total-row { font-weight: bold; font-size: 14px; }
              .footer { margin-top: 40px; display: flex; justify-content: space-between; }
              .signature { text-align: center; width: 150px; }
              .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    onPrint?.();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text(hospitalInfo.name, 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(hospitalInfo.address, 105, 27, { align: "center" });
    doc.text(`Tel: ${hospitalInfo.phone} | Email: ${hospitalInfo.email}`, 105, 33, { align: "center" });
    
    // Title
    doc.setFontSize(14);
    doc.text("KWITANSI PEMBAYARAN", 105, 45, { align: "center" });
    
    // Invoice info
    doc.setFontSize(10);
    doc.text(`No. Invoice: ${billing.invoice_number}`, 20, 55);
    doc.text(`Tanggal: ${formatDate(billing.billing_date)}`, 20, 61);
    doc.text(`Pasien: ${patient.full_name}`, 20, 67);
    doc.text(`No. RM: ${patient.medical_record_number}`, 20, 73);
    
    // Items table
    let yPos = 85;
    doc.setFontSize(9);
    doc.text("Item", 20, yPos);
    doc.text("Qty", 100, yPos);
    doc.text("Harga", 120, yPos);
    doc.text("Total", 160, yPos);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 10;
    items.forEach((item) => {
      doc.text(item.item_name.substring(0, 40), 20, yPos);
      doc.text(item.quantity.toString(), 100, yPos);
      doc.text(formatCurrency(item.unit_price), 120, yPos);
      doc.text(formatCurrency(item.total_price), 160, yPos);
      yPos += 7;
    });
    
    // Totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    doc.text(`Subtotal: ${formatCurrency(billing.subtotal)}`, 160, yPos, { align: "right" });
    if (billing.discount) {
      yPos += 7;
      doc.text(`Diskon: ${formatCurrency(billing.discount)}`, 160, yPos, { align: "right" });
    }
    if (billing.tax) {
      yPos += 7;
      doc.text(`Pajak: ${formatCurrency(billing.tax)}`, 160, yPos, { align: "right" });
    }
    yPos += 7;
    doc.setFontSize(11);
    doc.text(`TOTAL: ${formatCurrency(billing.total)}`, 160, yPos, { align: "right" });
    
    // Footer
    yPos += 20;
    doc.setFontSize(9);
    doc.text("Terima kasih atas kepercayaan Anda", 105, yPos, { align: "center" });
    
    doc.save(`Kwitansi_${billing.invoice_number}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Print preview (hidden) */}
      <div ref={printRef} className="hidden">
        <div className="header">
          <h1>{hospitalInfo.name}</h1>
          <p>{hospitalInfo.address}</p>
          <p>Tel: {hospitalInfo.phone} | Email: {hospitalInfo.email}</p>
        </div>
        <h2 style={{ textAlign: "center", margin: "20px 0" }}>KWITANSI PEMBAYARAN</h2>
        <div className="info">
          <div className="info-section">
            <p><strong>No. Invoice:</strong> {billing.invoice_number}</p>
            <p><strong>Tanggal:</strong> {formatDate(billing.billing_date)}</p>
          </div>
          <div className="info-section">
            <p><strong>Pasien:</strong> {patient.full_name}</p>
            <p><strong>No. RM:</strong> {patient.medical_record_number}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Harga Satuan</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.item_name}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unit_price)}</td>
                <td>{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <p>Subtotal: {formatCurrency(billing.subtotal)}</p>
          {billing.discount && <p>Diskon: {formatCurrency(billing.discount)}</p>}
          {billing.tax && <p>Pajak: {formatCurrency(billing.tax)}</p>}
          <p className="total-row">TOTAL: {formatCurrency(billing.total)}</p>
          {billing.paid_amount && <p>Dibayar: {formatCurrency(billing.paid_amount)}</p>}
        </div>
        <div className="footer">
          <div></div>
          <div className="signature">
            <div className="signature-line">Kasir</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Cetak
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
