import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  className?: string;
}

const config: Record<AlertVariant, { icon: React.ReactNode; classes: string }> = {
  error: {
    icon: <AlertCircle size={16} className="shrink-0 mt-0.5" />,
    classes: "bg-[var(--amazon-error-bg)] border-[var(--amazon-error)] text-[var(--amazon-error)]",
  },
  success: {
    icon: <CheckCircle2 size={16} className="shrink-0 mt-0.5" />,
    classes: "bg-[var(--amazon-success-bg)] border-[var(--amazon-success)] text-[var(--amazon-success)]",
  },
  warning: {
    icon: <AlertTriangle size={16} className="shrink-0 mt-0.5" />,
    classes: "bg-[var(--amazon-warning-bg)] border-[var(--amazon-warning)] text-[var(--amazon-warning)]",
  },
  info: {
    icon: <Info size={16} className="shrink-0 mt-0.5" />,
    classes: "bg-[var(--amazon-info-bg)] border-[var(--amazon-info)] text-[var(--amazon-info)]",
  },
};

export function Alert({ variant, title, message, className }: AlertProps) {
  const { icon, classes } = config[variant];
  return (
    <div role="alert" className={cn("flex gap-2 border rounded px-3 py-2.5 text-sm", classes, className)}>
      {icon}
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p>{message}</p>
      </div>
    </div>
  );
}
