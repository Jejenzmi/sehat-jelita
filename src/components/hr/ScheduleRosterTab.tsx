import { useState, useMemo } from "react";
import { useEmployees, useWorkShifts } from "@/hooks/useHRData";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Save, X, Copy } from "lucide-react";

interface EmployeeSchedule {
  id: string;
  employee_id: string;
  shift_id: string;
  schedule_date: string;
  is_off_day: boolean;
  notes?: string;
  shift?: {
    shift_code: string;
    shift_name: string;
    is_night_shift: boolean;
  };
}

export function ScheduleRosterTab() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: string } | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkShiftId, setBulkShiftId] = useState<string>("");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const { data: employees } = useEmployees();
  const { data: shifts } = useWorkShifts();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Generate week dates
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Fetch schedules for the week
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["employee-schedules", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");
      const data = await apiFetch<EmployeeSchedule[]>(
        `/hr/schedules?start_date=${startDate}&end_date=${endDate}`
      );
      return Array.isArray(data) ? data : [];
    },
  });

  // Create schedule map for quick lookup
  const scheduleMap = useMemo(() => {
    const map = new Map<string, EmployeeSchedule>();
    schedules?.forEach((schedule) => {
      map.set(`${schedule.employee_id}-${schedule.schedule_date}`, schedule);
    });
    return map;
  }, [schedules]);

  const upsertSchedule = useMutation({
    mutationFn: async ({
      employeeId,
      date,
      shiftId,
      isOffDay,
    }: {
      employeeId: string;
      date: string;
      shiftId?: string;
      isOffDay: boolean;
    }) => {
      await apiPost('/hr/schedules/upsert', {
        employee_id: employeeId,
        schedule_date: date,
        shift_id: shiftId || null,
        is_off_day: isOffDay,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-schedules"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkAssignShift = useMutation({
    mutationFn: async ({
      employeeIds,
      dates,
      shiftId,
    }: {
      employeeIds: string[];
      dates: string[];
      shiftId: string;
    }) => {
      const records = employeeIds.flatMap((empId) =>
        dates.map((date) => ({
          employee_id: empId,
          schedule_date: date,
          shift_id: shiftId,
          is_off_day: false,
        }))
      );
      await apiPost('/hr/schedules/bulk', { records });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-schedules"] });
      toast({ title: "Berhasil", description: "Jadwal shift berhasil diterapkan" });
      setSelectedEmployees(new Set());
      setBulkMode(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCellClick = (employeeId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (bulkMode) {
      const key = `${employeeId}-${dateStr}`;
      const newSet = new Set(selectedEmployees);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      setSelectedEmployees(newSet);
    } else {
      setSelectedCell({ employeeId, date: dateStr });
    }
  };

  const handleShiftAssign = (shiftId: string | null, isOffDay: boolean = false) => {
    if (!selectedCell) return;
    upsertSchedule.mutate({
      employeeId: selectedCell.employeeId,
      date: selectedCell.date,
      shiftId: shiftId || undefined,
      isOffDay,
    });
    setSelectedCell(null);
  };

  const handleBulkApply = () => {
    if (!bulkShiftId || selectedEmployees.size === 0) return;

    const employeeIds = new Set<string>();
    const dates = new Set<string>();

    selectedEmployees.forEach((key) => {
      const [empId, date] = key.split("-");
      employeeIds.add(empId);
      dates.add(key.substring(empId.length + 1));
    });

    bulkAssignShift.mutate({
      employeeIds: Array.from(employeeIds),
      dates: Array.from(dates),
      shiftId: bulkShiftId,
    });
  };

  const copyPreviousWeek = useMutation({
    mutationFn: async () => {
      const prevWeekStart = addDays(weekStart, -7);
      const prevStartDate = format(prevWeekStart, "yyyy-MM-dd");
      const prevEndDate = format(addDays(prevWeekStart, 6), "yyyy-MM-dd");

      const prevSchedules = await apiFetch<any[]>(
        `/hr/schedules?start_date=${prevStartDate}&end_date=${prevEndDate}`
      );

      if (!Array.isArray(prevSchedules) || prevSchedules.length === 0) {
        throw new Error("Tidak ada jadwal minggu sebelumnya");
      }

      const newSchedules = prevSchedules.map((s) => ({
        employee_id: s.employee_id,
        shift_id: s.shift_id,
        is_off_day: s.is_off_day,
        schedule_date: format(addDays(parseISO(s.schedule_date), 7), "yyyy-MM-dd"),
      }));

      await apiPost('/hr/schedules/bulk', { records: newSchedules });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-schedules"] });
      toast({ title: "Berhasil", description: "Jadwal minggu sebelumnya berhasil disalin" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (departmentFilter === "all") return employees.filter((e) => e.status === "active");
    return employees.filter((e) => e.status === "active" && e.department_id === departmentFilter);
  }, [employees, departmentFilter]);

  const departments = useMemo(() => {
    const depts = new Map<string, string>();
    employees?.forEach((emp) => {
      if (emp.department_id && emp.departments?.name) {
        depts.set(emp.department_id, emp.departments.name);
      }
    });
    return Array.from(depts.entries());
  }, [employees]);

  const getShiftBadge = (schedule: EmployeeSchedule | undefined) => {
    if (!schedule) return <span className="text-muted-foreground text-xs">-</span>;
    if (schedule.is_off_day) {
      return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">OFF</Badge>;
    }
    if (schedule.shift) {
      return (
        <Badge
          variant={schedule.shift.is_night_shift ? "secondary" : "default"}
          className="text-xs"
        >
          {schedule.shift.shift_code}
        </Badge>
      );
    }
    return <span className="text-muted-foreground text-xs">-</span>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Jadwal Shift Karyawan
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {departments.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={bulkMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedEmployees(new Set());
              }}
            >
              {bulkMode ? "Batal Bulk" : "Mode Bulk"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyPreviousWeek.mutate()}
              disabled={copyPreviousWeek.isPending}
            >
              <Copy className="h-4 w-4 mr-2" />
              Salin Minggu Lalu
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="font-medium">
              {format(weekStart, "d MMMM", { locale: idLocale })} -{" "}
              {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: idLocale })}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Bulk Apply */}
        {bulkMode && selectedEmployees.size > 0 && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
            <span className="text-sm">{selectedEmployees.size} sel dipilih</span>
            <Select value={bulkShiftId} onValueChange={setBulkShiftId}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Pilih Shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts?.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.shift_code} - {shift.shift_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkApply} disabled={!bulkShiftId}>
              <Save className="h-4 w-4 mr-2" />
              Terapkan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedEmployees(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">
                  Karyawan
                </TableHead>
                {weekDates.map((date) => (
                  <TableHead key={date.toISOString()} className="text-center min-w-[80px]">
                    <div className="text-xs text-muted-foreground">
                      {format(date, "EEE", { locale: idLocale })}
                    </div>
                    <div>{format(date, "d")}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Memuat jadwal...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Tidak ada karyawan aktif
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      <div className="text-sm">{emp.full_name}</div>
                      <div className="text-xs text-muted-foreground">{emp.position}</div>
                    </TableCell>
                    {weekDates.map((date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const schedule = scheduleMap.get(`${emp.id}-${dateStr}`);
                      const isSelected = selectedEmployees.has(`${emp.id}-${dateStr}`);

                      return (
                        <TableCell
                          key={dateStr}
                          className={`text-center cursor-pointer hover:bg-muted/50 transition-colors ${
                            isSelected ? "bg-primary/10 ring-2 ring-primary" : ""
                          }`}
                          onClick={() => handleCellClick(emp.id, date)}
                        >
                          {getShiftBadge(schedule)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Shift Assignment Dialog */}
        <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Atur Shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pilih shift untuk tanggal{" "}
                <strong>
                  {selectedCell && format(parseISO(selectedCell.date), "d MMMM yyyy", { locale: idLocale })}
                </strong>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {shifts?.map((shift) => (
                  <Button
                    key={shift.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleShiftAssign(shift.id)}
                  >
                    <Badge variant={shift.is_night_shift ? "secondary" : "default"} className="mr-2">
                      {shift.shift_code}
                    </Badge>
                    {shift.shift_name}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => handleShiftAssign(null, true)}
                >
                  <Badge variant="destructive" className="mr-2 bg-destructive/10">
                    OFF
                  </Badge>
                  Hari Libur
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleShiftAssign(null, false)}
                >
                  Hapus Jadwal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
