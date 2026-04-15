import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MagneticButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function MagneticButton({
  className,
  children,
  icon,
  variant = "primary",
  ...props
}: MagneticButtonProps) {
  const base =
    "group inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-[var(--bezier-premium)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-info)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary:
      "bg-[var(--color-accent-success)] text-[var(--color-base)] shadow-[0_12px_40px_rgba(16,185,129,0.22)] hover:-translate-y-[2px] hover:shadow-[0_18px_54px_rgba(16,185,129,0.26)]",
    secondary:
      "bg-[var(--color-surface-3)] text-[var(--color-content-primary)] hover:-translate-y-[2px] hover:border-white/15",
    ghost:
      "border border-[var(--color-border-hairline)] bg-white/[0.02] text-[var(--color-content-primary)] hover:-translate-y-[2px] hover:border-white/15 hover:bg-white/[0.04]",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      <span className="leading-none">{children}</span>
      {icon ? (
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px]">
          {icon}
        </span>
      ) : null}
    </button>
  );
}
