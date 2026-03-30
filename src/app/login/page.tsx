'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, KeyRound, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUsernameValidationMessage, normalizeLoginIdentifier, normalizeUsername } from '@/lib/auth-credentials';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

const sellingPoints = [
  'Made for tuition centres, coaching institutes, and academy owners',
  'Warm premium styling with faster daily workflows for staff',
  'Username + password login, no more magic link dependency',
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [authView, setAuthView] = useState<'sign-in' | 'sign-up'>('sign-in');
  const supabase = createBrowserSupabaseClient();
  const authError = searchParams.get('error');

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = loginIdentifier.trim();

    if (password.trim().length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!identifier) {
      toast.error('Please enter your username');
      return;
    }

    startTransition(async () => {
      const { loginValue, type } = normalizeLoginIdentifier(identifier);
      const { error } = await supabase.auth.signInWithPassword({
        email: loginValue,
        password,
      });

      if (error) {
        toast.error(type === 'username' ? 'Invalid username or password' : error.message);
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    });
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = normalizeUsername(username);
    const usernameError = getUsernameValidationMessage(normalizedUsername);

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    if (password.trim().length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: normalizedUsername,
          password,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Could not create account');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizeLoginIdentifier(normalizedUsername).loginValue,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created');
      router.replace('/dashboard');
      router.refresh();
    });
  };

  return (
    <main className="heritage-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/50 bg-white/55 shadow-[0_30px_90px_rgba(115,65,27,0.12)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rangoli-pattern relative overflow-hidden bg-[linear-gradient(160deg,#7c2d12_0%,#b45309_35%,#0f766e_100%)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.14),transparent_28%)]" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 shadow-lg backdrop-blur">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-heading text-4xl leading-none">
                  Centre<span className="text-amber-200">+</span>
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.35em] text-orange-100/80">Academic Operations</p>
              </div>
            </div>

            <div className="mt-10 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-orange-50/90 backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-200" />
                Modern Indian design for coaching institutes that want to look premium
              </div>

              <h1 className="mt-6 text-5xl leading-[0.92] sm:text-6xl">
                Manage your institute with more grace and less chaos.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-8 text-orange-50/85 sm:text-lg">
                Attendance, fees, parent updates, and centre growth in one place, wrapped in a visual style inspired by sandstone, saffron, and polished Indian hospitality.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-auto">
              {sellingPoints.map((point) => (
                <div key={point} className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 text-sm leading-6 text-orange-50/88 backdrop-blur">
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-amber-100" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Professional look, practical workflow</p>
                  <p className="mt-2 text-sm leading-7 text-orange-50/80">
                    This refresh is designed to feel familiar to Indian users while still reading as modern software instead of a generic admin panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,251,245,0.88),rgba(249,239,222,0.96))] px-5 py-8 sm:px-8 lg:px-10">
          <Card className="ornate-border w-full max-w-md rounded-[2rem] border-0 bg-white/88 shadow-none">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-700">
                  {authView === 'sign-in' ? 'Welcome Back' : 'Create Account'}
                </p>
                <h2 className="mt-3 text-4xl text-slate-900">
                  {authView === 'sign-in' ? 'Sign in to your centre' : 'Choose your own login'}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                  {authView === 'sign-in'
                    ? 'Use the username and password you created to enter the dashboard.'
                    : 'Set a username and password once, then use them every time you log in.'}
                </p>
              </div>

              {authError ? (
                <div className="mb-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Sign-in failed: {decodeURIComponent(authError).replaceAll('_', ' ')}
                </div>
              ) : null}

              <div className="mb-6 grid grid-cols-2 rounded-full border border-amber-200 bg-amber-50/70 p-1">
                <button
                  type="button"
                  onClick={() => setAuthView('sign-in')}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    authView === 'sign-in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView('sign-up')}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    authView === 'sign-up' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authView === 'sign-in' ? (
                <form onSubmit={handlePasswordSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier" className="text-sm font-semibold text-slate-800">
                      Username
                    </Label>
                    <Input
                      id="login-identifier"
                      autoComplete="username"
                      placeholder="your_username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="h-12 rounded-2xl border-amber-200 bg-white/90"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-800">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-amber-200 bg-white/90"
                    />
                  </div>

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#8a3412,#d97706)] text-base font-semibold text-white shadow-lg shadow-orange-900/15 hover:opacity-95"
                  >
                    Login
                    <KeyRound className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-xs leading-6 text-slate-500">
                    Older accounts can still use email if needed, but all new accounts are meant to sign in with usernames.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleCreateAccount} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-slate-800">
                      Username
                    </Label>
                    <Input
                      id="username"
                      autoComplete="username"
                      placeholder="your_username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 rounded-2xl border-amber-200 bg-white/90"
                    />
                    <p className="text-xs leading-6 text-slate-500">
                      Use 3 to 30 lowercase letters, numbers, or underscores.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-semibold text-slate-800">
                      Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-amber-200 bg-white/90"
                    />
                  </div>

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#0f766e,#115e59)] text-base font-semibold text-white shadow-lg shadow-teal-900/15 hover:opacity-95"
                  >
                    Create Account
                    <UserPlus className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="flex items-start gap-2 rounded-[1.25rem] bg-amber-50 px-4 py-3 text-xs leading-6 text-slate-600">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />
                    Your chosen username becomes your regular login credential. No email link is required after this.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
