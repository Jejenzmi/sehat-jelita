import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveICUPatients, useICUMonitoring } from "@/hooks/useICUData";
import { Activity, Heart, Thermometer, Wind, Droplet } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function ICUMonitoringView() {
  const { data: patients } = useActiveICUPatients();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const { data: monitoring } = useICUMonitoring(selectedPatient);

  const latestVitals = monitoring?.[0];

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Pasien</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Pilih pasien untuk monitoring..." />
            </SelectTrigger>
            <SelectContent>
              {patients?.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.patients?.full_name} - {patient.icu_beds?.bed_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPatient && latestVitals && (
        <>
          {/* Latest Vitals */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Heart Rate</p>
                    <p className="text-3xl font-bold text-red-700">
                      {latestVitals.heart_rate || "-"}
                    </p>
                    <p className="text-xs text-red-500">bpm</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Blood Pressure</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {latestVitals.blood_pressure_systolic || "-"}/{latestVitals.blood_pressure_diastolic || "-"}
                    </p>
                    <p className="text-xs text-blue-500">mmHg</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Temperature</p>
                    <p className="text-3xl font-bold text-orange-700">
                      {latestVitals.temperature || "-"}
                    </p>
                    <p className="text-xs text-orange-500">°C</p>
                  </div>
                  <Thermometer className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-600 font-medium">SpO2</p>
                    <p className="text-3xl font-bold text-cyan-700">
                      {latestVitals.spo2 || "-"}
                    </p>
                    <p className="text-xs text-cyan-500">%</p>
                  </div>
                  <Wind className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">GCS Total</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {latestVitals.gcs_total || "-"}
                    </p>
                    <p className="text-xs text-purple-500">E+V+M</p>
                  </div>
                  <Droplet className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monitoring History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {monitoring?.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(record.recorded_at), "dd MMM yyyy HH:mm", { locale: id })}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>HR: {record.heart_rate || "-"}</span>
                      <span>BP: {record.blood_pressure_systolic}/{record.blood_pressure_diastolic}</span>
                      <span>T: {record.temperature}°C</span>
                      <span>SpO2: {record.spo2}%</span>
                      <span>GCS: {record.gcs_total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedPatient && !latestVitals && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada data monitoring untuk pasien ini
          </CardContent>
        </Card>
      )}
    </div>
  );
}
