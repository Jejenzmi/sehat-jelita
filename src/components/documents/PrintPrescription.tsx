import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  route?: string;
  instructions?: string;
}

interface PrintPrescriptionProps {
  prescription: {
    prescription_number: string;
    prescription_date: string;
  };
  patient: {
    full_name: string;
    medical_record_number: string;
    birth_date: string;
    gender: string;
    address?: string;
    allergy_notes?: string;
  };
  doctor: {
    full_name: string;
    specialization?: string;
    sip_number?: string;
  };
  medicines: PrescriptionMedicine[];
  diagnosis?: string;
  notes?: string;
  onPrint?: () => void;
}

export function PrintPrescription({ 
  prescription, 
  patient, 
  doctor, 
  medicines, 
  diagnosis,
  notes,
  onPrint 
}: PrintPrescriptionProps) {
  const { hospitalInfo } = useSystemSettings();
  const printRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Resep ${prescription.prescription_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
              .header h1 { margin: 0; font-size: 18px; }
              .header p { margin: 2px 0; font-size: 11px; color: #666; }
              .rx-symbol { font-size: 28px; font-weight: bold; font-style: italic; margin: 15px 0; }
              .patient-info { background: #f5f5f5; padding: 12px; margin-bottom: 15px; border-radius: 4px; }
              .patient-info p { margin: 3px 0; font-size: 12px; }
              .allergy-warning { background: #fee; color: #c00; padding: 8px; margin-top: 8px; border-radius: 4px; font-weight: bold; }
              .medicines-list { margin: 20px 0; }
              .medicine-item { padding: 12px; border: 1px solid #ddd; margin-bottom: 10px; border-radius: 4px; }
              .medicine-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
              .medicine-detail { font-size: 12px; color: #333; margin: 2px 0; }
              .medicine-instructions { font-size: 11px; color: #666; font-style: italic; margin-top: 5px; }
              .notes-section { background: #fffbeb; padding: 10px; margin: 15px 0; border-radius: 4px; font-size: 12px; }
              .footer { margin-top: 30px; display: flex; justify-content: space-between; }
              .signature { text-align: center; width: 200px; }
              .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; font-size: 12px; }
              .prescription-number { font-size: 11px; color: #666; margin-top: 5px; }
              @media print { body { padding: 0; } }
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
    doc.line(20, 38, 190, 38);
    
    // Rx Symbol
    doc.setFontSize(24);
    doc.setFont("helvetica", "bolditalic");
    doc.text("R/", 25, 52);
    doc.setFont("helvetica", "normal");
    
    // Prescription info
    doc.setFontSize(10);
    doc.text(`No. Resep: ${prescription.prescription_number}`, 150, 45);
    doc.text(`Tanggal: ${formatDate(prescription.prescription_date)}`, 150, 51);
    
    // Patient info box
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 58, 170, 28, "F");
    
    doc.setFontSize(9);
    doc.text("DATA PASIEN", 25, 64);
    doc.text(`Nama: ${patient.full_name}`, 25, 71);
    doc.text(`No. RM: ${patient.medical_record_number}`, 25, 78);
    doc.text(`Umur: ${calculateAge(patient.birth_date)} tahun`, 110, 71);
    doc.text(`Jenis Kelamin: ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`, 110, 78);
    
    if (patient.allergy_notes) {
      doc.setFillColor(255, 238, 238);
      doc.rect(20, 88, 170, 8, "F");
      doc.setTextColor(200, 0, 0);
      doc.text(`⚠ ALERGI: ${patient.allergy_notes}`, 25, 94);
      doc.setTextColor(0, 0, 0);
    }
    
    // Diagnosis
    let yPos = patient.allergy_notes ? 105 : 95;
    if (diagnosis) {
      doc.setFontSize(9);
      doc.text(`Diagnosis: ${diagnosis}`, 25, yPos);
      yPos += 10;
    }
    
    // Medicines table
    const medicineData = medicines.map((med, idx) => [
      (idx + 1).toString(),
      med.name,
      `${med.quantity} ${med.unit}`,
      med.dosage,
      med.frequency,
      med.duration,
      med.instructions || "-"
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [["No", "Nama Obat", "Jumlah", "Dosis", "Frekuensi", "Durasi", "Aturan Pakai"]],
      body: medicineData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 35 },
      },
    });
    
    // Notes
    yPos = (doc as any).lastAutoTable.finalY + 10;
    if (notes) {
      doc.setFillColor(255, 251, 235);
      doc.rect(20, yPos, 170, 12, "F");
      doc.setFontSize(9);
      doc.text(`Catatan: ${notes}`, 25, yPos + 8);
      yPos += 20;
    }
    
    // Signature
    yPos = Math.max(yPos, (doc as any).lastAutoTable.finalY + 15);
    doc.text(`${hospitalInfo.city}, ${formatDate(prescription.prescription_date)}`, 140, yPos);
    doc.text("Dokter Pemeriksa,", 140, yPos + 8);
    yPos += 35;
    doc.text(doctor.full_name, 140, yPos);
    if (doctor.sip_number) {
      doc.text(`SIP: ${doctor.sip_number}`, 140, yPos + 5);
    }
    
    doc.save(`Resep_${prescription.prescription_number}.pdf`);
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
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="rx-symbol">R/</div>
          <div style={{ textAlign: "right", fontSize: "11px" }}>
            <p>No. Resep: {prescription.prescription_number}</p>
            <p>Tanggal: {formatDate(prescription.prescription_date)}</p>
          </div>
        </div>
        
        <div className="patient-info">
          <p><strong>DATA PASIEN</strong></p>
          <p>Nama: {patient.full_name} | No. RM: {patient.medical_record_number}</p>
          <p>Umur: {calculateAge(patient.birth_date)} tahun | Jenis Kelamin: {patient.gender === "L" ? "Laki-laki" : "Perempuan"}</p>
          {patient.allergy_notes && (
            <div className="allergy-warning">⚠ ALERGI: {patient.allergy_notes}</div>
          )}
        </div>
        
        {diagnosis && (
          <p style={{ fontSize: "12px", marginBottom: "10px" }}><strong>Diagnosis:</strong> {diagnosis}</p>
        )}
        
        <div className="medicines-list">
          {medicines.map((med, idx) => (
            <div key={idx} className="medicine-item">
              <div className="medicine-name">{idx + 1}. {med.name}</div>
              <div className="medicine-detail">
                Jumlah: {med.quantity} {med.unit} | Dosis: {med.dosage} | Frekuensi: {med.frequency} | Durasi: {med.duration}
              </div>
              {med.route && <div className="medicine-detail">Rute: {med.route}</div>}
              {med.instructions && <div className="medicine-instructions">Aturan: {med.instructions}</div>}
            </div>
          ))}
        </div>
        
        {notes && (
          <div className="notes-section">
            <strong>Catatan:</strong> {notes}
          </div>
        )}
        
        <div className="footer">
          <div></div>
          <div className="signature">
            <p style={{ fontSize: "11px" }}>{hospitalInfo.city}, {formatDate(prescription.prescription_date)}</p>
            <p style={{ fontSize: "11px" }}>Dokter Pemeriksa,</p>
            <div className="signature-line">
              {doctor.full_name}
              {doctor.sip_number && <p className="prescription-number">SIP: {doctor.sip_number}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Cetak Resep
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
