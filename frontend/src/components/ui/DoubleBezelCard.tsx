import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function DoubleBezelCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("double-bezel-shell rounded-[2rem] p-2 md:p-2.5", className)}
      {...props}
    >
      <div className="double-bezel-core rounded-[calc(2rem-0.4rem)]">{children}</div>
    </div>
  );
}
