'use client';

import { 
  Building2, 
  MapPin, 
  Ruler, 
  BedDouble, 
  MoreVertical,
  Plus,
  ArrowLeft,
  Building,
  Users,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
// import { Residence, Property, Owner } from '@prisma/client';

// Define types manually
interface Residence {
  id: string;
  name: string;
  address: string;
  image?: string | null;
  totalUnits: number;
  deliveredUnits: number;
  occupancyRate?: string | null;
  description?: string | null;
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface Property {
  id: number;
  title: string;
  type: string;
  surface: number;
  floor?: string | null;
  block?: string | null;
  lotNumber?: string | null;
  address?: string | null;
  price?: string | null; // Mapped from Decimal
  status: string;
  image?: string | null;
  residenceId: string;
  ownerId?: number | null;
  createdAt: string | Date;
}

type PropertyWithDetails = Property & { owner?: Owner | null; reserves?: any[] };

interface PropertiesClientProps {
  residences: Residence[];
  properties: any[];
}

export default function PropertiesClient({ residences: initialResidences, properties: initialProperties }: PropertiesClientProps) {
  const [view, setView] = useState<'residences' | 'properties'>('residences');
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  // New API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // State for fetched data
  const [properties, setProperties] = useState<any[]>(initialProperties || []);
  const [residences, setResidences] = useState<Residence[]>(initialResidences || []);

  // Fetch data on mount (Client-side with Auth Token)
  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [resRes, propRes] = await Promise.all([
                fetch(`${API_URL}/residences`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/properties`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (resRes.ok) {
                const resData = await resRes.json();
                if (Array.isArray(resData)) setResidences(resData);
            }

            if (propRes.ok) {
                const propData = await propRes.json();
                if (propData.success && Array.isArray(propData.data)) {
                    setProperties(propData.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    fetchData();
  }, []);

  // Sync state with props if they change (fallback)
  useEffect(() => {
    if (initialProperties && initialProperties.length > 0) {
      setProperties(initialProperties);
    }
    if (initialResidences && initialResidences.length > 0) {
      setResidences(initialResidences);
    }
  }, [initialProperties, initialResidences]);

  // Load properties from API when a residence is selected (optional optimization)
  // For now, we rely on initialProperties passed from Server Component which still uses Prisma.
  // TODO: Update Server Component to fetch from API too, or fetch here client-side.
  
  const handleResidenceClick = (residence: Residence) => {
    setSelectedResidence(residence);
    setView('properties');
  };

  const handleBackToResidences = () => {
    setSelectedResidence(null);
    setView('residences');
  };

  const displayedProperties = selectedResidence 
    ? properties
        .filter(p => p.residenceId === selectedResidence.id)
        // Filter out rentals as requested "pas des appartements en location"
        .filter(p => p.status !== 'Location')
    : [];

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {view === 'properties' && (
            <button 
              onClick={handleBackToResidences}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-blue transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-brand-blue">
              {view === 'residences' ? 'Nos Résidences' : selectedResidence?.name}
            </h1>
            <p className="text-sm text-slate-500">
              {view === 'residences' 
                ? 'Gérez l\'ensemble de vos projets immobiliers.' 
                : `${selectedResidence?.address} • ${selectedResidence?.totalUnits} lots`}
            </p>
          </div>
        </div>
        
        {view === 'properties' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-brand-blue hover:bg-brand-gold-hover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un bien
          </button>
        )}
      </div>

      {/* Residences Grid View */}
      {view === 'residences' && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {residences.map((residence) => (
            <div 
              key={residence.id} 
              onClick={() => handleResidenceClick(residence)}
              className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl hover:ring-brand-gold/50 hover:-translate-y-1"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img 
                  src={residence.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=60'} 
                  alt={residence.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-4 left-4 z-20 text-white">
                  <h3 className="text-xl font-bold">{residence.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <MapPin className="h-3 w-3" />
                    {residence.address}
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 line-clamp-2">
                  {residence.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Logements</span>
                    <span className="text-lg font-bold text-brand-blue flex items-center gap-2">
                      <Building className="h-4 w-4 text-brand-gold" />
                      {residence.deliveredUnits} / {residence.totalUnits}
                    </span>
                    <span className="text-[10px] text-slate-400">Livrés / Total</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Occupation</span>
                    <span className="text-lg font-bold text-brand-blue flex items-center gap-2">
                      <Users className="h-4 w-4 text-brand-gold" />
                      {residence.occupancyRate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Properties Grid View (Filtered by Residence) */}
      {view === 'properties' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {displayedProperties.length > 0 ? (
            displayedProperties.map((property) => (
              <div key={property.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:ring-brand-gold/30">
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img 
                    src={property.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=60'} 
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${
                    property.status === 'Libre' ? 'bg-emerald-500/90 text-white' :
                    'bg-brand-gold/90 text-brand-blue'
                  }`}>
                    {property.status}
                  </span>
                </div>
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-brand-blue group-hover:text-brand-gold-dark transition-colors">{property.title}</h3>
                      <p className="mt-1 text-sm font-bold text-brand-gold-dark">
                         {property.price ? `${property.price} DA (Charges)` : 'N/A'}
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4 text-brand-gold" />
                      <span className="truncate">{property.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-1 rounded">
                      <span>Lot {property.lotNumber || '-'}</span>
                      <span className="text-slate-300">•</span>
                      <span>Bloc {property.block || '-'}</span>
                      <span className="text-slate-300">•</span>
                      <span>Etage {property.floor || '-'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="h-4 w-4 text-brand-gold" />
                        <span>{property.surface} m²</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="h-4 w-4 text-brand-gold" />
                        <span>{property.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <button 
                      onClick={() => setSelectedProperty(property)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-colors"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Building2 className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucun bien</h3>
              <p className="mt-1 text-sm text-slate-500">Commencez par ajouter un bien à cette résidence.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center rounded-md bg-brand-blue px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue/90"
                >
                  <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Ajouter un bien
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-brand-blue">{selectedProperty.title}</h2>
              <button 
                onClick={() => setSelectedProperty(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 mb-6">
                <img 
                  src={selectedProperty.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=60'} 
                  alt={selectedProperty.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-3 top-3">
                  <span className={`rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-md ${
                    selectedProperty.status === 'Libre' ? 'bg-emerald-500/90 text-white' :
                    'bg-brand-gold/90 text-brand-blue'
                  }`}>
                    {selectedProperty.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Localisation</h3>
                    <div className="flex items-start gap-2 text-slate-900">
                      <MapPin className="h-5 w-5 text-brand-gold mt-0.5 shrink-0" />
                      <span>{selectedProperty.address}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Caractéristiques</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Ruler className="h-5 w-5 text-brand-gold" />
                        <span>{selectedProperty.surface} m²</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-900">
                        <BedDouble className="h-5 w-5 text-brand-gold" />
                        <span>{selectedProperty.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Prix (Charges)</h3>
                    <p className="text-2xl font-bold text-brand-blue">{selectedProperty.price} DA</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Propriétaire Actuel</h3>
                    {selectedProperty.owner ? (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                            {selectedProperty.owner.avatar || 'XX'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {selectedProperty.owner.firstName === 'Aymen' && selectedProperty.owner.lastName === 'Promotion' 
                                    ? 'Aymen Promotion (Promoteur)'
                                    : `${selectedProperty.owner.firstName} ${selectedProperty.owner.lastName}`
                                }
                            </p>
                            <p className="text-xs text-slate-500">
                                {selectedProperty.owner.firstName === 'Aymen' && selectedProperty.owner.lastName === 'Promotion' 
                                    ? 'Non vendu'
                                    : `Depuis ${new Date(selectedProperty.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
                                }
                            </p>
                        </div>
                      </div>
                    ) : (
                        <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
                            Aucun propriétaire assigné
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Réserves / Snag List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Réserves (État des lieux)</h3>
                  <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    Via App Résident
                  </span>
                </div>
                
                {selectedProperty.reserves && selectedProperty.reserves.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedProperty.reserves.map((reserve: any) => (
                      <div key={reserve.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{reserve.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-red-600">{reserve.severity}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">{reserve.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Aucune réserve signalée.</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Fermer
                </button>
                <button className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-brand-blue/90 shadow-md">
                  Modifier le bien
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal - Static for now */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
             <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-brand-blue">Ajouter un bien</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 text-center text-slate-500">
                La fonctionnalité d'ajout sera disponible prochainement.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
