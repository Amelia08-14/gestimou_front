'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';
import { Key, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // Login via context
      login({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role
      }, data.token);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold text-brand-blue font-bold text-xl shadow-lg">
            G
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Connexion GESTIMOU
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Accédez à votre espace de gestion immobilière
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 text-slate-900 placeholder-slate-500 focus:border-brand-blue focus:ring-brand-blue sm:text-sm"
                  placeholder="Adresse email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 text-slate-900 placeholder-slate-500 focus:border-brand-blue focus:ring-brand-blue sm:text-sm"
                  placeholder="Mot de passe"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-brand-blue py-3 px-4 text-sm font-bold text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Connexion...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
          
          <div className="text-center text-xs text-slate-500">
            <p>Comptes de démonstrations - tout est fictif</p>
          </div>
        </form>
      </div>
    </div>
  );
}
