'use client';

import { useState } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { Key, Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/utils/api';

export default function ProfilePage() {
  const { user } = useRole();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      return;
    }

    setLoading(true);
    const token = sessionStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur technique' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon Profil</h1>
        <p className="text-sm text-slate-500">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-brand-gold text-brand-blue text-3xl font-bold flex items-center justify-center mb-4 shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
              <span className="px-3 py-1 bg-blue-50 text-brand-blue text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-blue" />
              <h3 className="font-bold text-slate-900">Sécurité du compte</h3>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                      placeholder="Nouveau mot de passe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                      placeholder="Confirmer"
                    />
                  </div>
                </div>
              </div>

              {message.text && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                    : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {message.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-brand-blue/90 transition-all disabled:opacity-50"
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
