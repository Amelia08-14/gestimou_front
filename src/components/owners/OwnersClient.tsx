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
import { useEffect, useState } from 'react';
import { API_URL } from '@/utils/api';

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
  price?: string | null;
  ownerId?: number | null;
}

interface ResidenceSummary {
  id: string;
  name: string;
  zone?: string | null;
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  residenceId?: string | null;
  block?: string | null;
  floor?: string | null;
  doorNumber?: string | null;
  parkingNumber?: string | null;
  address?: string | null;
  status: string;
  avatar?: string | null;
  totalChargesPaid: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  residence?: ResidenceSummary | null;
}

type OwnerWithDetails = Owner & {
  unpaidBalance?: string;
  propertiesCount: number;
  properties?: Property[];
};

interface OwnersClientProps {
  owners: OwnerWithDetails[];
}

export default function OwnersClient({ owners }: OwnersClientProps) {
  const [ownersList, setOwnersList] = useState<OwnerWithDetails[]>(owners);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<OwnerWithDetails | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | ''>('');
  const [residences, setResidences] = useState<ResidenceSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    residenceId: '',
    block: '',
    floor: '',
    doorNumber: '',
    parkingNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const filteredOwners = ownersList.filter((owner) =>
    owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.residence?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.block || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      residenceId: '',
      block: '',
      floor: '',
      doorNumber: '',
      parkingNumber: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    });
    setIsEditing(false);
    setSelectedOwner(null);
  };

  const loadOwners = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/owners?onlyResidents=true`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch owners');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setOwnersList(data);
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  const loadResidences = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/residences`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch residences');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setResidences(data);
      }
    } catch (error) {
      console.error('Error fetching residences:', error);
    }
  };

  useEffect(() => {
    loadOwners();
    loadResidences();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadOwners();
        loadResidences();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const interval = window.setInterval(() => {
      loadOwners();
      loadResidences();
    }, 15000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = (owner: OwnerWithDetails) => {
    setSelectedOwner(owner);
    setFormData({
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone || '',
      residenceId: owner.residenceId || '',
      block: owner.block || '',
      floor: owner.floor || '',
      doorNumber: owner.doorNumber || '',
      parkingNumber: owner.parkingNumber || '',
      address: owner.address || '',
      emergencyContactName: owner.emergencyContactName || '',
      emergencyContactPhone: owner.emergencyContactPhone || ''
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const openOwnerDetails = async (owner: OwnerWithDetails, expandProperties = false) => {
    setSelectedOwner(owner);
    setShowProperties(expandProperties);
    setSelectedPropertyId('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/owners/${owner.id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load owner');
      }

      const data = await response.json();
      setSelectedOwner(data);
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Failed to load owner:', error);
    }
  };

  const loadAllProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties`, { cache: 'no-store' });
      if (!response.ok) return;
      const json = await response.json().catch(() => ({}));
      const data = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
      setAllProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  useEffect(() => {
    if (showProperties) {
      loadAllProperties();
    }
  }, [showProperties]);

  const handleAssignProperty = async () => {
    if (!selectedOwner) return;
    if (!selectedPropertyId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/properties/${selectedPropertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ownerId: selectedOwner.id })
      });
      if (!res.ok) throw new Error('Assign failed');
      await openOwnerDetails(selectedOwner, true);
      await loadOwners();
    } catch (e) {
      alert("Impossible d'affecter ce bien.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = isEditing && selectedOwner ? `${API_URL}/owners/${selectedOwner.id}` : `${API_URL}/owners`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone || null,
          residenceId: formData.residenceId || null,
          block: formData.block || null,
          floor: formData.floor || null,
          doorNumber: formData.doorNumber || null,
          parkingNumber: formData.parkingNumber || null,
          address: formData.address || null,
          emergencyContactName: formData.emergencyContactName || null,
          emergencyContactPhone: formData.emergencyContactPhone || null
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      await loadOwners();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      alert('Erreur: Impossible de sauvegarder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Propriétaires</h1>
          <p className="text-sm text-slate-500">Gérez les fiches propriétaires, leur résidence et leur localisation.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-64 rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-brand-blue shadow-sm transition-colors hover:bg-brand-gold-hover"
          >
            <Plus className="h-4 w-4" />
            Nouveau Propriétaire
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredOwners.map((owner) => (
          <div key={owner.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-brand-gold/30 hover:shadow-md">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-lg font-bold text-brand-gold shadow-inner">
                    {owner.avatar || (owner.firstName[0] + owner.lastName[0])}
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-blue transition-colors group-hover:text-brand-gold-dark">
                      {owner.firstName} {owner.lastName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {owner.propertiesCount} Biens
                      </span>
                      {owner.residence?.name && (
                        <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                          {owner.residence.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-brand-blue">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-brand-gold" />
                  <a href={`mailto:${owner.email}`} className="truncate hover:text-brand-blue hover:underline">
                    {owner.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="h-4 w-4 text-brand-gold" />
                  <span>{owner.phone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-brand-gold" />
                  <span className="truncate">
                    {owner.block || owner.floor || owner.doorNumber
                      ? `${owner.block || 'Bloc -'} • Étage ${owner.floor || '-'} • Porte ${owner.doorNumber || '-'}`
                      : owner.address || 'Adresse non renseignée'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => openOwnerDetails(owner)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-blue"
                >
                  <FileText className="h-4 w-4" />
                  Détails
                </button>
                <button
                  onClick={() => openOwnerDetails(owner, true)}
                  className="flex-1 rounded-lg bg-brand-blue py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90"
                >
                  Voir Biens
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-lg font-bold text-brand-gold shadow-inner">
                  {selectedOwner.avatar || (selectedOwner.firstName[0] + selectedOwner.lastName[0])}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-blue">
                    {selectedOwner.firstName} {selectedOwner.lastName}
                  </h2>
                  <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    selectedOwner.status === 'Actif' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedOwner.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOwner(null);
                  setShowProperties(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Coordonnées</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="h-5 w-5 text-brand-gold" />
                    <span>{selectedOwner.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="h-5 w-5 text-brand-gold" />
                    <span>{selectedOwner.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="h-5 w-5 text-brand-gold" />
                    <span>{selectedOwner.address || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Localisation</h3>
                <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Résidence</span>
                    <span className="font-medium text-slate-900">{selectedOwner.residence?.name || 'Non renseignée'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Zone</span>
                    <span className="font-medium text-slate-900">{selectedOwner.residence?.zone || 'Non renseignée'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Bloc</span>
                    <span className="font-medium text-slate-900">{selectedOwner.block || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Étage</span>
                    <span className="font-medium text-slate-900">{selectedOwner.floor || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">N° porte</span>
                    <span className="font-medium text-slate-900">{selectedOwner.doorNumber || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Parking</span>
                    <span className="font-medium text-slate-900">{selectedOwner.parkingNumber || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Contact d'Urgence</h3>
                <div className="space-y-3 rounded-lg border border-red-100 bg-red-50 p-3">
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Finances</h3>
                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Total Charges Payées</span>
                    <span className="text-lg font-bold text-emerald-600">{selectedOwner.totalChargesPaid} DA</span>
                  </div>
                  {selectedOwner.unpaidBalance && Number(selectedOwner.unpaidBalance) > 0 && (
                    <>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                        <span className="text-sm font-medium text-slate-600">Reste à Payer</span>
                        <span className="text-lg font-bold text-red-600">{selectedOwner.unpaidBalance} DA</span>
                      </div>
                      <button
                        onClick={() => alert(`Email de relance envoyé à ${selectedOwner.email}`)}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Mail className="h-4 w-4" />
                        Relancer par mail
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Patrimoine</h3>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Nombre de biens</span>
                    <span className="text-lg font-bold text-brand-blue">{selectedOwner.propertiesCount}</span>
                  </div>
                  {!showProperties ? (
                    <button
                      onClick={() => openOwnerDetails(selectedOwner, true)}
                      className="mt-2 w-full text-left text-sm text-brand-gold hover:underline"
                    >
                      Voir la liste des biens →
                    </button>
                  ) : (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-xs font-medium text-slate-500">Affecter un bien</p>
                        <div className="mt-2 flex gap-2">
                          <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          >
                            <option value="">Sélectionner un bien</option>
                            {allProperties
                              .filter((p) => !p.ownerId)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.title} • {p.residenceId} • Lot {p.lotNumber || '-'}
                                </option>
                              ))}
                          </select>
                          <button
                            onClick={handleAssignProperty}
                            disabled={!selectedPropertyId}
                            className="shrink-0 rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                          >
                            Affecter
                          </button>
                        </div>
                      </div>
                      {properties.length > 0 ? (
                        <ul className="space-y-2">
                          {properties.map((property) => (
                            <li key={property.id} className="rounded border border-slate-200 bg-white p-2 text-sm text-slate-700">
                              <span className="block font-semibold">{property.title}</span>
                              <span className="text-xs text-slate-500">
                                {property.type} - Lot {property.lotNumber || '-'} - {property.floor ? `Étage ${property.floor}` : 'Étage -'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="py-2 text-center text-sm italic text-slate-500">
                          Aucun bien trouvé.
                        </div>
                      )}
                      <button
                        onClick={() => setShowProperties(false)}
                        className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-600"
                      >
                        Masquer la liste
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    setSelectedOwner(null);
                    setShowProperties(false);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleEdit(selectedOwner)}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-brand-blue/90"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-brand-blue">
                {isEditing ? 'Modifier le propriétaire' : 'Nouveau Propriétaire'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
                <label className="text-sm font-medium text-slate-700">Résidence</label>
                <select
                  name="residenceId"
                  value={formData.residenceId}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                >
                  <option value="">Sélectionner une résidence</option>
                  {residences.map((residence) => (
                    <option key={residence.id} value={residence.id}>
                      {residence.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Bloc</label>
                  <input
                    type="text"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Étage</label>
                  <input
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">N° porte</label>
                  <input
                    type="text"
                    name="doorNumber"
                    value={formData.doorNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">N° place parking</label>
                  <input
                    type="text"
                    name="parkingNumber"
                    value={formData.parkingNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
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
                <h3 className="mb-3 text-sm font-bold text-slate-900">Contact d'Urgence</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nom complet</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder="Ex: Conjoint, Parent..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer le propriétaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
