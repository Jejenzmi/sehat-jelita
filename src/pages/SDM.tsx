import { useEmployeeStats } from "@/hooks/useHRData";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, CalendarDays, Wallet, TrendingUp, GraduationCap, Settings, Calendar } from "lucide-react";
import { EmployeeList } from "@/components/hr/EmployeeList";
import { AttendanceTab } from "@/components/hr/AttendanceTab";
import { LeaveRequestsTab } from "@/components/hr/LeaveRequestsTab";
import { PayrollTab } from "@/components/hr/PayrollTab";
import { OvertimeTab } from "@/components/hr/OvertimeTab";
import { PerformanceTab } from "@/components/hr/PerformanceTab";
import { TrainingTab } from "@/components/hr/TrainingTab";
import { ShiftManagementTab } from "@/components/hr/ShiftManagementTab";
import { ScheduleRosterTab } from "@/components/hr/ScheduleRosterTab";

export default function SDM() {
  const { data: stats } = useEmployeeStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SDM / HRD</h1>
          <p className="text-muted-foreground">Manajemen Sumber Daya Manusia</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Karyawan Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.presentToday || 0}</p>
                <p className="text-sm text-muted-foreground">Hadir Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <CalendarDays className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingLeave || 0}</p>
                <p className="text-sm text-muted-foreground">Cuti Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingPayroll || 0}</p>
                <p className="text-sm text-muted-foreground">Payroll Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Karyawan
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            Absensi
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Cuti
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Wallet className="h-4 w-4" />
            Penggajian
          </TabsTrigger>
          <TabsTrigger value="overtime" className="gap-2">
            <Clock className="h-4 w-4" />
            Lembur
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Kinerja
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Pelatihan
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            Jadwal Kerja
          </TabsTrigger>
          <TabsTrigger value="shifts" className="gap-2">
            <Settings className="h-4 w-4" />
            Shift Kerja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <EmployeeList />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveRequestsTab />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollTab />
        </TabsContent>

        <TabsContent value="overtime">
          <OvertimeTab />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab />
        </TabsContent>

        <TabsContent value="training">
          <TrainingTab />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleRosterTab />
        </TabsContent>

        <TabsContent value="shifts">
          <ShiftManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
