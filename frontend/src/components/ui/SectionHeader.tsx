import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div>
        {eyebrow ? <p className="text-kicker">{eyebrow}</p> : null}
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-content-primary)] md:text-5xl">{title}</h2>
        {description ? <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-content-secondary)] md:text-lg">{description}</p> : null}
      </div>
      {aside ? <div className="md:justify-self-end">{aside}</div> : null}
    </div>
  );
}
