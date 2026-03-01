import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
}

const StatCard = ({ icon, label, value, subtitle, className }: StatCardProps) => (
  <div className={cn("card-elevated rounded-xl bg-card p-5", className)}>
    <div className="flex items-center gap-3 mb-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <p className="text-2xl font-bold font-display text-foreground">{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

export default StatCard;
