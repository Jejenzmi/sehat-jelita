import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";

interface RunningTextProps {
  messages?: string[];
  speed?: number; // pixels per second
  variant?: "primary" | "alert" | "info";
}

const variantStyles = {
  primary: "bg-gradient-to-r from-teal-600 to-cyan-600 text-white",
  alert: "bg-gradient-to-r from-red-600 to-rose-600 text-white",
  info: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
};

const defaultMessages = [
  "🏥 Selamat datang di RSUD Dr. Moewardi — Melayani dengan Sepenuh Hati",
  "📋 Pendaftaran online tersedia melalui aplikasi Mobile JKN dan website resmi rumah sakit",
  "💉 Vaksinasi Influenza tersedia untuk dewasa & anak-anak — Hubungi Poli Umum",
  "🩺 Paket Medical Check Up Executive diskon 30% — Berlaku hingga akhir bulan",
  "⏰ Jam Besuk: Pagi 10.00-12.00 WIB | Sore 16.00-18.00 WIB",
  "📞 Informasi & Pendaftaran: (0271) 637415",
];

export function RunningText({ messages = defaultMessages, speed = 80, variant = "primary" }: RunningTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [animDuration, setAnimDuration] = useState(30);

  const fullText = messages.join("     ●     ");

  useEffect(() => {
    if (textRef.current) {
      const textWidth = textRef.current.scrollWidth;
      setAnimDuration(textWidth / speed);
    }
  }, [fullText, speed]);

  return (
    <div className={`${variantStyles[variant]} rounded-xl overflow-hidden shadow-lg`}>
      <div className="flex items-center">
        {/* Label */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-black/20 shrink-0 z-10">
          <Megaphone className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Info</span>
        </div>

        {/* Marquee */}
        <div ref={containerRef} className="flex-1 overflow-hidden py-2.5 relative">
          <div
            ref={textRef}
            className="whitespace-nowrap inline-block animate-marquee font-medium text-sm"
            style={{
              animationDuration: `${animDuration}s`,
            }}
          >
            {fullText}
            <span className="inline-block w-[100vw]" />
            {fullText}
          </div>
        </div>
      </div>
    </div>
  );
}
