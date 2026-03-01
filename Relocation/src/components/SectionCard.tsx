import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  badge?: string;
}

const SectionCard = ({ icon, title, subtitle, children, className, badge }: SectionCardProps) => (
  <div className={cn("card-elevated rounded-2xl bg-card p-6", className)}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold font-display text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

export default SectionCard;
