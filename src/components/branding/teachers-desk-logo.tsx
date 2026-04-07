import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

type TeachersDeskLogoProps = {
  className?: string;
  markClassName?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  tagline?: string;
  taglineClassName?: string;
  compact?: boolean;
};

export function TeachersDeskLogo({
  className,
  markClassName,
  iconClassName,
  wordmarkClassName,
  tagline = "Academic Operations",
  taglineClassName,
  compact = false,
}: TeachersDeskLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0b66c3,#0a89d8)] text-white shadow-[0_10px_24px_rgba(11,102,195,0.22)]",
          markClassName
        )}
      >
        <BookOpen className={cn("h-5 w-5", iconClassName)} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-xl font-extrabold tracking-tight text-slate-900", wordmarkClassName)}>
          Teacher&apos;s Desk
        </p>
        {!compact && tagline ? (
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500", taglineClassName)}>
            {tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
