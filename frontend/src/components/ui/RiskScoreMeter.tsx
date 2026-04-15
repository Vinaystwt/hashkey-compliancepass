import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function colorForScore(score: number) {
  if (score <= 33) return "var(--color-accent-success)";
  if (score <= 66) return "var(--color-accent-warning)";
  return "var(--color-accent-danger)";
}

export function RiskScoreMeter({ score, size = 120, label = "Risk Score", className }: { score: number; size?: number; label?: string; className?: string }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;
  const stroke = colorForScore(score);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold text-[var(--color-content-primary)]">{score}</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-content-muted)]">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-kicker">{label}</p>
        <p className="mt-2 max-w-[180px] text-sm text-[var(--color-content-secondary)]">
          {score <= 33 ? "Low-risk posture with broad protocol eligibility." : score <= 66 ? "Managed exposure with selective access constraints." : "High-risk posture requiring remediation."}
        </p>
      </div>
    </div>
  );
}
