import { SpinnerGap } from "@phosphor-icons/react";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";

export function LoadingState({ title = "Loading", description }: { title?: string; description?: string }) {
  return (
    <DoubleBezelCard>
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <SpinnerGap className="animate-spin text-[var(--color-accent-info)]" size={28} />
        <h3 className="text-xl font-medium">{title}</h3>
        {description ? <p className="max-w-md text-sm text-[var(--color-content-secondary)]">{description}</p> : null}
      </div>
    </DoubleBezelCard>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <DoubleBezelCard>
      <div className="flex flex-col gap-3 p-10 text-center">
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-sm text-[var(--color-content-secondary)]">{description}</p>
      </div>
    </DoubleBezelCard>
  );
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <DoubleBezelCard className="border-red-400/10">
      <div className="flex flex-col gap-3 p-10">
        <p className="text-kicker text-red-300">System Attention Required</p>
        <h3 className="text-xl font-medium text-[var(--color-content-primary)]">{title}</h3>
        <p className="text-sm text-[var(--color-content-secondary)]">{description}</p>
      </div>
    </DoubleBezelCard>
  );
}
