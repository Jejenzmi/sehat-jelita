import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
  success: "bg-gradient-to-br from-success/10 to-success/5 border-success/20",
  warning: "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20",
  danger: "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/20 text-primary",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-destructive/20 text-destructive",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "stat-card border",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3.5 rounded-[16px]", iconVariantStyles[variant])}>
          <Icon className="h-7 w-7" />
        </div>
        {trend ? (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold",
            trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-muted/50 text-muted-foreground">
            ~ 0%
          </div>
        )}
      </div>
      
      <div className="space-y-2 mt-6">
        <p className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">{value}</p>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
