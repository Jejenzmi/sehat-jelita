import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface PrintReferralProps {
  referral: {
    date: string;
    referral_number?: string;
    reason: string;
    diagnosis: string;
    treatment_given?: string;
    destination_hospital: string;
    destination_doctor?: string;
  };
  patient: {
    full_name: string;
    medical_record_number: string;
    birth_date: string;
    gender: string;
    address?: string;
  };
  doctor: {
    full_name: string;
    sip_number: string;
    specialization?: string;
  };
}

export function PrintReferral({ referral, patient, doctor }: PrintReferralProps) {
  const { hospitalInfo } = useSystemSettings();

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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text(hospitalInfo.name, 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(hospitalInfo.address, 105, 27, { align: "center" });
    doc.text(`Tel: ${hospitalInfo.phone} | Email: ${hospitalInfo.email}`, 105, 33, { align: "center" });
    doc.line(20, 38, 190, 38);
    
    // Title
    doc.setFontSize(14);
    doc.text("SURAT RUJUKAN", 105, 50, { align: "center" });
    
    // Reference number and date
    doc.setFontSize(10);
    doc.text(`No: ${referral.referral_number || "-"}`, 20, 60);
    doc.text(`Tanggal: ${formatDate(referral.date)}`, 150, 60);
    
    // Destination
    doc.setFontSize(10);
    doc.text("Kepada Yth.", 20, 75);
    doc.text(`${referral.destination_hospital}`, 20, 82);
    if (referral.destination_doctor) {
      doc.text(`Up. ${referral.destination_doctor}`, 20, 89);
    }
    
    // Patient info
    doc.text("Dengan hormat,", 20, 105);
    doc.text("Bersama ini kami rujuk pasien:", 20, 115);
    
    let yPos = 125;
    doc.text(`Nama: ${patient.full_name}`, 30, yPos);
    yPos += 7;
    doc.text(`No. RM: ${patient.medical_record_number}`, 30, yPos);
    yPos += 7;
    doc.text(`Umur: ${calculateAge(patient.birth_date)} tahun`, 30, yPos);
    yPos += 7;
    doc.text(`Jenis Kelamin: ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`, 30, yPos);
    yPos += 7;
    doc.text(`Alamat: ${patient.address || "-"}`, 30, yPos);
    
    // Medical info
    yPos += 15;
    doc.text("Diagnosis:", 20, yPos);
    yPos += 7;
    doc.text(referral.diagnosis, 30, yPos);
    
    yPos += 12;
    doc.text("Alasan Rujukan:", 20, yPos);
    yPos += 7;
    const reasonLines = doc.splitTextToSize(referral.reason, 150);
    doc.text(reasonLines, 30, yPos);
    yPos += reasonLines.length * 7;
    
    if (referral.treatment_given) {
      yPos += 5;
      doc.text("Tindakan yang sudah diberikan:", 20, yPos);
      yPos += 7;
      doc.text(referral.treatment_given, 30, yPos);
    }
    
    // Closing
    yPos += 20;
    doc.text("Demikian surat rujukan ini kami buat, atas perhatian dan kerjasamanya kami ucapkan terima kasih.", 20, yPos);
    
    // Signature
    doc.text("Hormat kami,", 140, yPos + 20);
    doc.text(`${doctor.full_name}`, 140, yPos + 45);
    doc.text(`SIP: ${doctor.sip_number}`, 140, yPos + 52);
    
    doc.save(`Rujukan_${patient.medical_record_number}_${formatDate(referral.date)}.pdf`);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Surat Rujukan</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header h1 { margin: 0; font-size: 18px; }
              .header p { margin: 2px 0; font-size: 12px; }
              .title { text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0; }
              .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .section { margin: 15px 0; }
              .label { font-weight: bold; }
              .signature { text-align: right; margin-top: 50px; }
              .signature-line { margin-top: 60px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${hospitalInfo.name}</h1>
              <p>${hospitalInfo.address}</p>
              <p>Tel: ${hospitalInfo.phone} | Email: ${hospitalInfo.email}</p>
            </div>
            <div class="title">SURAT RUJUKAN</div>
            <div class="meta">
              <span>No: ${referral.referral_number || "-"}</span>
              <span>Tanggal: ${formatDate(referral.date)}</span>
            </div>
            <p>Kepada Yth.<br/>${referral.destination_hospital}${referral.destination_doctor ? `<br/>Up. ${referral.destination_doctor}` : ""}</p>
            <p>Dengan hormat,<br/>Bersama ini kami rujuk pasien:</p>
            <div class="section">
              <p>Nama: ${patient.full_name}<br/>
              No. RM: ${patient.medical_record_number}<br/>
              Umur: ${calculateAge(patient.birth_date)} tahun<br/>
              Jenis Kelamin: ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}<br/>
              Alamat: ${patient.address || "-"}</p>
            </div>
            <div class="section">
              <p class="label">Diagnosis:</p>
              <p>${referral.diagnosis}</p>
            </div>
            <div class="section">
              <p class="label">Alasan Rujukan:</p>
              <p>${referral.reason}</p>
            </div>
            ${referral.treatment_given ? `
            <div class="section">
              <p class="label">Tindakan yang sudah diberikan:</p>
              <p>${referral.treatment_given}</p>
            </div>
            ` : ""}
            <p>Demikian surat rujukan ini kami buat, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
            <div class="signature">
              <p>Hormat kami,</p>
              <div class="signature-line">
                <p>${doctor.full_name}<br/>SIP: ${doctor.sip_number}</p>
              </div>
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
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Cetak
      </Button>
      <Button variant="outline" onClick={handleDownloadPDF}>
        <Download className="h-4 w-4 mr-2" />
        Download PDF
      </Button>
    </div>
  );
}
