import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  CircleHelp,
  CreditCard,
  GraduationCap,
  MessagesSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

const heroHighlights = [
  "Trusted by small, medium, and large tuition classes",
  "Admission, fees, communication, and attendance in one workspace",
  "Built for owners, teachers, parents, and students",
];

const coreBenefits = [
  {
    title: "Exclusive student progress tracker",
    description:
      "Monitor academic performance clearly, spot weak areas early, and keep every learner on a visible growth path.",
    icon: BarChart3,
  },
  {
    title: "Automated test and assessment setup",
    description:
      "Create exams, practice flows, and classroom checks quickly so your staff spends more time teaching than preparing.",
    icon: BookOpen,
  },
  {
    title: "Cloud-based study access",
    description:
      "Give students a reliable place for notes, updates, and class resources from any device, anytime they need it.",
    icon: GraduationCap,
  },
  {
    title: "Efficient fee management",
    description:
      "Track dues, generate reminders, and keep payment records organised without scattered sheets or manual follow-ups.",
    icon: CreditCard,
  },
];

const featureSections = [
  {
    eyebrow: "Admissions",
    title: "Simplifies the admission process",
    description:
      "Move from paper-heavy admissions to a structured digital flow with enquiry capture, lead follow-up, and quick onboarding.",
    points: ["Online enquiry tracking", "Student profile creation", "Batch assignment in minutes"],
    icon: Users,
  },
  {
    eyebrow: "Fee Collection",
    title: "Secure online fee payment",
    description:
      "Offer a clear and professional payment experience with due dates, reminders, receipts, and real-time status visibility.",
    points: ["Payment status tracking", "Auto reminders", "Receipt history for parents"],
    icon: ShieldCheck,
  },
  {
    eyebrow: "Team Ops",
    title: "Automate staff management",
    description:
      "Handle attendance, leave approvals, and classroom coordination from one place so operations stay consistent across branches.",
    points: ["Staff attendance records", "Leave approval flow", "Role-based access control"],
    icon: Building2,
  },
];

const faqs = [
  {
    question: "What is tuition class management software?",
    answer:
      "It is software that helps tuition classes manage admissions, attendance, fees, communication, examinations, and day-to-day administration from one system.",
  },
  {
    question: "Is it suitable for small and growing tuition classes?",
    answer:
      "Yes. Small single-location tuition classes and larger multi-branch setups can both use it to stay organised and keep parents and students informed.",
  },
  {
    question: "Can the software work for multiple tuition branches?",
    answer:
      "Yes. The product is built for growing tuition businesses that need separate branches, shared oversight, and cleaner reporting across locations.",
  },
];

export default function Home() {
  return (
    <main className="landing-page min-h-screen text-slate-900">
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0b66c3,#0a89d8)] text-white shadow-[0_10px_24px_rgba(11,102,195,0.22)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-slate-900">Centre+</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Coaching Operations</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-sky-700">
              Features
            </a>
            <a href="#why-centre-plus" className="transition hover:text-sky-700">
              Why Centre+
            </a>
            <a href="#faqs" className="transition hover:text-sky-700">
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-900 sm:inline-flex">
              Login
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#f47c20] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,124,32,0.28)] transition hover:bg-[#e56b0c]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,143,224,0.18),transparent_34%),radial-gradient(circle_at_right,rgba(244,124,32,0.16),transparent_28%)]" />
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-3xl animate-soft-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              <BadgeCheck className="h-4 w-4" />
              Tuition class management software
            </div>

            <h1 className="mt-6 max-w-4xl font-sans text-4xl font-extrabold leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Tuition class management software built for classes that want to look organised and grow faster.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Manage admissions, attendance, fees, tests, communication, and branch operations from one clean dashboard
              that feels professional to staff, parents, and students.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {heroHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 shadow-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#f47c20] px-7 py-3.5 text-base font-semibold text-white shadow-[0_16px_30px_rgba(244,124,32,0.28)] transition hover:bg-[#e56b0c]"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                Explore dashboard
              </Link>
            </div>

            <div className="mt-10 rounded-[2rem] bg-[linear-gradient(135deg,#0d5eb7,#0a8bd9)] p-6 text-white shadow-[0_28px_70px_rgba(10,94,183,0.26)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100/90">Best for owners</p>
                  <h2 className="mt-3 max-w-lg font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">
                    One system for your front desk, classroom ops, and fee desk.
                  </h2>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3 text-right backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-sky-100/75">Reviews</p>
                  <p className="mt-1 text-2xl font-bold">4.1/5</p>
                  <p className="text-sm text-sky-100/80">560+ ratings</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-100/75">Branches</p>
                  <p className="mt-2 text-3xl font-bold">12</p>
                  <p className="mt-2 text-sm text-sky-50/85">Keep every branch aligned with central visibility.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-100/75">Student records</p>
                  <p className="mt-2 text-3xl font-bold">24/7</p>
                  <p className="mt-2 text-sm text-sky-50/85">Access attendance, fees, and progress whenever needed.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-100/75">Fee reminders</p>
                  <p className="mt-2 text-3xl font-bold">Auto</p>
                  <p className="mt-2 text-sm text-sky-50/85">Reduce manual calling and keep payment follow-up on time.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 animate-soft-rise-delay">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-sky-200/50 blur-2xl animate-soft-float" />
            <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-orange-200/60 blur-2xl animate-soft-float-delayed" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_60px_rgba(15,23,42,0.08)] sm:p-7">
              <div className="relative mb-6 overflow-hidden rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(135deg,#eef7ff,#fff6ea)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,102,195,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(244,124,32,0.12),transparent_30%)] animate-soft-pan" />
                <Image
                  src="/landing-classroom.svg"
                  alt="Illustration of a tuition class dashboard with student, fee, and classroom activity cards"
                  width={960}
                  height={720}
                  className="relative z-10 h-auto w-full animate-soft-float"
                  priority
                />
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Sign up for a free trial</p>
              <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-slate-950">See how your tuition class can run smoother.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Start with the same categories tuition classes care about most and move into your dashboard in a few clicks.
              </p>

              <form className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Institution name</span>
                  <input
                    type="text"
                    placeholder="Tuition class name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    placeholder="name@tuitionclass.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Mobile</span>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Role</span>
                  <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white">
                    <option>Director / Owner</option>
                    <option>Admin / Principal</option>
                    <option>Consultant</option>
                    <option>Other user</option>
                  </select>
                </label>

                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f47c20] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(244,124,32,0.28)] transition hover:bg-[#e56b0c]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </form>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                By continuing, you agree to receive product communication related to your free trial and onboarding.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="why-centre-plus" className="bg-white py-18 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">Best tuition class management software</p>
            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              A complete platform for admissions, academics, communication, and collection.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Centre+ brings the same polished, benefit-led presentation as the reference site, but fits it directly into
              your product with cleaner hierarchy and a more usable layout.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {coreBenefits.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f7fbff)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-sans text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-18 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">Features of tuition class management software</p>
            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              The key workflows tuition classes ask about first.
            </h2>
          </div>

          <div className="mt-12 space-y-6">
            {featureSections.map(({ eyebrow, title, description, points, icon: Icon }) => (
              <article
                key={title}
                className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:grid-cols-[300px_minmax(0,1fr)] lg:p-8"
              >
                <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#0d5eb7,#0a8bd9)] p-6 text-white">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mt-8 text-sm font-bold uppercase tracking-[0.22em] text-sky-100/80">{eyebrow}</p>
                  <h3 className="mt-3 font-sans text-3xl font-extrabold tracking-tight">{title}</h3>
                </div>

                <div className="flex flex-col justify-center">
                  <p className="text-base leading-8 text-slate-600">{description}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {points.map((point) => (
                      <div key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium leading-6 text-slate-700">
                        {point}
                      </div>
                    ))}
                  </div>
                  <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-800">
                    Know more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faqs" className="bg-white py-18 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">FAQs</p>
            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Common questions from tuition class owners.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The reference page leans heavily on educational SEO structure, so this section keeps that same commercial flow while staying visually cleaner.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map(({ question, answer }) => (
              <article key={question} className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <CircleHelp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-sans text-xl font-extrabold tracking-tight text-slate-900">{question}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(13,94,183,0.24),rgba(15,23,42,0.92))] p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">Centre+ for tuition classes</p>
              <h2 className="mt-3 max-w-2xl font-sans text-3xl font-extrabold tracking-tight sm:text-5xl">
                Present your tuition class like a modern brand and run it like a disciplined operation.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Start with the landing page redesign now, then we can carry the same style into the rest of your marketing site if you want.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f47c20] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#e56b0c]"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/6"
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright © 2026 Centre+. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-6">
              <span className="inline-flex items-center gap-2">
                <MessagesSquare className="h-4 w-4" />
                Parent communication
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Role-based access
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
