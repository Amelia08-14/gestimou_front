'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { API_URL } from '@/utils/api';

interface AccountDevice {
  id: string;
  name: string;
  lastActive: string;
}

interface HouseholdAccount {
  id: number;
  fullName: string;
  email?: string | null;
  relation?: string | null;
  userId?: number | null;
  isActive: boolean | null;
  devices?: AccountDevice[] | null;
}

interface AccountInfo {
  maxDevices: number;
  user: { id: number; email: string; isActive: boolean; devices: AccountDevice[] } | null;
  household: HouseholdAccount[];
}

const formatLastSeen = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token') || '';

// "Accès application": lets a super admin cut off a suspicious resident
// account (or one of the accounts a resident created for their household).
// The backend only serves this to ADMIN, so the section hides itself otherwise.
export default function OwnerAccessSection({ ownerId }: { ownerId: number }) {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/owners/${ownerId}/account`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        setHidden(true);
        return;
      }
      setInfo(await res.json());
    } catch {
      setHidden(true);
    }
  }, [ownerId]);

  useEffect(() => {
    setInfo(null);
    setHidden(false);
    load();
  }, [load]);

  const setActive = async (userId: number, isActive: boolean, label: string, includeHousehold = false) => {
    const householdNote = includeHousehold ? '\n\nLes comptes des membres du foyer seront également concernés.' : '';
    const question = isActive
      ? `Réactiver le compte de ${label} ?${householdNote}`
      : `Désactiver le compte de ${label} ?\n\nLa personne sera immédiatement déconnectée et ne pourra plus se connecter.${householdNote}`;
    if (!confirm(question)) return;

    setBusyUserId(userId);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ isActive, includeHousehold })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Erreur lors de la mise à jour du compte');
        return;
      }
      await load();
    } catch (e) {
      console.error(e);
      alert('Erreur technique');
    } finally {
      setBusyUserId(null);
    }
  };

  const resetDevices = async (userId: number, label: string) => {
    if (!confirm(`Réinitialiser les appareils de ${label} ?\n\nLa personne pourra se reconnecter depuis de nouveaux appareils.`)) return;

    setBusyUserId(userId);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/reset-devices`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Erreur lors de la réinitialisation des appareils');
        return;
      }
      await load();
    } catch (e) {
      console.error(e);
      alert('Erreur technique');
    } finally {
      setBusyUserId(null);
    }
  };

  if (hidden || !info || !info.user) return null;

  const { user, household, maxDevices } = info;

  const renderDevices = (userId: number, label: string, devices: AccountDevice[]) => (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">
          Appareils connectés ({devices.length}/{maxDevices})
        </p>
        {devices.length > 0 ? (
          <button
            disabled={busyUserId === userId}
            onClick={() => resetDevices(userId, label)}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Réinitialiser
          </button>
        ) : null}
      </div>
      {devices.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">Aucun appareil enregistré.</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {devices.map((device) => (
            <li key={device.id} className="text-xs text-slate-500">
              {device.name} · dernière activité le {formatLastSeen(device.lastActive)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Accès application</h3>
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{user.email}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {user.isActive ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              {user.isActive ? 'Compte actif' : 'Compte désactivé'}
            </span>
          </div>
          <button
            disabled={busyUserId === user.id}
            onClick={() => setActive(user.id, !user.isActive, user.email, household.some((m) => m.userId))}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              user.isActive
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {user.isActive ? 'Désactiver' : 'Réactiver'}
          </button>
        </div>
        {renderDevices(user.id, user.email, user.devices)}

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-medium text-slate-500">Membres du foyer ({household.length}/4)</p>
          {household.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">Aucun membre ajouté.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {household.map((member) => (
                <li key={member.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {member.fullName}
                        {member.relation ? <span className="font-normal text-slate-400"> · {member.relation}</span> : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">{member.email || 'Sans compte de connexion'}</p>
                    </div>
                    {member.userId ? (
                      <button
                        disabled={busyUserId === member.userId}
                        onClick={() => setActive(member.userId as number, !member.isActive, member.fullName)}
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          member.isActive
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {member.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                    ) : null}
                  </div>
                  {member.userId && member.devices ? renderDevices(member.userId, member.fullName, member.devices) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
