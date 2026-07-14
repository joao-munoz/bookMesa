import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface BadgeProps {
  variant?: "success" | "danger" | "info" | "warning" | "default" | "completed";
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const colors = {
    success: "bg-success/10 text-success border-success/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-info/10 text-info border-info/20",
    warning: "bg-[#FBF3D5] text-[#8A6E1E] border-[#C9A84C]/30",
    default: "bg-muted/10 text-muted border-muted/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border",
        colors[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
