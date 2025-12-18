import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Monitor, MessageSquare, Settings, Users, Clock,
  Calendar, CheckCircle, AlertCircle, Play, StopCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Sample telemedicine sessions
const sessions = [
  { 
    id: "1", 
    patient: "Ahmad Sulaiman", 
    mrn: "RM-2024-000001",
    doctor: "Dr. Budi Santoso", 
    scheduledTime: "09:00", 
    date: "2024-01-15",
    status: "waiting",
    chiefComplaint: "Demam dan batuk selama 3 hari"
  },
  { 
    id: "2", 
    patient: "Siti Rahmah", 
    mrn: "RM-2024-000002",
    doctor: "Dr. Ani Wijaya", 
    scheduledTime: "10:30", 
    date: "2024-01-15",
    status: "scheduled",
    chiefComplaint: "Konsultasi hasil lab"
  },
  { 
    id: "3", 
    patient: "Dewi Lestari", 
    mrn: "RM-2024-000003",
    doctor: "Dr. Budi Santoso", 
    scheduledTime: "14:00", 
    date: "2024-01-15",
    status: "completed",
    chiefComplaint: "Follow up pengobatan hipertensi",
    duration: 15
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Terjadwal</Badge>;
    case "waiting":
      return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Menunggu</Badge>;
    case "in_progress":
      return <Badge className="bg-green-500 animate-pulse"><Video className="w-3 h-3 mr-1" />Berlangsung</Badge>;
    case "completed":
      return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Video Call Component
function VideoCallRoom({ session, onEnd }: { session: typeof sessions[0]; onEnd: () => void }) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [notes, setNotes] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Start local video stream
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast({
          title: "Peringatan",
          description: "Tidak dapat mengakses kamera/mikrofon. Pastikan izin telah diberikan.",
          variant: "destructive",
        });
      }
    };
    startVideo();

    // Duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      // Cleanup video stream
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-card border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-red-50 text-red-600 animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
            LIVE
          </Badge>
          <span className="font-medium">{session.patient}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{session.chiefComplaint}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-mono">{formatDuration(callDuration)}</span>
          <Button variant="destructive" onClick={onEnd}>
            <PhoneOff className="w-4 h-4 mr-2" />
            Akhiri
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 bg-black relative">
          {/* Remote Video (Patient) - Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/60">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarFallback className="text-4xl bg-muted">
                  {session.patient.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xl">{session.patient}</p>
              <p className="text-sm">Menunggu koneksi...</p>
            </div>
          </div>

          {/* Local Video (Doctor) */}
          <div className="absolute bottom-4 right-4 w-64 h-48 bg-muted rounded-lg overflow-hidden border-2 border-primary shadow-lg">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline
              className={`w-full h-full object-cover ${!isVideoOn ? "hidden" : ""}`}
            />
            {!isVideoOn && (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <VideoOff className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              Anda
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <Button 
              variant={isAudioOn ? "secondary" : "destructive"} 
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleAudio}
            >
              {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            <Button 
              variant={isVideoOn ? "secondary" : "destructive"} 
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            <Button 
              variant={isScreenSharing ? "default" : "secondary"} 
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => setIsScreenSharing(!isScreenSharing)}
            >
              <Monitor className="w-6 h-6" />
            </Button>
            <Button 
              variant={isChatOpen ? "default" : "secondary"} 
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-card border-l flex flex-col">
          <Tabs defaultValue="info" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="info" className="flex-1">Info Pasien</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Catatan</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 px-4 py-2">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Data Pasien</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama</span>
                        <span className="font-medium">{session.patient}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">No. RM</span>
                        <span>{session.mrn}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Keluhan Utama</h4>
                    <p className="text-sm text-muted-foreground">{session.chiefComplaint}</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Riwayat Kunjungan</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-background rounded">
                        <p className="font-medium">15 Des 2023 - Poli Umum</p>
                        <p className="text-xs text-muted-foreground">Demam, flu</p>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <p className="font-medium">20 Nov 2023 - Poli Umum</p>
                        <p className="text-xs text-muted-foreground">Kontrol hipertensi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 px-4 py-2 flex flex-col">
              <div className="flex-1">
                <Label>Catatan Konsultasi</Label>
                <Textarea 
                  placeholder="Tulis catatan konsultasi..." 
                  className="mt-2 h-full min-h-[300px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-4 border-t space-y-2">
            <Button className="w-full" variant="outline">
              Buat Resep Digital
            </Button>
            <Button className="w-full" variant="outline">
              Rujuk ke Spesialis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Telemedicine() {
  const [activeSession, setActiveSession] = useState<typeof sessions[0] | null>(null);
  const { toast } = useToast();

  const startSession = (session: typeof sessions[0]) => {
    setActiveSession(session);
    toast({
      title: "Sesi Telemedicine Dimulai",
      description: `Menghubungkan dengan ${session.patient}...`,
    });
  };

  const endSession = () => {
    toast({
      title: "Sesi Berakhir",
      description: "Konsultasi telemedicine telah selesai.",
    });
    setActiveSession(null);
  };

  if (activeSession) {
    return <VideoCallRoom session={activeSession} onEnd={endSession} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemedicine</h1>
          <p className="text-muted-foreground">Konsultasi video call jarak jauh</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sesi Hari Ini</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Video className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Menunggu</p>
                <p className="text-2xl font-bold text-yellow-600">2</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-2xl font-bold text-green-600">5</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Durasi</p>
                <p className="text-2xl font-bold">12 menit</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Akan Datang</TabsTrigger>
          <TabsTrigger value="waiting">Menunggu</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sesi Terjadwal</CardTitle>
              <CardDescription>Daftar konsultasi telemedicine yang dijadwalkan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Keluhan</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.filter(s => s.status === "scheduled").map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{session.patient.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{session.patient}</p>
                            <p className="text-xs text-muted-foreground">{session.mrn}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{session.chiefComplaint}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{session.scheduledTime}</p>
                          <p className="text-xs text-muted-foreground">{session.date}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Clock className="w-4 h-4 mr-1" />
                          Ingatkan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waiting" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {sessions.filter(s => s.status === "waiting").map((session) => (
              <Card key={session.id} className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg">{session.patient.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{session.patient}</CardTitle>
                        <CardDescription>{session.mrn}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-sm font-medium">Keluhan</p>
                      <p className="text-sm text-muted-foreground">{session.chiefComplaint}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Jadwal: {session.scheduledTime}</span>
                      <Badge variant="outline" className="bg-yellow-100">Pasien sudah bergabung</Badge>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => startSession(session)}>
                      <Play className="w-4 h-4 mr-2" />
                      Mulai Konsultasi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sesi Selesai</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Keluhan</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.filter(s => s.status === "completed").map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{session.patient.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{session.patient}</p>
                            <p className="text-xs text-muted-foreground">{session.mrn}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{session.chiefComplaint}</TableCell>
                      <TableCell>{session.scheduledTime}</TableCell>
                      <TableCell>{session.duration} menit</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">Lihat Catatan</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
