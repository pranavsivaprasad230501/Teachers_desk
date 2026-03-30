import Link from 'next/link';
import { ArrowRight, BadgeIndianRupee, BookOpen, Building2, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';

const highlights = [
  {
    title: 'Attendance in minutes',
    description: 'Mark a full batch quickly, keep records clean, and spot absences before they become parent complaints.',
    icon: BookOpen,
  },
  {
    title: 'Fee follow-up that feels organised',
    description: 'Track monthly dues, payment status, and reminders without juggling registers, spreadsheets, and WhatsApp.',
    icon: BadgeIndianRupee,
  },
  {
    title: 'Built for family-run growth',
    description: 'Perfect for centres expanding from one branch to many while keeping owners, teachers, and parents aligned.',
    icon: Building2,
  },
];

const trustPoints = [
  'From single-room tuition setups to premium academy chains',
  'Designed for fast mobile-first use during real class hours',
  'Parent communication and operations in one place',
];

export default function Home() {
  return (
    <main className="heritage-shell rangoli-pattern min-h-screen overflow-hidden">
      <section className="relative px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(174,83,27,0.2),transparent_48%)]" />
        <div className="absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(14,116,118,0.18),transparent_68%)] blur-2xl" />
        <div className="absolute right-[-5rem] top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,154,61,0.24),transparent_62%)] blur-2xl" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/40 bg-white/65 px-4 py-3 shadow-lg shadow-amber-900/5 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#b45309,#ea580c,#0f766e)] text-white shadow-lg shadow-orange-900/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-3xl leading-none text-slate-900">
                Centre<span className="text-orange-700">+</span>
              </p>
              <p className="text-xs uppercase tracking-[0.28em] text-amber-800/70">Tuition Management</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-700 transition hover:text-orange-800 sm:inline-flex">
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#a34217,#d97706)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition hover:scale-[1.01] hover:shadow-xl"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto mt-10 grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/70 px-4 py-2 text-sm text-orange-900 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-orange-700" />
              Crafted for Indian coaching centres, tuition classes, and academies
            </div>

            <h1 className="mt-6 text-5xl leading-[0.95] text-slate-900 sm:text-6xl lg:text-7xl">
              A modern desk for the way
              <span className="mx-2 text-orange-700">India teaches.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              Centre+ brings attendance, fee tracking, branch operations, and parent updates into one polished workflow that feels premium, practical, and ready for the Indian classroom.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                Create Your Centre
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white/70 px-7 py-3.5 text-base font-semibold text-slate-800 backdrop-blur transition hover:border-orange-400 hover:text-orange-800"
              >
                Explore Dashboard
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point} className="rounded-[1.6rem] border border-white/60 bg-white/65 px-4 py-4 text-sm leading-6 text-slate-700 shadow-lg shadow-amber-900/5 backdrop-blur">
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="ornate-border hero-glow rounded-[2rem] bg-[linear-gradient(160deg,rgba(126,34,10,0.98),rgba(151,59,25,0.96)_35%,rgba(15,118,110,0.9)_100%)] p-6 text-white sm:p-8">
              <div className="absolute right-8 top-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-amber-100">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <p className="text-sm uppercase tracking-[0.35em] text-orange-100/80">Owner View</p>
              <h2 className="mt-4 text-4xl leading-none text-white sm:text-5xl">
                Built with warmth, discipline, and detail.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-orange-50/85 sm:text-base">
                Inspired by festive richness, school discipline, and the polished confidence Indian parents expect from a serious institute.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-orange-100/75">Monthly collection</p>
                  <p className="mt-2 text-3xl font-semibold text-white">₹2.48L</p>
                  <p className="mt-2 text-sm text-orange-50/80">Clear visibility on paid, pending, and overdue fees.</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-orange-100/75">Parent updates</p>
                  <p className="mt-2 text-3xl font-semibold text-white">24/7</p>
                  <p className="mt-2 text-sm text-orange-50/80">Share records without constant follow-up calls.</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <MessagesSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">A premium feel for a premium institute</p>
                    <p className="mt-2 text-sm leading-7 text-orange-50/85">
                      The design language mixes deep saffron, sandstone neutrals, and peacock teal so the product feels proudly Indian while still looking current and polished.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/50 bg-white/70 p-6 shadow-[0_22px_80px_rgba(126,70,24,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-700">Why it works</p>
              <h2 className="mt-3 text-4xl text-slate-900 sm:text-5xl">
                Familiar enough for staff, beautiful enough for parents.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Every screen is meant to feel respectful, aspirational, and efficient, like a well-run Indian institute that takes both teaching and presentation seriously.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {highlights.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="group rounded-[1.75rem] border border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,238,220,0.92))] p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(180,83,9,0.14),rgba(13,148,136,0.12))] text-orange-800">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-3xl text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
