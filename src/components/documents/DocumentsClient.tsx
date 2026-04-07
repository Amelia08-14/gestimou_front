'use client';

import { 
  FileText, 
  Download, 
  Trash2, 
  Upload, 
  Filter,
  Shield, 
  FileWarning, 
  Phone 
} from 'lucide-react';
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
  type: string;
  size: string;
  category: string;
  residenceId?: string | null;
  url?: string | null;
  createdAt: string;
  Residence?: ResidenceSummary | null;
}

interface DocumentFilters {
  category: string;
  residenceId: string;
  q: string;
}

const initialFilters: DocumentFilters = {
  category: 'All',
  residenceId: '',
  q: ''
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const csvEscape = (value: unknown) => {
  const str = String(value ?? '');
  const needsQuotes = /[;"\n\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const downloadCsv = (filename: string, rows: Array<Array<unknown>>) => {
  const content = '\uFEFF' + rows.map((row) => row.map(csvEscape).join(';')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function DocumentsClient() {
  const [filters, setFilters] = useState<DocumentFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<DocumentFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [residences, setResidences] = useState<ResidenceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    category: 'Sécurité',
    residenceId: '',
    name: ''
  });

  const categories = ['All', 'Sécurité', 'SAV', 'Administratif', 'Contrats'];

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
      reader.readAsDataURL(file);
    });

  const loadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoading(true);

    try {
      const [docsRes, residencesRes] = await Promise.all([
        fetch(`${API_URL}/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/residences`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (docsRes.ok) {
        const data = await docsRes.json();
        if (Array.isArray(data)) setDocuments(data);
      }

      if (residencesRes.ok) {
        const data = await residencesRes.json();
        if (Array.isArray(data)) setResidences(data);
      }
    } catch (error) {
      console.error('Failed to load documents', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDocs = useMemo(() => {
    const q = normalizeText(filters.q);
    return documents.filter((doc) => {
      if (filters.category !== 'All' && doc.category !== filters.category) return false;
      if (filters.residenceId && doc.residenceId !== filters.residenceId) return false;
      if (q && !normalizeText(doc.name).includes(q)) return false;
      return true;
    });
  }, [documents, filters]);

  const handleOpenFilters = () => {
    setDraftFilters(filters);
    setShowFilters(true);
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setDraftFilters(initialFilters);
    setShowFilters(false);
  };

  const handleExport = () => {
    const rows: Array<Array<unknown>> = [
      ['ID', 'Nom', 'Catégorie', 'Type', 'Taille', 'Zone', 'Résidence', 'Ajouté le'],
      ...filteredDocs.map((doc) => ([
        doc.id,
        doc.name,
        doc.category,
        doc.type,
        doc.size,
        doc.Residence?.zone || '',
        doc.Residence?.name || '',
        new Date(doc.createdAt).toLocaleDateString('fr-FR')
      ]))
    ];

    downloadCsv(`documents_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleDownload = async (doc: DocumentItem) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Téléchargement impossible');
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
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Téléchargement impossible');
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!confirm('Supprimer ce document ?')) return;

    try {
      const response = await fetch(`${API_URL}/documents/${doc.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Suppression impossible');
      }

      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Suppression impossible');
    }
  };

  const handleUploadFile = async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Non authentifié');
    setIsUploading(true);

    try {
      const name = uploadForm.name.trim() || file.name;

      if (file.size > 200 * 1024 * 1024) throw new Error('Fichier trop grand (max 200MB)');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('category', uploadForm.category);
      if (uploadForm.residenceId) formData.append('residenceId', uploadForm.residenceId);

      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error || 'Upload impossible');

      setDocuments((prev) => [json as DocumentItem, ...prev]);
      setShowUploadModal(false);
      setUploadForm({ category: 'Sécurité', residenceId: '', name: '' });
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const getIcon = (doc: DocumentItem) => {
    const type = (doc.type || '').toLowerCase();
    if (type === 'pdf') return { icon: Shield, color: 'text-red-500 bg-red-50' };
    if (type === 'xlsx' || type === 'xls') return { icon: Phone, color: 'text-blue-500 bg-blue-50' };
    if (type === 'doc' || type === 'docx') return { icon: FileText, color: 'text-slate-500 bg-slate-50' };
    if (type === 'png' || type === 'jpg' || type === 'jpeg' || type === 'webp') return { icon: FileWarning, color: 'text-orange-500 bg-orange-50' };
    return { icon: FileText, color: 'text-slate-500 bg-slate-50' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion Documentaire</h1>
          <p className="text-sm text-slate-500">Centralisez tous les documents de la résidence.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenFilters}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter className="h-4 w-4" />
            Filtres
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Ajouter un document
          </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {categories.map((cat) => (
            <button
                key={cat}
                onClick={() => setFilters((prev) => ({ ...prev, category: cat }))}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    filters.category === cat 
                    ? 'border-brand-gold text-brand-blue' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                {cat === 'All' ? 'Tous les documents' : cat}
            </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center text-slate-500 py-8">Chargement...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full text-center text-slate-500 py-8">Aucun document.</div>
        ) : filteredDocs.map((doc) => {
          const meta = getIcon(doc);
          const Icon = meta.icon;
          return (
          <div key={doc.id} className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-brand-gold/30">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-3 ${meta.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDownload(doc)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-blue" title="Télécharger">
                    <Download className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(doc)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-1">
              <h3 className="font-medium text-slate-900 line-clamp-2" title={doc.name}>{doc.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{doc.category}</span>
                <span>•</span>
                <span>{doc.size}</span>
                <span>•</span>
                <span>{doc.type}</span>
              </div>
              <p className="text-xs text-slate-400 pt-2">
                Ajouté le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        )})}
        
        {/* Upload Placeholder */}
        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:border-brand-blue/50 hover:bg-blue-50/50 cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setPendingFile(file);
                setUploadForm((prev) => ({ ...prev, name: file.name }));
                setShowUploadModal(true);
              }}
            />
            <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <Upload className="h-6 w-6 text-brand-blue" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-900">Déposer un fichier</p>
            <p className="text-xs text-slate-500">ou cliquer pour parcourir</p>
        </label>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">Filtres</h2>
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Résidence</label>
                  <select
                    value={draftFilters.residenceId}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, residenceId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="">Toutes</option>
                    {residences.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Recherche</label>
                  <input
                    type="text"
                    value={draftFilters.q}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, q: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="Nom du document"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button onClick={handleResetFilters} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Réinitialiser
                </button>
                <button onClick={handleApplyFilters} className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-brand-blue/90">
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">Ajouter un document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="text-sm text-slate-600">
                {pendingFile ? `Fichier: ${pendingFile.name}` : 'Sélectionnez un fichier.'}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Catégorie</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {categories.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Résidence</label>
                <select
                  value={uploadForm.residenceId}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, residenceId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Aucune</option>
                  {residences.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nom</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-between items-center gap-3 border-t border-slate-100 pt-4">
                <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${isUploading ? 'opacity-50' : ''}`}>
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      setPendingFile(file);
                      setUploadForm((prev) => ({ ...prev, name: prev.name || file.name }));
                    }}
                  />
                  Choisir un fichier
                </label>
                <button
                  disabled={!pendingFile || isUploading}
                  onClick={() => {
                    if (!pendingFile) return;
                    handleUploadFile(pendingFile)
                      .then(() => setPendingFile(null))
                      .catch((error) => alert(error instanceof Error ? error.message : 'Upload impossible'));
                  }}
                  className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {isUploading ? 'Téléversement...' : 'Téléverser'}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Fermer
                </button>
              </div>
              <p className="text-xs text-slate-400">Formats: PDF, XLSX, DOCX, PNG/JPG/WEBP. Taille max: 200MB.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
