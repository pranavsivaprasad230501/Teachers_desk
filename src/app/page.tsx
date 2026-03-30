import Link from 'next/link';
import { BookOpen, CheckCircle, Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1 items-center">
            <div className="relative w-10 h-10 mr-4 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Centre<span className="text-sky-600">+</span>
            </span>
          </div>
          <div className="flex flex-1 justify-end items-center gap-x-4">
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 hidden sm:block">
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center font-medium transition-colors bg-sky-600 hover:bg-sky-500 rounded-full px-6 py-2 text-white text-sm">
              Go to Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8 bg-white border-b">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0ea5e9] to-[#8b5cf6] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
        
        <div className="mx-auto max-w-4xl py-24 sm:py-32 lg:py-40 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 shadow-sm bg-white/50 backdrop-blur-md">
              Built for real centre operations, billing, and parent visibility.
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Run your tuition centre smoothly with <span className="text-sky-600">Zero Effort</span>
          </h1>
          <p className="mt-6 text-lg tracking-tight leading-8 text-gray-600 max-w-2xl mx-auto">
            Automate attendance, fee tracking, and parent communication via WhatsApp. The complete OS for coaching centres. Say goodbye to notebooks.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/login" className="inline-flex items-center justify-center transition-colors bg-sky-600 hover:bg-sky-500 rounded-full px-8 py-4 text-lg font-medium shadow-lg shadow-sky-500/30 text-white">
              Get Started Free
            </Link>
            <Link href="/dashboard/settings" className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-gray-400" /> View Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Features highlight */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-sky-600">Faster Operations</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-sky-600/10">
                    <CheckCircle className="h-6 w-6 text-sky-600" aria-hidden="true" />
                  </div>
                  1-Click Attendance
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Mark attendance for an entire batch from one screen and maintain a date-wise record for every student.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-violet-600/10">
                    <CheckCircle className="h-6 w-6 text-violet-600" aria-hidden="true" />
                  </div>
                  Automated Fee Reminders
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Track dues, mark payments, and manage your centre on a paid subscription with Stripe billing.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600/10">
                    <CheckCircle className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                  </div>
                  Parent Magic Link
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Parents get a unique read-only portal link to see attendance and fee status without logging in.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
