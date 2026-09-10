'use client';

import React, { useEffect, useState } from 'react';
import { Search, Check, X, UserPlus } from 'lucide-react';
import { API_URL } from '@/utils/api';

interface RegistrationRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  residenceId: string;
  block?: string | null;
  floor?: string | null;
  door?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function RegistrationsClient() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    const token = sessionStorage.getItem('token');
    fetch(`${API_URL}/registrations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchRequests();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(fetchRequests, 15000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Voulez-vous valider cette inscription ? Cela créera un compte utilisateur.')) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/registrations/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.propertyLinked) {
          alert(`Compte créé avec succès !\nMot de passe temporaire : ${data.tempPassword}\nLe bien a été affecté automatiquement au propriétaire.`);
        } else {
          alert(`Compte créé avec succès !\nMot de passe temporaire : ${data.tempPassword}\n\n⚠️ Le bien n'a pas pu être affecté automatiquement :\n${data.propertyLinkWarning || 'Bien introuvable.'}\n\nPensez à l'affecter manuellement depuis la gestion des biens.`);
        }
        fetchRequests();
      } else {
        alert('Erreur lors de la validation.');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur technique');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Voulez-vous rejeter cette demande ?')) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/registrations/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRequests();
      } else {
        alert('Erreur lors du rejet.');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur technique');
    }
  };

  const filteredRequests = requests
    .filter((r) => statusFilter === 'ALL' || r.status === statusFilter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q) ||
        String(r.residenceId || '').toLowerCase().includes(q)
      );
    });

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
  };
  const statusTabs: { key: string; label: string }[] = [
    { key: 'PENDING', label: `En attente (${counts.PENDING})` },
    { key: 'APPROVED', label: `Validées (${counts.APPROVED})` },
    { key: 'REJECTED', label: `Rejetées (${counts.REJECTED})` },
    { key: 'ALL', label: `Toutes (${counts.ALL})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-amber/10 text-brand-amber">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-amber">Demandes d&apos;inscription</h1>
            <p className="text-sm text-slate-500">Validez ou rejetez les demandes d&apos;inscription des résidents.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
              statusFilter === t.key
                ? 'border-brand-navy bg-brand-navy text-white'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="relative ml-auto min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, email, résidence..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-amber"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-6 py-4 font-semibold">Demandeur</th>
              <th className="px-6 py-4 font-semibold">Contact</th>
              <th className="px-6 py-4 font-semibold">Bien Déclaré</th>
              <th className="px-6 py-4 font-semibold">Statut</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chargement...</td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Aucune demande d&apos;inscription.</td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{req.firstName} {req.lastName}</div>
                    <div className="text-xs text-slate-500">Inscrit le {new Date(req.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{req.email}</div>
                    <div className="text-xs text-slate-500">{req.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-medium">{req.residenceId === 'prestige' ? 'Résidence Prestige' : req.residenceId}</div>
                    <div className="text-xs text-slate-500">
                      {[
                        req.block ? `Bloc ${req.block}` : null,
                        req.floor ? `Étage ${req.floor}` : null,
                        req.door ? `N° appartement ${req.door}` : null,
                      ].filter(Boolean).join(' - ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      req.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                      req.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {req.status === 'APPROVED' ? 'Validé' : req.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {req.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100"
                          title="Valider"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                          title="Rejeter"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
