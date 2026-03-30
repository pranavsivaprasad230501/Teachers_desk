import Image from "next/image";

import { cn } from "@/lib/utils";

const toneStyles = {
  sky: "from-sky-50 via-white to-orange-50 border-sky-100",
  amber: "from-amber-50 via-white to-teal-50 border-amber-100",
  teal: "from-teal-50 via-white to-sky-50 border-teal-100",
  rose: "from-rose-50 via-white to-orange-50 border-rose-100",
} as const;

type SectionHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  tone?: keyof typeof toneStyles;
  className?: string;
};

export function SectionHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  tone = "sky",
  className,
}: SectionHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]",
        toneStyles[tone],
        className,
      )}
    >
      <div className="absolute -left-6 top-6 h-24 w-24 rounded-full bg-white/70 blur-2xl" />
      <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-sky-100/70 blur-3xl" />
      <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
        <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.4rem] border border-white/60 bg-white/75 p-2 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_42%)]" />
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={900}
            height={620}
            className="relative z-10 h-auto w-full rounded-[1rem]"
          />
        </div>
      </div>
    </section>
  );
}
