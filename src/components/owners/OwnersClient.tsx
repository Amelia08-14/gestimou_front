'use client';

import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  FileText 
} from 'lucide-react';
import { useState, useEffect } from 'react';
// import { Owner, Property } from '@prisma/client';

// Define types manually since we removed Prisma
interface Property {
  id: number;
  title: string;
  type: string;
  surface: number;
  floor?: string | null;
  block?: string | null;
  lotNumber?: string | null;
  status: string;
  residenceId: string;
  price?: string | null; // Mapped from Decimal
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  status: string;
  avatar?: string | null;
  totalChargesPaid: string; // Mapped from Decimal
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

// Extended type for Owner with serialized Decimal fields
type OwnerWithDetails = Owner & {
  unpaidBalance?: string; // Serialized Decimal
  propertiesCount: number;
  properties?: Property[]; // Optional loaded properties
};

interface OwnersClientProps {
  owners: OwnerWithDetails[];
}

export default function OwnersClient({ owners }: OwnersClientProps) {
  const [ownersList, setOwnersList] = useState<OwnerWithDetails[]>(owners);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<OwnerWithDetails | null>(null);
  const [showProperties, setShowProperties] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOwners = ownersList.filter(owner => 
    owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://landing.aymenpromotion-dz.com/api';

  // Fetch owners on mount (Client-side)
  // This ensures we get fresh data and can use auth token if needed
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/owners`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch');
    })
    .then(data => {
        if (Array.isArray(data)) {
            setOwnersList(data);
        }
    })
    .catch(err => console.error("Error fetching owners:", err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (owner: OwnerWithDetails) => {
    setSelectedOwner(owner);
    setFormData({
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone || '',
      address: owner.address || '',
      emergencyContactName: owner.emergencyContactName || '',
      emergencyContactPhone: owner.emergencyContactPhone || ''
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleViewProperties = async (owner: OwnerWithDetails) => {
    setSelectedOwner(owner);
    setShowProperties(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/owners/${owner.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            setSelectedOwner(data); 
            setProperties(data.properties || []);
        }
    } catch (e) {
        console.error("Failed to load properties", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = isEditing && selectedOwner ? `${API_URL}/owners/${selectedOwner.id}` : `${API_URL}/owners`;
      const method = isEditing ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const res = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');

      // Refresh list locally
      const savedOwner = await res.json();
      if (isEditing) {
          setOwnersList(prev => prev.map(o => o.id === savedOwner.id ? savedOwner : o));
      } else {
          setOwnersList(prev => [...prev, savedOwner]);
      }
      setShowAddModal(false);
      
    } catch (error) {
      alert('Erreur: Impossible de sauvegarder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Propriétaires</h1>
          <p className="text-sm text-slate-500">Gérez les fiches propriétaires et leurs coordonnées.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm w-64"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-brand-blue hover:bg-brand-gold-hover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nouveau Propriétaire
          </button>
        </div>
      </div>

      {/* Owners Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredOwners.map((owner) => (
          <div key={owner.id} className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-brand-blue flex items-center justify-center text-brand-gold font-bold text-lg shadow-inner">
                    {owner.avatar || (owner.firstName[0] + owner.lastName[0])}
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-blue group-hover:text-brand-gold-dark transition-colors">
                      {owner.firstName} {owner.lastName}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 mt-1">
                      {owner.propertiesCount} Biens
                    </span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-brand-blue">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-brand-gold" />
                  <a href={`mailto:${owner.email}`} className="hover:text-brand-blue hover:underline truncate">{owner.email}</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="h-4 w-4 text-brand-gold" />
                  <span>{owner.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-brand-gold" />
                  <span className="truncate">{owner.address}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => setSelectedOwner(owner)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-colors">
                  <FileText className="h-4 w-4" />
                  Détails
                </button>
                <button 
                  onClick={() => handleViewProperties(owner)}
                  className="flex-1 rounded-lg bg-brand-blue py-2 text-sm font-medium text-white hover:bg-brand-blue/90 transition-colors"
                >
                  Voir Biens
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Owner Details Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-blue flex items-center justify-center text-brand-gold font-bold text-lg shadow-inner">
                  {selectedOwner.avatar || (selectedOwner.firstName[0] + selectedOwner.lastName[0])}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-blue">{selectedOwner.firstName} {selectedOwner.lastName}</h2>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                      selectedOwner.status === 'Actif' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedOwner.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedOwner(null); setShowProperties(false); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Coordonnées</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="h-5 w-5 text-brand-gold" />
                    <span>{selectedOwner.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="h-5 w-5 text-brand-gold" />
                    <span>{selectedOwner.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="h-5 w-5 text-brand-gold" />
                    <span>{selectedOwner.address}</span>
                  </div>
                </div>
              </div>

               <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Contact d'Urgence</h3>
                <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="font-semibold">{selectedOwner.emergencyContactName || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="h-4 w-4 text-red-400" />
                    <span>{selectedOwner.emergencyContactPhone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Finances</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Total Charges Payées</span>
                        <span className="text-lg font-bold text-emerald-600">{selectedOwner.totalChargesPaid} DA</span>
                    </div>
                    {selectedOwner.unpaidBalance && Number(selectedOwner.unpaidBalance) > 0 && (
                        <>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <span className="text-sm font-medium text-slate-600">Reste à Payer</span>
                            <span className="text-lg font-bold text-red-600">{selectedOwner.unpaidBalance} DA</span>
                        </div>
                        <button 
                            onClick={() => alert(`Email de relance envoyé à ${selectedOwner.email}`)}
                            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                        >
                            <Mail className="h-4 w-4" />
                            Relancer par mail
                        </button>
                        </>
                    )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Patrimoine</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">Nombre de biens</span>
                        <span className="text-lg font-bold text-brand-blue">{selectedOwner.propertiesCount}</span>
                    </div>
                  {!showProperties ? (
                    <button 
                      onClick={() => handleViewProperties(selectedOwner)}
                      className="w-full mt-2 text-sm text-brand-gold hover:underline text-left"
                    >
                      Voir la liste des biens →
                    </button>
                  ) : (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                      {properties.length > 0 ? (
                        <ul className="space-y-2">
                            {properties.map((prop: any) => (
                                <li key={prop.id} className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                                    <span className="font-semibold block">{prop.title}</span>
                                    <span className="text-xs text-slate-500">{prop.type} - Lot {prop.lotNumber} - {prop.floor ? `Etage ${prop.floor}` : ''}</span>
                                </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="text-center text-sm text-slate-500 italic py-2">
                            Aucun bien trouvé.
                        </div>
                      )}
                      <button 
                        onClick={() => setShowProperties(false)}
                        className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 text-center"
                      >
                        Masquer la liste
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  onClick={() => { setSelectedOwner(null); setShowProperties(false); }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => handleEdit(selectedOwner)}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-brand-blue/90 shadow-md">
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Owner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-brand-blue">Nouveau Propriétaire</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Prénom</label>
                  <input
                    required
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nom</label>
                  <input
                    required
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Adresse</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Contact d'Urgence</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nom complet</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      placeholder="Ex: Conjoint, Parent..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Téléphone</label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-brand-blue/90 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Création...' : 'Créer le propriétaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
