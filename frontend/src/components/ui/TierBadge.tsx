import { cn } from "@/lib/utils";

const tierStyles = {
  1: "border-[color:var(--color-tier-1)]/20 bg-[color:var(--color-tier-1)]/10 text-[color:var(--color-tier-1)]",
  2: "border-[color:var(--color-tier-2)]/20 bg-[color:var(--color-tier-2)]/10 text-[color:var(--color-tier-2)]",
  3: "border-[color:var(--color-tier-3)]/20 bg-[color:var(--color-tier-3)]/10 text-[color:var(--color-tier-3)]",
};

export function TierBadge({ tier, className }: { tier: number; className?: string }) {
  const applied = tierStyles[tier as 1 | 2 | 3] ?? "border-white/10 bg-white/[0.04] text-white/80";

  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-medium tracking-[0.18em] uppercase", applied, className)}>
      Tier {tier}
    </span>
  );
}
