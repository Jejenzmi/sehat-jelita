import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string | null;
  appointment_date: string;
  appointment_time: string;
  end_time: string | null;
  appointment_type: string;
  status: string;
  chief_complaint: string | null;
  notes: string | null;
  booking_source: string | null;
  reminder_sent: boolean | null;
  created_at: string;
  patient?: {
    id: string;
    full_name: string;
    medical_record_number: string;
    phone: string | null;
  };
  doctor?: {
    id: string;
    full_name: string;
    specialization: string | null;
  };
}

export interface Patient {
  id: string;
  full_name: string;
  medical_record_number: string;
  phone: string | null;
  nik: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  department_id: string | null;
  consultation_fee: number | null;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_patients: number | null;
  room_number: string | null;
  is_active: boolean;
}

export function useBookingData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    telemedicine: 0,
    completed: 0,
  });
  const { toast } = useToast();

  const fetchAppointments = async (date?: string) => {
    try {
      let query = db
        .from("appointments")
        .select(`
          *,
          patient:patients(id, full_name, medical_record_number, phone),
          doctor:doctors(id, full_name, specialization)
        `)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (date) {
        query = query.eq("appointment_date", date);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);

      // Calculate stats
      const today = format(new Date(), "yyyy-MM-dd");
      const todayAppointments = (data || []).filter(a => a.appointment_date === today);
      setStats({
        today: todayAppointments.length,
        pending: todayAppointments.filter(a => a.status === "scheduled").length,
        telemedicine: todayAppointments.filter(a => a.appointment_type === "telemedicine").length,
        completed: todayAppointments.filter(a => a.status === "completed").length,
      });
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data appointment",
        variant: "destructive",
      });
    }
  };

  const searchPatients = async (searchTerm: string) => {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        setPatients([]);
        return;
      }

      const { data, error } = await db
        .from("patients")
        .select("id, full_name, medical_record_number, phone, nik")
        .or(`full_name.ilike.%${searchTerm}%,medical_record_number.ilike.%${searchTerm}%,nik.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error("Error searching patients:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await db
        .from("doctors")
        .select("id, full_name, specialization, department_id, consultation_fee")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data, error } = await db
        .from("doctor_schedules")
        .select("*")
        .eq("is_active", true)
        .order("day_of_week");

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      console.error("Error fetching schedules:", error);
    }
  };

  const createAppointment = async (appointment: any) => {
    try {
      const { data, error } = await db
        .from("appointments")
        .insert([appointment])
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Berhasil", description: "Booking berhasil dibuat" });
      fetchAppointments();
      return data;
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat booking",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await db
        .from("appointments")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Berhasil", description: "Appointment berhasil diperbarui" });
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui appointment",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const { error } = await db
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Berhasil", description: "Appointment dibatalkan" });
      fetchAppointments();
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membatalkan appointment",
        variant: "destructive",
      });
    }
  };

  const confirmAppointment = async (id: string) => {
    try {
      const { error } = await db
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Berhasil", description: "Appointment dikonfirmasi" });
      fetchAppointments();
    } catch (error: any) {
      console.error("Error confirming appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengkonfirmasi appointment",
        variant: "destructive",
      });
    }
  };

  const getAvailableSlots = async (doctorId: string, date: Date) => {
    try {
      const dayOfWeek = date.getDay();
      const dateStr = format(date, "yyyy-MM-dd");

      // Get doctor schedule for this day
      const { data: schedule, error: scheduleError } = await db
        .from("doctor_schedules")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .maybeSingle();

      if (scheduleError) throw scheduleError;
      if (!schedule) return [];

      // Get existing appointments
      const { data: existingApts, error: aptsError } = await db
        .from("appointments")
        .select("appointment_time")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", dateStr)
        .not("status", "eq", "cancelled");

      if (aptsError) throw aptsError;

      // Generate available slots
      const bookedTimes = new Set((existingApts || []).map(a => a.appointment_time));
      const slots: string[] = [];
      
      const [startHour, startMin] = schedule.start_time.split(":").map(Number);
      const [endHour, endMin] = schedule.end_time.split(":").map(Number);
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
        
        if (!bookedTimes.has(timeStr)) {
          slots.push(timeStr.substring(0, 5));
        }
        
        currentMinutes += schedule.slot_duration;
      }

      return slots;
    } catch (error: any) {
      console.error("Error getting available slots:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAppointments(),
        fetchDoctors(),
        fetchSchedules(),
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  return {
    appointments,
    patients,
    doctors,
    schedules,
    stats,
    loading,
    fetchAppointments,
    searchPatients,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    confirmAppointment,
    getAvailableSlots,
  };
}
