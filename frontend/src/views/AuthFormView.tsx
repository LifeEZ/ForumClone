'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Trees } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'register';

interface AuthFormViewProps {
  mode: AuthMode;
}

export function AuthFormView({ mode }: AuthFormViewProps) {
  const router = useRouter();
  const { user, isLoading, login, register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === 'login';

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-forest-muted">
        Loading…
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="flex items-center gap-2 text-forest-accent mb-8 hover:text-forest-accent-hover transition-colors"
      >
        <Trees className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight text-forest-text">
          Hiver
        </span>
      </Link>

      <div className="w-full max-w-md bg-forest-surface border border-forest-border rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-forest-text mb-2">
          {isLogin ? 'Log in' : 'Create account'}
        </h1>
        <p className="text-forest-muted mb-6">
          {isLogin
            ? 'Welcome back to the forest.'
            : 'Join Hiver with username, email, and password.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-forest-text mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-forest-bg border border-forest-border rounded-xl px-4 py-2.5 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent"
            />
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-forest-text mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-forest-bg border border-forest-border rounded-xl px-4 py-2.5 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-forest-text mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-forest-bg border border-forest-border rounded-xl px-4 py-2.5 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent"
            />
            {!isLogin && (
              <p className="text-xs text-forest-muted mt-1.5">
                At least 8 characters
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-forest-accent hover:bg-forest-accent-hover text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Please wait…'
              : isLogin
                ? 'Log in'
                : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-forest-muted text-center mt-6">
          {isLogin ? (
            <>
              New here?{' '}
              <Link
                href="/register"
                className="text-forest-accent hover:text-forest-accent-hover font-medium"
              >
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-forest-accent hover:text-forest-accent-hover font-medium"
              >
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
