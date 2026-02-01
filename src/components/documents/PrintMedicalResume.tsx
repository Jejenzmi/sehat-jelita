import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface PrintMedicalResumeProps {
  patient: {
    full_name: string;
    medical_record_number: string;
    birth_date: string;
    gender: string;
    address?: string;
    blood_type?: string;
    allergy_notes?: string;
  };
  visit: {
    visit_date: string;
    visit_number: string;
    department?: string;
  };
  medicalRecord: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  diagnoses: {
    icd10_code: string;
    description: string;
  }[];
  doctor: {
    full_name: string;
    sip_number: string;
    specialization?: string;
  };
}

export function PrintMedicalResume({ patient, visit, medicalRecord, diagnoses, doctor }: PrintMedicalResumeProps) {
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
    doc.text(`Tel: ${hospitalInfo.phone}`, 105, 33, { align: "center" });
    doc.line(20, 38, 190, 38);
    
    // Title
    doc.setFontSize(14);
    doc.text("RESUME MEDIS", 105, 50, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`No. Kunjungan: ${visit.visit_number}`, 20, 60);
    doc.text(`Tanggal: ${formatDate(visit.visit_date)}`, 150, 60);
    
    // Patient info box
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 65, 170, 35, "F");
    
    doc.setFontSize(9);
    doc.text("DATA PASIEN", 25, 72);
    doc.text(`Nama: ${patient.full_name}`, 25, 80);
    doc.text(`No. RM: ${patient.medical_record_number}`, 25, 87);
    doc.text(`Umur: ${calculateAge(patient.birth_date)} tahun`, 25, 94);
    doc.text(`Jenis Kelamin: ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`, 105, 80);
    doc.text(`Golongan Darah: ${patient.blood_type || "-"}`, 105, 87);
    doc.text(`Alergi: ${patient.allergy_notes || "Tidak ada"}`, 105, 94);
    
    // Vital signs
    let yPos = 110;
    doc.setFontSize(10);
    doc.text("TANDA VITAL", 20, yPos);
    doc.setFontSize(9);
    yPos += 7;
    const vitals = [
      `TD: ${medicalRecord.blood_pressure_systolic || "-"}/${medicalRecord.blood_pressure_diastolic || "-"} mmHg`,
      `HR: ${medicalRecord.heart_rate || "-"} x/mnt`,
      `Suhu: ${medicalRecord.temperature || "-"}°C`,
      `BB: ${medicalRecord.weight || "-"} kg`,
      `TB: ${medicalRecord.height || "-"} cm`,
    ];
    doc.text(vitals.join("   |   "), 25, yPos);
    
    // SOAP
    yPos += 15;
    doc.setFontSize(10);
    doc.text("SOAP", 20, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.text("Subjective:", 20, yPos);
    yPos += 5;
    if (medicalRecord.subjective) {
      const subLines = doc.splitTextToSize(medicalRecord.subjective, 165);
      doc.text(subLines, 25, yPos);
      yPos += subLines.length * 5;
    }
    
    yPos += 5;
    doc.text("Objective:", 20, yPos);
    yPos += 5;
    if (medicalRecord.objective) {
      const objLines = doc.splitTextToSize(medicalRecord.objective, 165);
      doc.text(objLines, 25, yPos);
      yPos += objLines.length * 5;
    }
    
    yPos += 5;
    doc.text("Assessment:", 20, yPos);
    yPos += 5;
    if (medicalRecord.assessment) {
      const assLines = doc.splitTextToSize(medicalRecord.assessment, 165);
      doc.text(assLines, 25, yPos);
      yPos += assLines.length * 5;
    }
    
    yPos += 5;
    doc.text("Plan:", 20, yPos);
    yPos += 5;
    if (medicalRecord.plan) {
      const planLines = doc.splitTextToSize(medicalRecord.plan, 165);
      doc.text(planLines, 25, yPos);
      yPos += planLines.length * 5;
    }
    
    // Diagnosis
    yPos += 10;
    doc.setFontSize(10);
    doc.text("DIAGNOSIS", 20, yPos);
    yPos += 7;
    doc.setFontSize(9);
    diagnoses.forEach((d, idx) => {
      doc.text(`${idx + 1}. [${d.icd10_code}] ${d.description}`, 25, yPos);
      yPos += 6;
    });
    
    // Signature
    yPos += 15;
    doc.text(`Dokter Pemeriksa,`, 140, yPos);
    yPos += 30;
    doc.text(doctor.full_name, 140, yPos);
    doc.text(`SIP: ${doctor.sip_number}`, 140, yPos + 5);
    
    doc.save(`Resume_Medis_${patient.medical_record_number}.pdf`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleDownloadPDF}>
        <Download className="h-4 w-4 mr-2" />
        Download Resume Medis
      </Button>
    </div>
  );
}
