'use client';

import { useState } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { API_URL } from '@/utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call the backend directly from the browser — same as every other
      // page in this app. The old `/api/auth/login` Next.js route proxied
      // this server-to-server, which failed (the VPS couldn't reliably
      // reach its own public domain from inside itself).
      const res = await fetch(`${API_URL}/auth/login`, {
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

  const fieldClass =
    'block w-full rounded-lg border-[1.5px] border-[#e5e5e5] bg-gi-field px-[14.5px] py-[14.5px] text-base text-gi-muted placeholder-[#b2b2b2] outline-none transition-colors focus:border-[#cccccc]';
  const canSubmit = email.trim() !== '' && password !== '' && !loading;

  return (
    <div className="flex min-h-screen w-full bg-brand-cream">
      {/* ── Form — "Login LT" frame of the app ─────────────── */}
      <div className="flex w-full flex-col px-5 py-10 sm:px-16 lg:w-[46%] lg:px-20">
        <div className="gi-appear mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
          <Image
            src="/brand/gis_logo_vertical_light.png"
            alt="Gérance Immo Service"
            width={112}
            height={112}
            priority
            className="mb-10 self-center lg:self-start"
          />

          <h1 className="text-[28px] font-bold leading-[1.2] text-brand-navy">Bienvenue chez vous</h1>
          <p className="mt-2 text-base text-brand-navy">Connectez-vous à la console d&apos;administration.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-gi-muted">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="nom@aymenpromotion.dz"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-gi-muted">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${fieldClass} pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b2b2b2] transition-colors hover:text-gi-muted"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-gi-error/25 bg-gi-error/5 px-4 py-3 text-sm text-gi-error">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="!mt-8 flex w-full items-center justify-center rounded-[28px] bg-brand-amber px-6 py-4 text-base font-medium text-black transition-all duration-200 hover:brightness-95 active:scale-[0.97] disabled:bg-[#dedbd5] disabled:text-[#b2b2b2] disabled:active:scale-100"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-gi-muted">
          Accès réservé au personnel Aymen Promotion.
        </p>
      </div>

      {/* ── Brand panel ─────────────────────────────────────── */}
      <div className="relative m-4 hidden flex-1 overflow-hidden rounded-[28px] lg:block">
        <Image src="/login-bg.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Image
            src="/brand/gis_logo_vertical_dark.png"
            alt="Gérance Immo Service"
            width={88}
            height={88}
          />
          <div>
            <span className="inline-block rounded-md border border-brand-amber/40 bg-brand-amber/15 px-2.5 py-1 text-xs font-medium text-brand-amber">
              Console d&apos;administration
            </span>
            <h2 className="mt-4 max-w-md text-[32px] font-semibold leading-[1.2] text-brand-cream">
              Vos résidences, tickets et finances au même endroit.
            </h2>
            <p className="mt-3 max-w-md text-[15px] text-white/60">
              La même expérience que l&apos;application mobile, sur grand écran.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
