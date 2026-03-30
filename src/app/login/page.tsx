'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, KeyRound, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { getUsernameValidationMessage, normalizeLoginIdentifier, normalizeUsername } from '@/lib/auth-credentials';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center mb-6">
          <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            Centre<span className="text-sky-600">+</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your own username and password to access the dashboard
          </p>
        </div>

        <Card className="shadow-lg border-sky-100">
          <CardHeader>
            <CardTitle>{authView === 'sign-in' ? 'Welcome Back' : 'Create Your Account'}</CardTitle>
            <CardDescription>
              {authView === 'sign-in'
                ? 'Sign in with the username and password you created'
                : 'Pick a username and password to create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authError ? (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Sign-in failed: {decodeURIComponent(authError).replaceAll('_', ' ')}
              </div>
            ) : null}

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAuthView('sign-in')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  authView === 'sign-in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthView('sign-up')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  authView === 'sign-up' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Create Account
              </button>
            </div>

            {authView === 'sign-in' ? (
              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier">Username</Label>
                  <Input
                    id="login-identifier"
                    autoComplete="username"
                    placeholder="your_username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button disabled={isPending} type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white">
                  Login <KeyRound className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-slate-500">
                  Existing accounts can still sign in with email if needed, but new accounts are created with usernames.
                </p>
              </form>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Use 3 to 30 lowercase letters, numbers, or underscores.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button disabled={isPending} type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white">
                  Create Account <UserPlus className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-slate-500">
                  Your username becomes your sign-in credential, and the app handles the internal auth mapping for you.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
