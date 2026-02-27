import { useState, useEffect } from "react";
import simrsZenLogo from "@/assets/simrs-zen-logo.png";

export function CurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-right">
      <p className="text-4xl font-bold tabular-nums tracking-tight">
        {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-sm opacity-80">
        {time.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>
    </div>
  );
}

interface DisplayHeaderProps {
  title: string;
  subtitle: string;
  variant?: "primary" | "blue" | "emerald" | "purple";
}

const variantStyles = {
  primary: "from-teal-600 via-teal-700 to-cyan-700",
  blue: "from-blue-600 via-blue-700 to-indigo-700",
  emerald: "from-emerald-600 via-emerald-700 to-teal-700",
  purple: "from-purple-600 via-purple-700 to-indigo-700",
};

export function DisplayHeader({ title, subtitle, variant = "primary" }: DisplayHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${variantStyles[variant]} text-white rounded-2xl p-5 flex items-center justify-between shadow-xl`}>
      <div className="flex items-center gap-4">
        <img src={simrsZenLogo} alt="SIMRS ZEN" className="h-14 w-auto drop-shadow-lg bg-white/90 rounded-lg px-2 py-1" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm opacity-90">{subtitle}</p>
        </div>
      </div>
      <CurrentTime />
    </div>
  );
}
