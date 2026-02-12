import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play, ImageIcon } from "lucide-react";
import { useSmartDisplayMedia } from "@/hooks/useSmartDisplayMedia";

interface Slide {
  id: string;
  url: string;
  title?: string;
  caption?: string;
}

interface ImageSlideshowProps {
  slides?: Slide[];
  interval?: number;
  autoPlay?: boolean;
}

const defaultSlides: Slide[] = [
  { id: "1", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=600&fit=crop", title: "Fasilitas Modern", caption: "RSUD Dr. Moewardi dilengkapi fasilitas medis berstandar internasional" },
  { id: "2", url: "https://images.unsplash.com/photo-1551190822-a9ce113ac100?w=1200&h=600&fit=crop", title: "Tim Medis Profesional", caption: "Didukung oleh dokter spesialis dan tenaga medis berpengalaman" },
  { id: "3", url: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=600&fit=crop", title: "Layanan 24 Jam", caption: "IGD dan layanan darurat tersedia 24 jam setiap hari" },
  { id: "4", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=600&fit=crop", title: "Laboratorium Lengkap", caption: "Pemeriksaan laboratorium cepat dan akurat dengan peralatan terkini" },
];

export function ImageSlideshow({ slides: propSlides, interval = 6000, autoPlay = true }: ImageSlideshowProps) {
  const { data: dbImages = [] } = useSmartDisplayMedia("lobby", "image");

  // Use DB images if available, else props, else defaults
  const slides: Slide[] = dbImages.length > 0
    ? dbImages.map((m) => ({ id: m.id, url: m.file_url, title: m.title || undefined }))
    : propSlides || defaultSlides;

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!playing || slides.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [playing, next, interval, slides.length]);

  // Reset current if slides change
  useEffect(() => { setCurrent(0); }, [slides.length]);

  if (slides.length === 0) {
    return (
      <Card className="flex items-center justify-center h-48 bg-muted/50 border-dashed">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada slide gambar</p>
        </div>
      </Card>
    );
  }

  const slide = slides[current];

  return (
    <Card className="overflow-hidden shadow-lg relative group">
      <div className="relative aspect-[21/9] bg-black">
        {slides.map((s, i) => (
          <img key={s.id} src={s.url} alt={s.title || `Slide ${i + 1}`}
            onLoad={() => setLoaded((p) => ({ ...p, [s.id]: true }))}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {(slide.title || slide.caption) && (
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            {slide.title && <h3 className="text-xl font-bold mb-1">{slide.title}</h3>}
            {slide.caption && <p className="text-sm opacity-90">{slide.caption}</p>}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/40 hover:bg-black/60 text-white rounded-full" onClick={prev}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/40 hover:bg-black/60 text-white rounded-full" onClick={next}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        <Button variant="ghost" size="icon"
          className="absolute top-3 right-3 h-8 w-8 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-center gap-1.5 py-2.5 bg-muted/30">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} />
        ))}
      </div>
    </Card>
  );
}
