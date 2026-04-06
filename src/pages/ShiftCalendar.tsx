import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Users, Sun, Moon, Sunset, RefreshCw, Printer,
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { db } from "@/lib/db";

interface ScheduleEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_role: string;
  department_id: string;
  department_name?: string;
  shift_type: "pagi" | "siang" | "malam" | "libur" | "cuti";
  shift_date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

const shiftConfig = {
  pagi:  { color: "bg-amber-400",   textColor: "text-amber-900", label: "Pagi",   icon: Sun,    time: "07:00-14:00" },
  siang: { color: "bg-orange-400",  textColor: "text-orange-900", label: "Siang",  icon: Sunset, time: "14:00-21:00" },
  malam: { color: "bg-indigo-500",  textColor: "text-white",      label: "Malam",  icon: Moon,   time: "21:00-07:00" },
  libur: { color: "bg-gray-200",    textColor: "text-gray-600",   label: "Libur",  icon: Calendar, time: "-" },
  cuti:  { color: "bg-emerald-200", textColor: "text-emerald-700", label: "Cuti",  icon: Calendar, time: "-" },
};

function ShiftCell({ entry }: { entry?: ScheduleEntry }) {
  if (!entry) return <div className="h-10 bg-muted/30 rounded" />;

  const config = shiftConfig[entry.shift_type] || shiftConfig.libur;
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`h-10 rounded flex items-center justify-center gap-1 text-xs font-medium cursor-default transition-all hover:opacity-80 ${config.color} ${config.textColor}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-bold">{entry.employee_name}</p>
          <p>Shift: {config.label} ({config.time})</p>
          {entry.notes && <p>Catatan: {entry.notes}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ShiftCalendar() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await db.from("doctor_schedules")
        .select("*")
        .gte("shift_date", format(weekStart, "yyyy-MM-dd"))
        .lte("shift_date", format(weekEnd, "yyyy-MM-dd"));
      setSchedules(data || []);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [currentWeek]);

  const departments = useMemo(
    () => [...new Set(schedules.map(s => s.department_name).filter(Boolean))].sort(),
    [schedules]
  );

  const roles = useMemo(
    () => [...new Set(schedules.map(s => s.employee_role).filter(Boolean))].sort(),
    [schedules]
  );

  // Get unique employees
  const employees = useMemo(() => {
    const empMap = new Map<string, { id: string; name: string; role: string; dept: string }>();
    for (const s of schedules) {
      if (selectedDept !== "all" && s.department_name !== selectedDept) continue;
      if (selectedRole !== "all" && s.employee_role !== selectedRole) continue;
      if (!empMap.has(s.employee_id)) {
        empMap.set(s.employee_id, {
          id: s.employee_id,
          name: s.employee_name,
          role: s.employee_role,
          dept: s.department_name || "",
        });
      }
    }
    return [...empMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [schedules, selectedDept, selectedRole]);

  // Build schedule lookup
  const scheduleLookup = useMemo(() => {
    const lookup = new Map<string, ScheduleEntry>();
    for (const s of schedules) {
      const key = `${s.employee_id}_${s.shift_date}`;
      lookup.set(key, s);
    }
    return lookup;
  }, [schedules]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const todaySchedules = schedules.filter(s => s.shift_date === todayStr);
    return {
      pagi: todaySchedules.filter(s => s.shift_type === "pagi").length,
      siang: todaySchedules.filter(s => s.shift_type === "siang").length,
      malam: todaySchedules.filter(s => s.shift_type === "malam").length,
      libur: todaySchedules.filter(s => s.shift_type === "libur" || s.shift_type === "cuti").length,
      total: todaySchedules.length,
    };
  }, [schedules]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Jadwal Shift
          </h1>
          <p className="text-muted-foreground">Roster dokter & perawat mingguan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSchedules}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Shift Pagi</p>
                <p className="text-2xl font-bold text-amber-700">{stats.pagi}</p>
              </div>
              <Sun className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Shift Siang</p>
                <p className="text-2xl font-bold text-orange-700">{stats.siang}</p>
              </div>
              <Sunset className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600">Shift Malam</p>
                <p className="text-2xl font-bold text-indigo-700">{stats.malam}</p>
              </div>
              <Moon className="h-8 w-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hari Ini</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            Minggu Ini
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-2">
            {format(weekStart, "d MMM", { locale: localeId })} - {format(weekEnd, "d MMM yyyy", { locale: localeId })}
          </span>
        </div>
        <div className="flex gap-2">
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Semua Departemen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Departemen</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {roles.map(r => <SelectItem key={r} value={r!}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 w-48 border-b bg-muted/50 sticky left-0">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Nama
                    </div>
                  </th>
                  {weekDays.map(day => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <th key={day.toISOString()} className={`p-3 text-center border-b min-w-[100px] ${isToday ? "bg-primary/10 font-bold" : "bg-muted/50"}`}>
                        <div className="text-xs text-muted-foreground">{format(day, "EEE", { locale: localeId })}</div>
                        <div className={`text-sm ${isToday ? "text-primary" : ""}`}>{format(day, "d MMM", { locale: localeId })}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b hover:bg-muted/20">
                    <td className="p-3 sticky left-0 bg-background">
                      <div>
                        <p className="text-sm font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const key = `${emp.id}_${format(day, "yyyy-MM-dd")}`;
                      const entry = scheduleLookup.get(key);
                      return (
                        <td key={day.toISOString()} className={`p-1 ${isSameDay(day, new Date()) ? "bg-primary/5" : ""}`}>
                          <ShiftCell entry={entry} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      Tidak ada jadwal untuk periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {Object.entries(shiftConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div className={`w-8 h-6 rounded flex items-center justify-center ${cfg.color}`}>
                <Icon className={`h-3 w-3 ${cfg.textColor}`} />
              </div>
              <span>{cfg.label} ({cfg.time})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
