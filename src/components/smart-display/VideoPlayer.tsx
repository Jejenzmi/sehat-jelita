import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, Volume2, VolumeX, Video, Maximize2 } from "lucide-react";
import { useSmartDisplayMedia } from "@/hooks/useSmartDisplayMedia";

interface VideoItem {
  id: string;
  url: string;
  title: string;
}

interface VideoPlayerProps {
  videos?: VideoItem[];
  autoPlay?: boolean;
  muted?: boolean;
}

const defaultVideos: VideoItem[] = [
  { id: "1", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", title: "Edukasi: Cuci Tangan yang Benar" },
  { id: "2", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", title: "Pencegahan Infeksi di Rumah Sakit" },
  { id: "3", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", title: "Tips Hidup Sehat untuk Keluarga" },
];

export function VideoPlayer({ videos: propVideos, autoPlay = true, muted: initialMuted = true }: VideoPlayerProps) {
  const { data: dbVideos = [] } = useSmartDisplayMedia("lobby", "video");

  const videos: VideoItem[] = dbVideos.length > 0
    ? dbVideos.map((m) => ({ id: m.id, url: m.file_url, title: m.title || m.file_name }))
    : propVideos || defaultVideos;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(initialMuted);

  const currentVideo = videos[currentIdx];

  const playNext = useCallback(() => {
    setCurrentIdx((p) => (p + 1) % videos.length);
    setPlaying(true);
  }, [videos.length]);

  useEffect(() => { setCurrentIdx(0); }, [videos.length]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.load();
    if (playing) el.play().catch(() => {});
  }, [currentIdx]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  const handleFullscreen = () => { videoRef.current?.requestFullscreen?.(); };

  if (videos.length === 0) {
    return (
      <Card className="flex items-center justify-center h-48 bg-muted/50 border-dashed">
        <div className="text-center text-muted-foreground">
          <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada video</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" /> Video Edukasi Kesehatan
          <Badge variant="secondary" className="ml-auto text-[10px]">{currentIdx + 1}/{videos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative bg-black group">
          <video ref={videoRef} src={currentVideo?.url} muted={isMuted} autoPlay={autoPlay} onEnded={playNext} playsInline className="w-full aspect-video" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full" onClick={playNext}>
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full" onClick={() => setIsMuted((p) => !p)}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full" onClick={handleFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t">
          <p className="font-semibold text-sm">{currentVideo?.title}</p>
        </div>
        {videos.length > 1 && (
          <div className="px-3 pb-3 space-y-1">
            {videos.map((v, i) => (
              <button key={v.id} onClick={() => { setCurrentIdx(i); setPlaying(true); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  i === currentIdx ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground"
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  i === currentIdx ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>{i === currentIdx && playing ? <Play className="h-3 w-3" /> : i + 1}</div>
                <span className="truncate">{v.title}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
