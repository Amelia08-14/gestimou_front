'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, Users2 } from 'lucide-react';
import { clsx } from 'clsx';
import { API_URL } from '@/utils/api';

interface Residence {
  id: string;
  name: string;
}

interface Lot {
  propertyId: number;
  block: string;
  floor: string;
  lotNumber: string;
  surface: number | null;
  ownerName: string | null;
  ownerId: number | null;
  occupants: number;
  accountStatus: 'ACTIF' | 'PREMIERE_CONNEXION' | 'SANS_COMPTE';
  paymentStatus: 'REGLE' | 'IMPAYE' | null;
}

interface BlockGroup {
  block: string;
  lots: Lot[];
}

interface TrombinoscopeData {
  totalLots: number;
  activeAccounts: number;
  pendingFirstLogin: number;
  noAccount: number;
  blocks: BlockGroup[];
}

const authHeaders = () => {
  const token = sessionStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const ACCOUNT_LABEL: Record<Lot['accountStatus'], string> = {
  ACTIF: 'Actif',
  PREMIERE_CONNEXION: '1ère connexion en attente',
  SANS_COMPTE: 'Sans compte',
};
const ACCOUNT_STYLE: Record<Lot['accountStatus'], string> = {
  ACTIF: 'bg-emerald-100 text-emerald-600',
  PREMIERE_CONNEXION: 'bg-amber-100 text-amber-700',
  SANS_COMPTE: 'bg-red-100 text-red-500',
};

const PAYMENT_LABEL: Record<string, string> = { REGLE: 'Réglé', IMPAYE: 'Impayé' };
const PAYMENT_STYLE: Record<string, string> = {
  REGLE: 'bg-emerald-100 text-emerald-600',
  IMPAYE: 'bg-red-100 text-red-500',
};

export default function TrombinoscopeClient() {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [residenceId, setResidenceId] = useState('');
  const [data, setData] = useState<TrombinoscopeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API_URL}/residences`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((list: Residence[]) => {
        if (Array.isArray(list) && list.length) {
          setResidences(list);
          setResidenceId((prev) => prev || list[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!residenceId) return;
    setLoading(true);
    fetch(`${API_URL}/residences/${residenceId}/trombinoscope`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [residenceId]);

  const filteredBlocks = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.blocks;
    const q = search.trim().toLowerCase();
    return data.blocks
      .map((b) => ({
        ...b,
        lots: b.lots.filter(
          (l) => l.lotNumber.toLowerCase().includes(q) || (l.ownerName || '').toLowerCase().includes(q)
        ),
      }))
      .filter((b) => b.lots.length > 0);
  }, [data, search]);

  const toggleBlock = (block: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(block)) next.delete(block);
      else next.add(block);
      return next;
    });
  };

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy">Trombinoscope résidence</h1>
        <select
          value={residenceId}
          onChange={(e) => setResidenceId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-navy outline-none focus:border-brand-amber"
        >
          {residences.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {data && (
        <div className="mb-5 flex flex-wrap items-center gap-6 text-sm">
          <span className="font-bold text-brand-navy">{data.totalLots} <span className="font-normal text-slate-500">Lots</span></span>
          <span className="font-bold text-emerald-600">{data.activeAccounts} <span className="font-normal text-slate-500">Comptes actifs</span></span>
          <span className="font-bold text-amber-600">{data.pendingFirstLogin} <span className="font-normal text-slate-500">1ère connexion en attente</span></span>
          <span className="font-bold text-red-500">{data.noAccount} <span className="font-normal text-slate-500">Sans compte</span></span>
        </div>
      )}

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Lot ou propriétaire..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : filteredBlocks.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun lot trouvé.</p>
      ) : (
        <div className="space-y-5">
          {filteredBlocks.map((b) => {
            const active = b.lots.filter((l) => l.accountStatus === 'ACTIF').length;
            const noAccount = b.lots.filter((l) => l.accountStatus === 'SANS_COMPTE').length;
            const isCollapsed = collapsed.has(b.block);
            return (
              <div key={b.block} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button
                  onClick={() => toggleBlock(b.block)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left"
                >
                  <span className="font-bold text-brand-navy">Bloc {b.block}</span>
                  <span className="text-xs text-slate-400">{b.lots.length} lots</span>
                  {active > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">{active} actifs</span>
                  )}
                  {noAccount > 0 && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-500">{noAccount} sans compte</span>
                  )}
                  <ChevronDown className={clsx('ml-auto h-4 w-4 text-slate-400 transition-transform', !isCollapsed && 'rotate-180')} />
                </button>
                {!isCollapsed && (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-2.5">Lot</th>
                        <th className="px-5 py-2.5">Ét.</th>
                        <th className="px-5 py-2.5">Surface</th>
                        <th className="px-5 py-2.5">Propriétaire</th>
                        <th className="px-5 py-2.5">Occupants</th>
                        <th className="px-5 py-2.5">Compte</th>
                        <th className="px-5 py-2.5">Paiement</th>
                        <th className="px-5 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {b.lots.map((l) => (
                        <tr key={l.propertyId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="px-5 py-3 font-bold text-brand-navy">{b.block}-{String(l.lotNumber).padStart(2, '0')}</td>
                          <td className="px-5 py-3 text-slate-500">{l.floor || '—'}</td>
                          <td className="px-5 py-3 text-slate-500">{l.surface ? `${l.surface} m²` : '—'}</td>
                          <td className={clsx('px-5 py-3', l.ownerName ? 'text-brand-navy' : 'italic text-red-400')}>
                            {l.ownerName || 'Non renseigné'}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Users2 className="h-3.5 w-3.5" />
                              {l.occupants}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={clsx('rounded-full px-2.5 py-1 text-[11px] font-bold', ACCOUNT_STYLE[l.accountStatus])}>
                              {ACCOUNT_LABEL[l.accountStatus]}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {l.paymentStatus ? (
                              <span className={clsx('rounded-full px-2.5 py-1 text-[11px] font-bold', PAYMENT_STYLE[l.paymentStatus])}>
                                {PAYMENT_LABEL[l.paymentStatus]}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <a href={`/owners?propertyId=${l.propertyId}`} className="text-xs font-bold text-brand-amber hover:underline">
                              Voir →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
