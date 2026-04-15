import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Status = "success" | "info" | "warning" | "danger" | "neutral";

const styles: Record<Status, string> = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  info: "border-sky-300/20 bg-sky-300/10 text-sky-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  danger: "border-red-400/20 bg-red-400/10 text-red-200",
  neutral: "border-white/10 bg-white/[0.04] text-[var(--color-content-secondary)]",
};

export function StatusPill({
  className,
  children,
  status = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { status?: Status }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-3 py-1.5 text-center text-[10px] leading-4 font-medium uppercase tracking-[0.22em]",
        styles[status],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
