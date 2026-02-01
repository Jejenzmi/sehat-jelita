import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface DrugLabelProps {
  prescription: {
    prescription_number: string;
    prescription_date: string;
  };
  patient: {
    full_name: string;
    medical_record_number: string;
  };
  medicine: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    instructions?: string;
  };
}

export function PrintDrugLabel({ prescription, patient, medicine }: DrugLabelProps) {
  const { hospitalInfo } = useSystemSettings();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownloadPDF = () => {
    // Create small label size (80mm x 40mm roughly)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [40, 80],
    });

    // Hospital name
    doc.setFontSize(7);
    doc.text(hospitalInfo.name, 40, 5, { align: "center" });
    
    // Patient info
    doc.setFontSize(8);
    doc.text(`${patient.full_name}`, 4, 12);
    doc.setFontSize(6);
    doc.text(`RM: ${patient.medical_record_number}`, 4, 16);
    doc.text(formatDate(prescription.prescription_date), 65, 12);
    
    // Medicine name (bold)
    doc.setFontSize(10);
    doc.text(medicine.name, 4, 24);
    
    // Dosage and frequency
    doc.setFontSize(8);
    doc.text(`${medicine.dosage} - ${medicine.frequency}`, 4, 30);
    
    // Duration and instructions
    doc.setFontSize(6);
    doc.text(`Selama: ${medicine.duration}`, 4, 35);
    if (medicine.instructions) {
      doc.text(medicine.instructions.substring(0, 50), 4, 39);
    }

    doc.save(`Label_${medicine.name}_${patient.full_name}.pdf`);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Label Obat</title>
            <style>
              @page { size: 80mm 40mm; margin: 2mm; }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 3mm;
                width: 74mm;
                height: 34mm;
                border: 1px solid #ccc;
              }
              .header { font-size: 8px; text-align: center; margin-bottom: 2mm; }
              .patient { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2mm; }
              .rm { font-size: 7px; color: #666; }
              .medicine { font-size: 12px; font-weight: bold; margin: 2mm 0; }
              .dosage { font-size: 10px; margin-bottom: 1mm; }
              .instructions { font-size: 7px; color: #444; }
            </style>
          </head>
          <body>
            <div class="header">${hospitalInfo.name}</div>
            <div class="patient">
              <div>
                ${patient.full_name}
                <div class="rm">RM: ${patient.medical_record_number}</div>
              </div>
              <div>${formatDate(prescription.prescription_date)}</div>
            </div>
            <div class="medicine">${medicine.name}</div>
            <div class="dosage">${medicine.dosage} - ${medicine.frequency}</div>
            <div class="instructions">
              Selama: ${medicine.duration}
              ${medicine.instructions ? `<br/>${medicine.instructions}` : ""}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handlePrint}>
        <Printer className="h-3 w-3 mr-1" />
        Label
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDownloadPDF}>
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
}
