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
    <div
      className="flex min-h-screen w-full items-center justify-center p-4"
      style={{ backgroundColor: '#0c1620' }}
    >
      {/* Background subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #db9200 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, #db9200 0%, transparent 50%)`,
        }}
      />

      <div className="relative w-full max-w-md">
        {/* ── Logo block ──────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src="/logo-light.png"
            alt="Global Immo Service"
            width={80}
            height={80}
            className="object-contain drop-shadow-lg"
          />
          <div className="text-center">
            <p className="text-lg font-bold tracking-[0.25em] text-white uppercase">
              Global Immo Service
            </p>
            <p className="mt-1 text-xs tracking-widest text-white/40 uppercase">
              Espace Administration
            </p>
          </div>
        </div>

        {/* ── White card ──────────────────────────────────── */}
        <div className="rounded-2xl bg-white px-8 py-8 shadow-2xl">
          <h2 className="mb-6 text-xl font-bold text-brand-navy">
            Connexion
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-amber focus:bg-white focus:ring-2 focus:ring-brand-amber/20"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-amber focus:bg-white focus:ring-2 focus:ring-brand-amber/20"
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

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white transition-all shadow-md disabled:opacity-60"
              style={{ backgroundColor: '#db9200' }}
              onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#b87c00')}
              onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#db9200')}
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
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Global Immo Service
        </p>
      </div>
    </div>
  );
}
