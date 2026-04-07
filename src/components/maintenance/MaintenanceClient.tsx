'use client';

import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal, 
  Filter,
  Plus,
  X,
  Download,
} from 'lucide-react';
// import { MaintenanceTicket } from '@prisma/client';
import { useRole } from '@/contexts/RoleContext';
import { API_URL } from '@/utils/api';

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category?: string | null;
  location: string;
  requester: string;
  assignee?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  residenceId?: string | null;
}

interface MaintenanceClientProps {
  tickets: MaintenanceTicket[];
}

interface ProblemCategory {
  category: string;
  items: string[];
}

const PROBLEM_TYPES: ProblemCategory[] = [
  {
    category: "Peinture (Partie Commune)",
    items: [
        "Retouches peinture couloir",
        "Peinture écaillée",
        "Traces d'humidité",
        "Autre problème de peinture"
    ]
  },
  {
    category: "Plomberie (Partie Commune)",
    items: [
        "Fuite d'eau",
        "Canalisation bouchée",
        "Mauvaise odeur",
        "Autre problème plomberie"
    ]
  },
  {
    category: "Problème Bâche à eau",
    items: [
        "Niveau d'eau bas",
        "Fuite bâche",
        "Pompe défectueuse",
        "Autre problème bâche"
    ]
  },
  {
    category: "Problème Groupe électrogène",
    items: [
        "Panne au démarrage",
        "Niveau carburant bas",
        "Bruit anormal",
        "Eclairage défectueux"
    ]
  },
  {
    category: "Ascenseurs & Accès",
    items: [
        "Ascenseur en panne",
        "Problème TAG d'accès",
        "Rideau parking défaillant",
        "Porte hall bloquée"
    ]
  },
  {
    category: "Hygiène & Sécurité",
    items: [
        "Déchets accumulés",
        "Nettoyage partie communes",
        "Problème de sécurité",
        "Nuisances sonores"
    ]
  },
  {
    category: "Espaces Extérieurs",
    items: [
        "Espace vert",
        "Place de parking occupée",
        "Eclairage extérieur"
    ]
  },
  {
    category: "Autres",
    items: ["Autres"]
  }
];

export default function MaintenanceClient({ tickets: initialTickets }: MaintenanceClientProps) {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(initialTickets);
  const [activeTab, setActiveTab] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    assignee: '',
    category: '',
    requester: '',
    q: '',
    dateFrom: '',
    dateTo: ''
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  
  const { role, user } = useRole();
  const [intervenants, setIntervenants] = useState<any[]>([]);

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const passesFilters = (ticket: MaintenanceTicket) => {
    if (filters.priority && ticket.priority !== filters.priority) return false;
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.assignee && (ticket.assignee || '') !== filters.assignee) return false;
    if (filters.category && (ticket.category || '') !== filters.category) return false;
    if (filters.requester && normalizeText(ticket.requester || '').indexOf(normalizeText(filters.requester)) === -1) return false;
    if (filters.q) {
      const needle = normalizeText(filters.q);
      const hay = normalizeText(`${ticket.title} ${ticket.description} ${ticket.location} ${ticket.requester} ${ticket.assignee || ''} ${ticket.category || ''}`);
      if (!hay.includes(needle)) return false;
    }

    const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
    const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : null;
    const date = new Date(ticket.createdAt);
    if (from && date < from) return false;
    if (to && date > to) return false;

    return true;
  };

  const displayedTickets = tickets.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'my_tickets') return t.assignee === user?.name;
    return t.status.toLowerCase() === activeTab;
  }).filter(passesFilters).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  const handleExport = () => {
    const rows: Array<Array<unknown>> = [
      ['ID', 'Ticket', 'Catégorie', 'Priorité', 'Lieu', 'Demandeur', 'Intervenant', 'Statut', 'Date création'],
      ...displayedTickets.map((t) => ([
        t.id,
        t.title,
        t.category || '',
        t.priority,
        t.location,
        t.requester,
        t.assignee || '',
        t.status,
        new Date(t.createdAt).toLocaleDateString('fr-FR')
      ]))
    ];
    downloadCsv(`maintenance_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleOpenFilters = () => {
    setDraftFilters(filters);
    setShowFilters(true);
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const initial = {
      priority: '',
      status: '',
      assignee: '',
      category: '',
      requester: '',
      q: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(initial);
    setDraftFilters(initial);
    setShowFilters(false);
  };

  // Load intervenants for Admin assignment
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Fetch Tickets
    fetch(`${API_URL}/maintenance`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tickets');
        return res.json();
    })
    .then(data => {
        if (Array.isArray(data)) setTickets(data);
    })
    .catch(err => console.error(err));

    if (role === 'ADMIN') {
        // Fetch from new Express API
        fetch(`${API_URL}/users?role=INTERVENANT`, {
             headers: {
                'Authorization': `Bearer ${token}`
            }
        }) 
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setIntervenants(data);
                }
            })
            .catch(err => console.error("Failed to load intervenants", err));
    }
  }, [role]);

  // Fetch tickets on mount instead of passing props (Migration step)
  // Or keep props if we migrate Server Component fetching later.
  // For now, let's keep props but update actions to use new API.

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/maintenance/${ticketId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            setTickets(tickets.map(t => 
                t.id === ticketId ? { ...t, status: newStatus } : t
            ));
        } else {
            alert('Impossible de changer le statut');
        }
    } catch (e) {
        console.error(e);
        alert('Erreur technique');
    }
  };

  const handleAssigneeChange = async (ticketId: string, newAssignee: string) => {
    if (role !== 'ADMIN') return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/maintenance/${ticketId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ assignee: newAssignee })
        });

        if (res.ok) {
            setTickets(tickets.map(t => 
                t.id === ticketId ? { ...t, assignee: newAssignee } : t
            ));
        } else {
            alert("Impossible d'assigner l'intervenant");
        }
    } catch (e) {
        console.error(e);
        alert('Erreur technique');
    }
  };

  const [newTicket, setNewTicket] = useState({
    title: '', // This will be the category/problem type
    description: '',
    location: 'Parties Communes',
    requester: '',
    priority: 'Moyenne',
    status: 'Signalé',
    assignee: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        // Find category from title (selected item)
        let category = 'Autres';
        for (const group of PROBLEM_TYPES) {
            if (group.items.includes(newTicket.title)) {
                category = group.category;
                break;
            }
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/maintenance`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ...newTicket,
                category: category 
            })
        });

        if (res.ok) {
             const createdTicket = await res.json();
             // Ensure createdTicket matches MaintenanceTicket interface or close enough
             // The backend returns the Sequelize object, which has id, createdAt, etc.
             // We might need to map it if structure differs slightly, but usually it matches well enough for JS/TS if not strict.
             // With strict TS, we might cast it.
             setTickets([createdTicket as unknown as MaintenanceTicket, ...tickets]); 
             setIsAddModalOpen(false);
             setNewTicket({
                title: '', description: '', location: 'Parties Communes',
                requester: '', priority: 'Moyenne', status: 'Signalé', assignee: ''
             });
        } else {
            alert("Erreur lors de la création");
        }

    } catch (e) {
        console.error(e);
        alert("Erreur technique");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance & Interventions</h1>
          <p className="text-sm text-slate-500">Suivi des demandes et travaux (Parties Communes uniquement).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenFilters}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
            Filtres
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
          {role === 'ADMIN' && (
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
                <Plus className="h-4 w-4" />
                Nouveau ticket
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Ticket</th>
                <th className="px-6 py-4 font-medium">Priorité</th>
                <th className="px-6 py-4 font-medium">Lieu & Demandeur</th>
                <th className="px-6 py-4 font-medium">Intervenant</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTickets.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        {role === 'INTERVENANT' 
                            ? `Aucun ticket assigné à ${user?.name || 'moi'}.`
                            : "Aucun ticket trouvé."}
                      </td>
                  </tr>
              ) : (
                displayedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                        <div>
                        <span className="font-medium text-slate-900">{ticket.title}</span>
                        <p className="text-xs text-slate-500">{ticket.category || ticket.title}</p>
                        <p className="text-[10px] text-slate-400">{ticket.id}</p>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        ticket.priority === 'Urgent' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                        ticket.priority === 'Haute' ? 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/10' :
                        ticket.priority === 'Moyenne' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10' :
                        'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/10'
                        }`}>
                        {ticket.priority}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                        <span className="text-slate-900">{ticket.location || 'Parties Communes'}</span>
                        <span className="text-xs text-slate-500">Par {ticket.requester}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                        {role === 'ADMIN' ? (
                            <select
                                value={ticket.assignee || ''}
                                onChange={(e) => handleAssigneeChange(ticket.id, e.target.value)}
                                className="text-sm bg-transparent border border-transparent hover:border-slate-200 rounded px-1 py-0.5 focus:border-brand-blue focus:ring-0"
                            >
                                <option value="">Non assigné</option>
                                {intervenants.map((intervenant: any) => (
                                    <option key={intervenant.id} value={intervenant.name}>
                                        {intervenant.name} ({intervenant.profession || 'Intervenant'})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span>{ticket.assignee || '-'}</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                        {ticket.status === 'Terminé' ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> :
                        ticket.status === 'En cours' ? <Clock className="h-4 w-4 text-blue-500 shrink-0" /> :
                        <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />}
                        
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className={`text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6 ${
                                ticket.status === 'Terminé' ? 'text-emerald-700' :
                                ticket.status === 'En cours' ? 'text-blue-700' :
                                'text-slate-700'
                            }`}
                        >
                            <option value="Signalé">Signalé</option>
                            <option value="En cours">En cours</option>
                            <option value="Terminé">Terminé</option>
                        </select>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ticket Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">Nouveau Ticket</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de problème</label>
                <select 
                  required 
                  name="title" 
                  value={newTicket.title} 
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                >
                    <option value="">Sélectionner un type...</option>
                    {PROBLEM_TYPES.map((group) => (
                        <optgroup key={group.category} label={group.category}>
                            {group.items.map(item => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required 
                  name="description" 
                  value={newTicket.description} 
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Détaillez le problème..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lieu</label>
                  <input 
                    readOnly
                    name="location" 
                    value="Parties Communes"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Strictement réservé aux parties communes.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Demandeur</label>
                  <input 
                    required 
                    name="requester" 
                    value={newTicket.requester} 
                    onChange={handleInputChange}
                    placeholder="Votre nom..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
                  <select 
                    name="priority" 
                    value={newTicket.priority} 
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  >
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigné à</label>
                  <input 
                    name="assignee" 
                    value={newTicket.assignee} 
                    onChange={handleInputChange}
                    placeholder="Prestataire..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" 
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  {isSubmitting ? 'Création...' : 'Créer le ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <label className="text-sm font-medium text-slate-700">Recherche</label>
                  <input
                    type="text"
                    value={draftFilters.q}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, q: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Ticket, demandeur, lieu…"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Demandeur</label>
                  <input
                    type="text"
                    value={draftFilters.requester}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, requester: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Nom du demandeur"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <select
                    value={draftFilters.status}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Tous</option>
                    <option value="Signalé">Signalé</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Priorité</label>
                  <select
                    value={draftFilters.priority}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Toutes</option>
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Catégorie</label>
                  <select
                    value={draftFilters.category}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Toutes</option>
                    {Array.from(new Set(tickets.map((t) => t.category).filter(Boolean) as string[]))
                      .sort((a, b) => a.localeCompare(b, 'fr'))
                      .map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Intervenant</label>
                  <select
                    value={draftFilters.assignee}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, assignee: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Tous</option>
                    {Array.from(new Set(tickets.map((t) => t.assignee).filter(Boolean) as string[]))
                      .sort((a, b) => a.localeCompare(b, 'fr'))
                      .map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date du</label>
                  <input
                    type="date"
                    value={draftFilters.dateFrom}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Au</label>
                  <input
                    type="date"
                    value={draftFilters.dateTo}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button onClick={handleResetFilters} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Réinitialiser
                </button>
                <button onClick={handleApplyFilters} className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-blue-800">
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
