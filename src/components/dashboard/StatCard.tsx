import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default:  "bg-white border-border/50",
  primary:  "bg-white border-[#1B4332]/15",
  success:  "bg-white border-emerald-200/60",
  warning:  "bg-white border-amber-200/60",
  danger:   "bg-white border-red-200/60",
};

const iconVariantStyles = {
  default:  "bg-slate-100 text-slate-500",
  primary:  "bg-[#1B4332]/10 text-[#1B4332]",
  success:  "bg-emerald-50 text-emerald-600",
  warning:  "bg-amber-50 text-amber-600",
  danger:   "bg-red-50 text-red-500",
};

const valueVariantStyles = {
  default:  "text-slate-800",
  primary:  "text-[#1B4332]",
  success:  "text-emerald-700",
  warning:  "text-amber-700",
  danger:   "text-red-600",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: StatCardProps) {
  return (
    <div className={cn(
      "relative rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend ? (
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full",
            trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          )}>
            {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-50 text-slate-400">
            ~ 0%
          </span>
        )}
      </div>
      <div>
        <p className={cn("text-2xl font-extrabold tracking-tight", valueVariantStyles[variant])}>{value}</p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
