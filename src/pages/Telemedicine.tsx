import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Monitor, MessageSquare, Clock, Calendar, CheckCircle, AlertCircle, Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTelemedicineData } from "@/hooks/useTelemedicineData";
import { useWebRTCSignaling, createPeerConnection, createOffer, createAnswer, setRemoteAnswer, addIceCandidate } from "@/hooks/useWebRTCSignaling";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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

// WebRTC Video Call Component
function VideoCallRoom({ 
  session, 
  onEnd,
  onUpdateNotes 
}: { 
  session: any; 
  onEnd: (notes?: string) => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [notes, setNotes] = useState(session.notes || "");
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [isInitiator, setIsInitiator] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || "anonymous";

  // Handle incoming signals
  const handleSignalReceived = useCallback(async (signal: { type: string; data: any }) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    console.log(`[VideoCall] Processing signal: ${signal.type}`);

    try {
      if (signal.type === "offer") {
        // Received offer, create answer
        const answer = await createAnswer(pc, signal.data);
        sendSignal({ type: "answer", data: answer });
      } else if (signal.type === "answer") {
        // Received answer
        await setRemoteAnswer(pc, signal.data);
        // Process pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await addIceCandidate(pc, candidate);
        }
        pendingCandidatesRef.current = [];
      } else if (signal.type === "ice-candidate") {
        if (pc.remoteDescription) {
          await addIceCandidate(pc, signal.data);
        } else {
          pendingCandidatesRef.current.push(signal.data);
        }
      }
    } catch (error) {
      console.error("[VideoCall] Error processing signal:", error);
    }
  }, []);

  // Setup WebRTC signaling
  const { sendSignal } = useWebRTCSignaling({
    sessionId: session.id,
    localUserId: userId,
    onSignalReceived: handleSignalReceived,
    enabled: true,
  });

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create RTCPeerConnection with signaling
      const pc = createPeerConnection(
        // onTrack
        (event) => {
          console.log("[VideoCall] Remote track received");
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        },
        // onIceCandidate
        (candidate) => {
          console.log("[VideoCall] Sending ICE candidate");
          sendSignal({ type: "ice-candidate", data: candidate.toJSON() });
        },
        // onConnectionStateChange
        (state) => {
          console.log(`[VideoCall] Connection state: ${state}`);
          setConnectionState(state);
          if (state === "connected") {
            toast({
              title: "Terhubung",
              description: "Video call berhasil terhubung",
            });
          } else if (state === "failed" || state === "disconnected") {
            toast({
              title: "Koneksi Terputus",
              description: "Koneksi video call terputus",
              variant: "destructive",
            });
          }
        }
      );
      
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Determine if we're the initiator (doctor initiates)
      const isDoctor = session.doctor_id === userId;
      setIsInitiator(isDoctor);

      if (isDoctor) {
        // Doctor creates and sends offer
        console.log("[VideoCall] Creating offer as initiator");
        const offer = await createOffer(pc);
        sendSignal({ type: "offer", data: offer });
      }

    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Peringatan",
        description: "Tidak dapat mengakses kamera/mikrofon. Pastikan izin telah diberikan.",
        variant: "destructive",
      });
    }
  }, [session.id, session.doctor_id, userId, toast, sendSignal]);

  useEffect(() => {
    initializeWebRTC();

    // Duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [initializeWebRTC]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        if (peerConnectionRef.current && localStreamRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          
          screenTrack.onended = () => {
            // Revert to camera
            const videoTrack = localStreamRef.current?.getVideoTracks()[0];
            if (sender && videoTrack) {
              sender.replaceTrack(videoTrack);
            }
            if (localVideoRef.current && localStreamRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
            setIsScreenSharing(false);
          };
        }
        setIsScreenSharing(true);
      } catch (error) {
        console.error("Screen share error:", error);
      }
    } else {
      // Revert to camera
      if (peerConnectionRef.current && localStreamRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    }
  };

  const handleEndCall = () => {
    onUpdateNotes(notes);
    onEnd(notes);
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
          <span className="font-medium">{session.patient?.full_name}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{session.appointment?.chief_complaint || "Konsultasi"}</span>
          <Badge variant="outline" className={connectionState === 'connected' ? 'text-green-600' : 'text-yellow-600'}>
            {connectionState === 'connected' ? 'Terhubung' : 'Menghubungkan...'}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-mono">{formatDuration(callDuration)}</span>
          <Button variant="destructive" onClick={handleEndCall}>
            <PhoneOff className="w-4 h-4 mr-2" />
            Akhiri
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 bg-black relative">
          {/* Remote Video (Patient) */}
          <video 
            ref={remoteVideoRef}
            autoPlay 
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Placeholder when no remote stream */}
          {connectionState !== 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/60">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  <AvatarFallback className="text-4xl bg-muted">
                    {session.patient?.full_name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xl">{session.patient?.full_name}</p>
                <p className="text-sm">Menunggu pasien bergabung...</p>
              </div>
            </div>
          )}

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
              onClick={toggleScreenShare}
            >
              <Monitor className="w-6 h-6" />
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
                        <span className="font-medium">{session.patient?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">No. RM</span>
                        <span>{session.patient?.medical_record_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Keluhan Utama</h4>
                    <p className="text-sm text-muted-foreground">
                      {session.appointment?.chief_complaint || "Tidak ada keluhan tercatat"}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Info Sesi</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dijadwalkan</span>
                        <span>{format(new Date(session.scheduled_start), "dd MMM, HH:mm", { locale: localeId })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room</span>
                        <span className="font-mono text-xs">{session.room_name}</span>
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
  const { 
    sessions, 
    stats, 
    loading, 
    startSession, 
    endSession, 
    updateSessionNotes 
  } = useTelemedicineData();
  
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const { toast } = useToast();

  const handleStartSession = async (session: any) => {
    await startSession(session.id, "doctor");
    setActiveSession(session);
    toast({
      title: "Sesi Telemedicine Dimulai",
      description: `Menghubungkan dengan ${session.patient?.full_name}...`,
    });
  };

  const handleEndSession = async (notes?: string) => {
    if (activeSession) {
      await endSession(activeSession.id, notes);
      toast({
        title: "Sesi Berakhir",
        description: "Konsultasi telemedicine telah selesai.",
      });
      setActiveSession(null);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (activeSession) {
      await updateSessionNotes(activeSession.id, notes);
    }
  };

  if (activeSession) {
    return (
      <VideoCallRoom 
        session={activeSession} 
        onEnd={handleEndSession}
        onUpdateNotes={handleUpdateNotes}
      />
    );
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
                <p className="text-2xl font-bold">{stats.today}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
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
                <p className="text-2xl font-bold">{stats.avgDuration} menit</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <Tabs defaultValue="waiting">
        <TabsList>
          <TabsTrigger value="waiting">Menunggu</TabsTrigger>
          <TabsTrigger value="upcoming">Akan Datang</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.filter(s => s.status === "waiting" || s.status === "in_progress").map((session) => (
                <Card key={session.id} className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>{session.patient?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{session.patient?.full_name}</CardTitle>
                          <CardDescription>{session.patient?.medical_record_number}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded-lg">
                        <p className="text-sm font-medium">Keluhan:</p>
                        <p className="text-sm text-muted-foreground">{session.appointment?.chief_complaint || "-"}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Jadwal</span>
                        <span className="font-medium">
                          {format(new Date(session.scheduled_start), "HH:mm", { locale: localeId })}
                        </span>
                      </div>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        onClick={() => handleStartSession(session)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Mulai Konsultasi
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sessions.filter(s => s.status === "waiting" || s.status === "in_progress").length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Tidak ada sesi yang menunggu
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sesi Terjadwal</CardTitle>
              <CardDescription>Daftar konsultasi telemedicine yang dijadwalkan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
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
                              <AvatarFallback>{session.patient?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.patient?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{session.patient?.medical_record_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{session.appointment?.chief_complaint || "-"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{format(new Date(session.scheduled_start), "HH:mm", { locale: localeId })}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(session.scheduled_start), "dd MMM yyyy", { locale: localeId })}</p>
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
                    {sessions.filter(s => s.status === "scheduled").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Tidak ada sesi terjadwal
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sesi Selesai</CardTitle>
              <CardDescription>Riwayat konsultasi telemedicine</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasien</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.filter(s => s.status === "completed").map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{session.patient?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.patient?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{session.patient?.medical_record_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{session.doctor?.full_name}</TableCell>
                        <TableCell>{format(new Date(session.scheduled_start), "dd MMM yyyy, HH:mm", { locale: localeId })}</TableCell>
                        <TableCell>{session.duration_minutes || 0} menit</TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                      </TableRow>
                    ))}
                    {sessions.filter(s => s.status === "completed").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Tidak ada sesi selesai
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
