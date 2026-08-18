'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      login(
        { id: data.id, name: data.name, email: data.email, role: data.role },
        data.token,
        data.mustChangePassword ? '/profile' : '/'
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-brand-cream">
      {/* ── Left: form ──────────────────────────────────────── */}
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3">
            <Image src="/logo-dark.png" alt="Global Immo Service" width={40} height={40} className="object-contain" />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-widest text-brand-navy uppercase">Global Immo</p>
              <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">Service</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-brand-navy">Global Immo Service</h1>
          <p className="mt-1.5 text-sm text-slate-500">Entrez vos identifiants pour accéder à la console.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/20"
                  placeholder="nom@aymenpromotion.dz"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-brand-amber py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-95 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connexion…
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Accès réservé au personnel Aymen Promotion.
          </p>
        </div>
      </div>

      {/* ── Right: brand panel ──────────────────────────────── */}
      <div className="relative hidden lg:block lg:w-1/2">
        <Image src="/login-bg.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-brand-navy/70" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
          <Image
            src="/logo-light.png"
            alt="Global Immo Service"
            width={96}
            height={96}
            className="object-contain drop-shadow-lg"
          />
          <p className="mt-4 text-lg font-bold tracking-[0.25em] text-white uppercase">Global Immo</p>
          <p className="text-sm font-semibold tracking-[0.3em] text-white/70 uppercase">Service</p>
          <h2 className="mt-10 text-3xl font-bold text-white">Console d&apos;administration</h2>
          <p className="mt-3 max-w-sm text-sm text-white/60">
            Interface de gestion exclusive réservée au personnel Aymen Promotion. Accès restreint.
          </p>
        </div>
      </div>
    </div>
  );
}
