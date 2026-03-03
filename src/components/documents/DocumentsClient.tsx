'use client';

import { 
  FileText, 
  Download, 
  Trash2, 
  Upload, 
  Shield, 
  FileWarning, 
  Phone 
} from 'lucide-react';
import { useState } from 'react';

export default function DocumentsClient() {
  const [activeTab, setActiveTab] = useState('All');

  const documents = [
    { id: 1, name: 'Consignes de Sécurité - Incendie.pdf', category: 'Sécurité', type: 'PDF', size: '1.2 MB', date: '2024-03-01', icon: Shield, color: 'text-red-500 bg-red-50' },
    { id: 2, name: 'Plan d\'évacuation - Prestige.pdf', category: 'Sécurité', type: 'PDF', size: '3.5 MB', date: '2024-02-15', icon: FileWarning, color: 'text-orange-500 bg-orange-50' },
    { id: 3, name: 'Liste Contacts SAV & Urgences.xlsx', category: 'SAV', type: 'Excel', size: '45 KB', date: '2024-03-05', icon: Phone, color: 'text-blue-500 bg-blue-50' },
    { id: 4, name: 'Règlement Intérieur Copropriété.pdf', category: 'Administratif', type: 'PDF', size: '2.1 MB', date: '2024-01-10', icon: FileText, color: 'text-slate-500 bg-slate-50' },
    { id: 5, name: 'Contrat Maintenance Ascenseur.pdf', category: 'Contrats', type: 'PDF', size: '1.8 MB', date: '2024-01-05', icon: FileText, color: 'text-slate-500 bg-slate-50' },
  ];

  const filteredDocs = activeTab === 'All' ? documents : documents.filter(d => d.category === activeTab);

  const categories = ['All', 'Sécurité', 'SAV', 'Administratif', 'Contrats'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion Documentaire</h1>
          <p className="text-sm text-slate-500">Centralisez tous les documents de la résidence.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors shadow-sm">
          <Upload className="h-4 w-4" />
          Ajouter un document
        </button>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {categories.map((cat) => (
            <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === cat 
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
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-brand-gold/30">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-3 ${doc.color}`}>
                <doc.icon className="h-6 w-6" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-blue" title="Télécharger">
                    <Download className="h-4 w-4" />
                </button>
                <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Supprimer">
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
              <p className="text-xs text-slate-400 pt-2">Ajouté le {new Date(doc.date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        ))}
        
        {/* Upload Placeholder */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:border-brand-blue/50 hover:bg-blue-50/50 cursor-pointer">
            <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <Upload className="h-6 w-6 text-brand-blue" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-900">Déposer un fichier</p>
            <p className="text-xs text-slate-500">ou cliquer pour parcourir</p>
        </div>
      </div>
    </div>
  );
}
