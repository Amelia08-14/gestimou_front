'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Users, X } from 'lucide-react';
import { clsx } from 'clsx';
import { API_URL } from '@/utils/api';

interface Residence {
  id: string;
  name: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  category: 'URGENT' | 'INFO' | 'EVENT';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED';
  residenceId: string | null;
  residenceName: string | null;
  blocks: string | null;
  publishAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  readCount: number;
  audienceCount: number;
}

const authHeaders = () => {
  const token = sessionStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const CATEGORY_LABEL: Record<Announcement['category'], string> = { URGENT: 'Urgent', INFO: 'Info', EVENT: 'Événement' };
const CATEGORY_STYLE: Record<Announcement['category'], string> = {
  URGENT: 'bg-red-100 text-red-600',
  INFO: 'bg-blue-100 text-blue-600',
  EVENT: 'bg-brand-amber/15 text-brand-amber',
};
const STATUS_LABEL: Record<Announcement['status'], string> = {
  DRAFT: 'Brouillon',
  SCHEDULED: 'Planifiée',
  PUBLISHED: 'Publiée',
  EXPIRED: 'Expirée',
};
const STATUS_STYLE: Record<Announcement['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  SCHEDULED: 'bg-blue-100 text-blue-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-600',
  EXPIRED: 'bg-red-100 text-red-500',
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = {
  title: '',
  body: '',
  category: 'INFO' as Announcement['category'],
  status: 'DRAFT' as Announcement['status'],
  residenceId: '',
  blocks: '',
  publishAt: '',
  expiresAt: '',
};

export default function AvisClient() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | Announcement['category']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Announcement['status']>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, rRes] = await Promise.all([
        fetch(`${API_URL}/announcements/manage`, { headers: authHeaders() }),
        fetch(`${API_URL}/residences`, { headers: authHeaders() }),
      ]);
      const aData = await aRes.json();
      const rData = await rRes.json();
      if (Array.isArray(aData)) setItems(aData);
      if (Array.isArray(rData)) setResidences(rData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (search.trim() && !a.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, categoryFilter, statusFilter, search]);

  const openNew = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const save = async (publish: boolean) => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        residenceId: form.residenceId || null,
        status: publish ? 'PUBLISHED' : form.status,
        publishAt: form.publishAt || null,
        expiresAt: form.expiresAt || null,
      };
      const res = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        load();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy">Avis &amp; Annonces</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-brand-amber px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-95"
        >
          <Plus className="h-4 w-4" />
          Nouvel avis
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative mr-2 flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou résidence..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-amber"
          />
        </div>
        {(['ALL', 'URGENT', 'INFO', 'EVENT'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={clsx(
              'rounded-lg border px-3 py-2 text-xs font-bold transition-colors',
              categoryFilter === c ? 'border-brand-amber bg-brand-amber text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            )}
          >
            {c === 'ALL' ? 'Tous types' : CATEGORY_LABEL[c]}
          </button>
        ))}
        {(['ALL', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'EXPIRED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={clsx(
              'rounded-lg border px-3 py-2 text-xs font-bold transition-colors',
              statusFilter === s ? 'border-brand-navy bg-brand-navy text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            )}
          >
            {s === 'ALL' ? 'Tous statuts' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Titre</th>
              <th className="px-5 py-3">Résidence</th>
              <th className="px-5 py-3">Publication</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Lus</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">Chargement…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">Aucun avis.</td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="max-w-sm px-5 py-4 align-top">
                    <span className={clsx('mb-1 inline-block rounded px-2 py-0.5 text-[11px] font-bold', CATEGORY_STYLE[a.category])}>
                      {CATEGORY_LABEL[a.category]}
                    </span>
                    <p className="font-bold text-brand-navy">{a.title}</p>
                    <p className="truncate text-xs text-slate-500">{a.body}</p>
                  </td>
                  <td className="px-5 py-4 align-top text-xs text-slate-600">
                    <p className="font-medium text-slate-700">{a.residenceName || 'Toutes résidences'}</p>
                    <p className="text-slate-400">{a.blocks ? `Bloc ${a.blocks}` : 'Tous les blocs'}</p>
                  </td>
                  <td className="px-5 py-4 align-top text-xs text-slate-500">{fmtDate(a.publishAt || a.createdAt)}</td>
                  <td className="px-5 py-4 align-top">
                    <span className={clsx('rounded-full px-2.5 py-1 text-[11px] font-bold', STATUS_STYLE[a.status])}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-xs text-slate-500">
                    {a.status === 'PUBLISHED' || a.status === 'EXPIRED' ? (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {a.readCount}/{a.audienceCount}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-navy">Nouvel avis</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titre"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-amber"
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Contenu de l'avis..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-amber"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Type</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Announcement['category'] })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-amber"
                  >
                    <option value="INFO">Info</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EVENT">Événement</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Résidence</label>
                  <select
                    value={form.residenceId}
                    onChange={(e) => setForm({ ...form, residenceId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-amber"
                  >
                    <option value="">Toutes résidences</option>
                    {residences.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Blocs concernés (optionnel)</label>
                <input
                  value={form.blocks}
                  onChange={(e) => setForm({ ...form, blocks: e.target.value })}
                  placeholder="Ex: A,B — laisser vide pour tous les blocs"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Publication planifiée</label>
                  <input
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm({ ...form, publishAt: e.target.value, status: e.target.value ? 'SCHEDULED' : form.status })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Expiration (optionnel)</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-amber"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Enregistrer en brouillon
              </button>
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="rounded-xl bg-brand-amber px-4 py-2.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
