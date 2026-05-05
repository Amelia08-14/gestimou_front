'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/utils/api';

interface ResidenceSummary {
  id: string;
  name: string;
  zone?: string | null;
}

interface DocumentItem {
  id: number;
  name: string;
  category: string;
  type: string;
  size: string;
  url?: string | null;
  createdAt: string;
}

interface AppelDeFondsDocumentItem {
  id: number;
  phase: string;
  documentId: number;
  document?: DocumentItem | null;
  createdAt: string;
}

interface Dashboard {
  rassemble: number;
  depense: number;
  reste: number;
}

interface AppelDeFonds {
  id: number;
  residenceId: string;
  probleme: string;
  coutEstimeGlobal: string;
  queteParProprietaire: string;
  status: string;
  publishedAt?: string | null;
  processedAt?: string | null;
  queteRassemblee?: string | null;
  coutReel?: string | null;
  createdAt: string;
  updatedAt: string;
  residence?: ResidenceSummary | null;
  documents?: AppelDeFondsDocumentItem[];
  ownerCount?: number;
  expectedTotal?: number;
  dashboard?: Dashboard;
  notifiedResidents?: number;
}

const formatMoney = (value: unknown) => {
  const n = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const safeNumberInput = (value: string) => value.replace(/[^\d.,-]/g, '');

export default function AppelDeFondsClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [appels, setAppels] = useState<AppelDeFonds[]>([]);
  const [residences, setResidences] = useState<ResidenceSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AppelDeFonds | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createFilesBefore, setCreateFilesBefore] = useState<File[]>([]);
  const [detailFilesBefore, setDetailFilesBefore] = useState<File[]>([]);
  const [detailFilesAfter, setDetailFilesAfter] = useState<File[]>([]);

  const [createForm, setCreateForm] = useState({
    residenceId: '',
    probleme: '',
    coutEstimeGlobal: '',
    queteParProprietaire: '',
  });

  const [afterForm, setAfterForm] = useState({
    queteRassemblee: '',
    coutReel: '',
  });

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const selectedResidence = useMemo(() => {
    const rid = selected?.residenceId || '';
    return residences.find((r) => String(r.id) === String(rid)) || selected?.residence || null;
  }, [residences, selected?.residence, selected?.residenceId]);

  const refreshList = async () => {
    if (!token) return;
    const response = await fetch(`${API_URL}/appel-de-fonds`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data)) setAppels(data);
  };

  const loadDetail = async (id: number) => {
    if (!token) return;
    setSelectedId(id);
    const response = await fetch(`${API_URL}/appel-de-fonds/${id}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    setSelected(data);
    setAfterForm({
      queteRassemblee: data?.queteRassemblee != null ? String(data.queteRassemblee) : '',
      coutReel: data?.coutReel != null ? String(data.coutReel) : '',
    });
  };

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [residencesResponse, appelsResponse] = await Promise.all([
          fetch(`${API_URL}/residences`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/appel-de-fonds`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (residencesResponse.ok) {
          const r = await residencesResponse.json();
          if (Array.isArray(r)) setResidences(r);
        }

        if (appelsResponse.ok) {
          const a = await appelsResponse.json();
          if (Array.isArray(a)) setAppels(a);

          const firstId = Array.isArray(a) && a.length ? Number(a[0]?.id) : null;
          if (selectedId == null && firstId) {
            setSelectedId(firstId);
            const detailResponse = await fetch(`${API_URL}/appel-de-fonds/${firstId}`, {
              cache: 'no-store',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (detailResponse.ok) {
              const detail = await detailResponse.json();
              setSelected(detail);
              setAfterForm({
                queteRassemblee: detail?.queteRassemblee != null ? String(detail.queteRassemblee) : '',
                coutReel: detail?.coutReel != null ? String(detail.coutReel) : '',
              });
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [token, selectedId]);

  const uploadDocument = async (file: File, residenceId: string) => {
    if (!token) throw new Error('Non authentifié');
    if (file.size > 200 * 1024 * 1024) throw new Error('Fichier trop grand (max 200MB)');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('category', 'Appel de fonds');
    formData.append('residenceId', residenceId);

    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'Upload impossible');
    return data as DocumentItem;
  };

  const attachDocuments = async (appelId: number, phase: 'BEFORE' | 'AFTER', documentIds: number[]) => {
    if (!token) throw new Error('Non authentifié');
    const response = await fetch(`${API_URL}/appel-de-fonds/${appelId}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase, documentIds }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'Association impossible');
    return data as AppelDeFonds;
  };

  const handleDownload = async (doc: DocumentItem) => {
    if (!token) return;
    const response = await fetch(`${API_URL}/documents/${doc.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      alert(err?.error || 'Téléchargement impossible');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name || `document-${doc.id}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDetach = async (docId: number, phase: string) => {
    if (!token || !selected) return;
    const response = await fetch(`${API_URL}/appel-de-fonds/${selected.id}/documents/${docId}?phase=${encodeURIComponent(phase)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    await loadDetail(selected.id);
  };

  const handleCreate = async () => {
    if (!token) return;
    if (!createForm.residenceId || !createForm.probleme.trim()) {
      alert('Veuillez sélectionner une résidence et saisir le problème.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/appel-de-fonds`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residenceId: createForm.residenceId,
          probleme: createForm.probleme,
          coutEstimeGlobal: createForm.coutEstimeGlobal,
          queteParProprietaire: createForm.queteParProprietaire,
          status: 'DRAFT',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Création impossible');

      const created = data as AppelDeFonds;
      for (const file of createFilesBefore) {
        const doc = await uploadDocument(file, created.residenceId);
        await attachDocuments(created.id, 'BEFORE', [doc.id]);
      }

      setShowCreate(false);
      setCreateForm({ residenceId: '', probleme: '', coutEstimeGlobal: '', queteParProprietaire: '' });
      setCreateFilesBefore([]);
      await refreshList();
      await loadDetail(created.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!token || !selected) return;
    if (!confirm('Publier cet appel de fonds et notifier les résidents ?')) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/appel-de-fonds/${selected.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Publication impossible');
      await refreshList();
      await loadDetail(selected.id);
      if (data?.notifiedResidents != null) {
        alert(`Notification envoyée à ${data.notifiedResidents} résident(s).`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Publication impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAfter = async () => {
    if (!token || !selected) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/appel-de-fonds/${selected.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queteRassemblee: afterForm.queteRassemblee,
          coutReel: afterForm.coutReel,
          status: 'PROCESSED',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Sauvegarde impossible');

      for (const file of detailFilesAfter) {
        const doc = await uploadDocument(file, selected.residenceId);
        await attachDocuments(selected.id, 'AFTER', [doc.id]);
      }

      setDetailFilesAfter([]);
      await refreshList();
      await loadDetail(selected.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Sauvegarde impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhase = async (phase: 'BEFORE' | 'AFTER') => {
    if (!token || !selected) return;
    const files = phase === 'BEFORE' ? detailFilesBefore : detailFilesAfter;
    if (!files.length) return;
    setIsSaving(true);
    try {
      for (const file of files) {
        const doc = await uploadDocument(file, selected.residenceId);
        await attachDocuments(selected.id, phase, [doc.id]);
      }
      if (phase === 'BEFORE') setDetailFilesBefore([]);
      if (phase === 'AFTER') setDetailFilesAfter([]);
      await loadDetail(selected.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const docsBefore = useMemo(() => (selected?.documents || []).filter((d) => String(d.phase || '').toUpperCase() === 'BEFORE'), [selected?.documents]);
  const docsAfter = useMemo(() => (selected?.documents || []).filter((d) => String(d.phase || '').toUpperCase() === 'AFTER'), [selected?.documents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Appel de fonds</h1>
          <p className="text-sm text-slate-500">Création, traitement, documents justificatifs et suivi</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90"
        >
          Nouveau
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Liste</p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {appels.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Aucun appel de fonds.</p>
            ) : (
              appels.map((a) => {
                const active = selectedId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => loadDetail(a.id)}
                    className={`w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 ${active ? 'bg-slate-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{a.residence?.name || a.residenceId}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.probleme}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${a.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : a.status === 'PROCESSED' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Quête/proprio: {formatMoney(a.queteParProprietaire)} DA</span>
                      <span>Créé: {new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          {!selected ? (
            <p className="text-sm text-slate-500">Sélectionnez un appel de fonds.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Résidence</p>
                  <p className="text-lg font-bold text-slate-900">{selectedResidence?.name || selected.residenceId}</p>
                  {selectedResidence?.zone ? <p className="text-xs text-slate-500">Zone: {selectedResidence.zone}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{selected.status}</span>
                  {selected.status !== 'PUBLISHED' ? (
                    <button
                      onClick={handlePublish}
                      disabled={isSaving}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Publier + notifier
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Rassemblé</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{formatMoney(selected.dashboard?.rassemble ?? selected.queteRassemblee ?? 0)} DA</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Dépensé</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{formatMoney(selected.dashboard?.depense ?? selected.coutReel ?? 0)} DA</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Reste</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{formatMoney(selected.dashboard?.reste ?? 0)} DA</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">Le problème</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{selected.probleme}</p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">Avant traitement</p>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Coût estimé global</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(selected.coutEstimeGlobal)} DA</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Quête par propriétaire</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(selected.queteParProprietaire)} DA</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500">Prévision (propriétaires × quête)</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {selected.ownerCount != null ? `${selected.ownerCount} propriétaire(s)` : '-'} · {selected.expectedTotal != null ? `${formatMoney(selected.expectedTotal)} DA` : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Documents justificatifs</p>
                    {docsBefore.length === 0 ? (
                      <p className="text-xs text-slate-500">Aucun document.</p>
                    ) : (
                      <div className="space-y-2">
                        {docsBefore.map((d) => (
                          <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-800">{d.document?.name || `Document #${d.documentId}`}</p>
                              <p className="text-[10px] text-slate-500">{d.document?.type || ''} · {d.document?.size || ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {d.document ? (
                                <button onClick={() => handleDownload(d.document as DocumentItem)} className="text-xs font-semibold text-brand-blue hover:underline">
                                  Télécharger
                                </button>
                              ) : null}
                              <button onClick={() => handleDetach(d.documentId, d.phase)} className="text-xs font-semibold text-rose-600 hover:underline">
                                Retirer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-dashed border-slate-300 p-3">
                    <p className="text-xs font-semibold text-slate-600">Ajouter des documents</p>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setDetailFilesBefore(Array.from(e.target.files || []))}
                      className="mt-2 block w-full text-xs"
                    />
                    <button
                      onClick={() => handleUploadPhase('BEFORE')}
                      disabled={isSaving || detailFilesBefore.length === 0}
                      className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Upload
                    </button>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">Après traitement</p>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Quête rassemblée</label>
                      <input
                        value={afterForm.queteRassemblee}
                        onChange={(e) => setAfterForm((p) => ({ ...p, queteRassemblee: safeNumberInput(e.target.value) }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Coût réel</label>
                      <input
                        value={afterForm.coutReel}
                        onChange={(e) => setAfterForm((p) => ({ ...p, coutReel: safeNumberInput(e.target.value) }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Documents justificatifs</p>
                    {docsAfter.length === 0 ? (
                      <p className="text-xs text-slate-500">Aucun document.</p>
                    ) : (
                      <div className="space-y-2">
                        {docsAfter.map((d) => (
                          <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-800">{d.document?.name || `Document #${d.documentId}`}</p>
                              <p className="text-[10px] text-slate-500">{d.document?.type || ''} · {d.document?.size || ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {d.document ? (
                                <button onClick={() => handleDownload(d.document as DocumentItem)} className="text-xs font-semibold text-brand-blue hover:underline">
                                  Télécharger
                                </button>
                              ) : null}
                              <button onClick={() => handleDetach(d.documentId, d.phase)} className="text-xs font-semibold text-rose-600 hover:underline">
                                Retirer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-dashed border-slate-300 p-3">
                    <p className="text-xs font-semibold text-slate-600">Ajouter des documents</p>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setDetailFilesAfter(Array.from(e.target.files || []))}
                      className="mt-2 block w-full text-xs"
                    />
                  </div>

                  <button
                    onClick={handleSaveAfter}
                    disabled={isSaving}
                    className="w-full rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50"
                  >
                    Enregistrer après traitement
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-900">Nouvel appel de fonds</p>
                <p className="text-sm text-slate-500">Avant traitement</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                Fermer
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Résidence</label>
                <select
                  value={createForm.residenceId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, residenceId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {residences.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.zone ? `(${r.zone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Le problème</label>
                <textarea
                  value={createForm.probleme}
                  onChange={(e) => setCreateForm((p) => ({ ...p, probleme: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Coût estimé global</label>
                  <input
                    value={createForm.coutEstimeGlobal}
                    onChange={(e) => setCreateForm((p) => ({ ...p, coutEstimeGlobal: safeNumberInput(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Quête par propriétaire</label>
                  <input
                    value={createForm.queteParProprietaire}
                    onChange={(e) => setCreateForm((p) => ({ ...p, queteParProprietaire: safeNumberInput(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-slate-300 p-3">
                <p className="text-xs font-semibold text-slate-600">Documents justificatifs (avant traitement)</p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setCreateFilesBefore(Array.from(e.target.files || []))}
                  className="mt-2 block w-full text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
