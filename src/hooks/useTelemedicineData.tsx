import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface TelemedicineSession {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  room_name: string;
  session_token: string | null;
  status: string;
  scheduled_start: string;
  actual_start: string | null;
  actual_end: string | null;
  duration_minutes: number | null;
  patient_joined_at: string | null;
  doctor_joined_at: string | null;
  recording_url: string | null;
  notes: string | null;
  technical_issues: string | null;
  patient?: {
    id: string;
    full_name: string;
    medical_record_number: string;
  };
  doctor?: {
    id: string;
    full_name: string;
    specialization: string | null;
  };
  appointment?: {
    id: string;
    chief_complaint: string | null;
    appointment_date: string;
    appointment_time: string;
  };
}

export function useTelemedicineData() {
  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    waiting: 0,
    completed: 0,
    avgDuration: 0,
  });
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("telemedicine_sessions")
        .select(`
          *,
          patient:patients(id, full_name, medical_record_number),
          doctor:doctors(id, full_name, specialization),
          appointment:appointments(id, chief_complaint, appointment_date, appointment_time)
        `)
        .order("scheduled_start", { ascending: true });

      if (error) throw error;
      setSessions(data || []);

      // Calculate stats
      const today = format(new Date(), "yyyy-MM-dd");
      const todaySessions = (data || []).filter(s => 
        s.scheduled_start.startsWith(today)
      );
      
      const completedSessions = todaySessions.filter(s => s.status === "completed");
      const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      setStats({
        today: todaySessions.length,
        waiting: todaySessions.filter(s => s.status === "waiting" || s.status === "in_progress").length,
        completed: completedSessions.length,
        avgDuration: completedSessions.length > 0 ? Math.round(totalDuration / completedSessions.length) : 0,
      });
    } catch (error: any) {
      console.error("Error fetching telemedicine sessions:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data sesi telemedicine",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (appointmentId: string) => {
    try {
      // Get appointment details
      const { data: appointment, error: aptError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (aptError) throw aptError;

      const roomName = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const scheduledStart = `${appointment.appointment_date}T${appointment.appointment_time}`;

      const { data, error } = await supabase
        .from("telemedicine_sessions")
        .insert([{
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          room_name: roomName,
          scheduled_start: scheduledStart,
          status: "scheduled",
        }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Berhasil", description: "Sesi telemedicine berhasil dibuat" });
      fetchSessions();
      return data;
    } catch (error: any) {
      console.error("Error creating telemedicine session:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat sesi telemedicine",
        variant: "destructive",
      });
      throw error;
    }
  };

  const startSession = async (sessionId: string, userType: "doctor" | "patient") => {
    try {
      const updates: any = {
        status: "in_progress",
      };

      if (userType === "doctor") {
        updates.doctor_joined_at = new Date().toISOString();
        updates.actual_start = new Date().toISOString();
      } else {
        updates.patient_joined_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("telemedicine_sessions")
        .update(updates)
        .eq("id", sessionId);

      if (error) throw error;
      toast({ title: "Berhasil", description: "Sesi telemedicine dimulai" });
      fetchSessions();
    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memulai sesi",
        variant: "destructive",
      });
    }
  };

  const endSession = async (sessionId: string, notes?: string) => {
    try {
      // Get session to calculate duration
      const { data: session, error: sessionError } = await supabase
        .from("telemedicine_sessions")
        .select("actual_start, appointment_id")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      let durationMinutes = 0;
      if (session.actual_start) {
        const start = new Date(session.actual_start);
        const end = new Date();
        durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      }

      const { error } = await supabase
        .from("telemedicine_sessions")
        .update({
          status: "completed",
          actual_end: new Date().toISOString(),
          duration_minutes: durationMinutes,
          notes: notes || null,
        })
        .eq("id", sessionId);

      if (error) throw error;

      // Update appointment status
      if (session.appointment_id) {
        await supabase
          .from("appointments")
          .update({ status: "completed" })
          .eq("id", session.appointment_id);
      }

      toast({ title: "Berhasil", description: "Sesi telemedicine selesai" });
      fetchSessions();
    } catch (error: any) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengakhiri sesi",
        variant: "destructive",
      });
    }
  };

  const updateSessionNotes = async (sessionId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("telemedicine_sessions")
        .update({ notes })
        .eq("id", sessionId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating notes:", error);
    }
  };

  const reportTechnicalIssue = async (sessionId: string, issue: string) => {
    try {
      const { error } = await supabase
        .from("telemedicine_sessions")
        .update({ technical_issues: issue })
        .eq("id", sessionId);

      if (error) throw error;
      toast({ title: "Berhasil", description: "Masalah teknis telah dilaporkan" });
    } catch (error: any) {
      console.error("Error reporting issue:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal melaporkan masalah",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    stats,
    loading,
    fetchSessions,
    createSession,
    startSession,
    endSession,
    updateSessionNotes,
    reportTechnicalIssue,
  };
}
