import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ReasonCardProps {
  icon: ReactNode;
  title: string;
  reason: string;
  savings?: string;
  className?: string;
}

const ReasonCard = ({ icon, title, reason, savings, className }: ReasonCardProps) => (
  <div className={cn("flex items-start gap-3 rounded-lg bg-surface-warm p-3", className)}>
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
      {savings && (
        <span className="mt-1 inline-block rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          {savings}
        </span>
      )}
    </div>
  </div>
);

export default ReasonCard;
