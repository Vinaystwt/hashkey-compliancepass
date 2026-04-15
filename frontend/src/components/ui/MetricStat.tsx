import { motion } from "framer-motion";
import { cn, formatNumber } from "@/lib/utils";

export function MetricStat({
  label,
  value,
  hint,
  accent = false,
  className,
}: {
  label: string;
  value: string | number | bigint;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col rounded-[1.5rem] border border-[var(--color-border-hairline)] bg-white/[0.02] p-5", className)}>
      <p className="text-kicker">{label}</p>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn(
          "mt-4 font-mono text-3xl font-semibold tracking-tight text-[var(--color-content-primary)]",
          accent && "text-[var(--color-accent-success)]"
        )}
      >
        {typeof value === "bigint" || typeof value === "number" ? formatNumber(value) : value}
      </motion.p>
      {hint ? <p className="mt-3 text-sm leading-6 text-[var(--color-content-secondary)]">{hint}</p> : null}
    </div>
  );
}
