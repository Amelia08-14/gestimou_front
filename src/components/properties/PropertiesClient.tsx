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
import { API_URL } from '@/utils/api';

interface Residence {
  id: string;
  name: string;
  address: string;
  image?: string | null;
  totalUnits: number;
  deliveredUnits: number;
  occupancyRate?: string | null;
  managerName?: string | null;
  zone?: string | null;
  blocks?: string | null;
  hasBasement?: boolean;
  elevatorCount?: number;
  waterTankCount?: number;
  generatorCount?: number;
  hasSmokeExtraction?: boolean;
  hasElectricCurtains?: boolean;
  receptionCount?: number;
  hasGuardPost?: boolean;
  hasVideoSurveillance?: boolean;
  hasOutdoorLighting?: boolean;
  logo?: string | null;
  hasPlayground?: boolean;
  description?: string | null;
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  email?: string;
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

interface ResidenceFormData {
  id: string;
  name: string;
  address: string;
  image: string;
  logo: string;
  totalUnits: number;
  deliveredUnits: number;
  occupancyRate: string;
  managerName: string;
  zone: string;
  blocks: string;
  hasBasement: boolean;
  elevatorCount: number;
  waterTankCount: number;
  generatorCount: number;
  hasSmokeExtraction: boolean;
  hasElectricCurtains: boolean;
  receptionCount: number;
  hasGuardPost: boolean;
  hasVideoSurveillance: boolean;
  hasOutdoorLighting: boolean;
  hasPlayground: boolean;
  description: string;
}

const createResidenceForm = (residence?: Residence): ResidenceFormData => ({
  id: residence?.id || '',
  name: residence?.name || '',
  address: residence?.address || '',
  image: residence?.image || '',
  logo: residence?.logo || '',
  totalUnits: residence?.totalUnits || 0,
  deliveredUnits: residence?.deliveredUnits || 0,
  occupancyRate: residence?.occupancyRate || '',
  managerName: residence?.managerName || '',
  zone: residence?.zone || '',
  blocks: residence?.blocks || '',
  hasBasement: Boolean(residence?.hasBasement),
  elevatorCount: residence?.elevatorCount || 0,
  waterTankCount: residence?.waterTankCount || 0,
  generatorCount: residence?.generatorCount || 0,
  hasSmokeExtraction: Boolean(residence?.hasSmokeExtraction),
  hasElectricCurtains: Boolean(residence?.hasElectricCurtains),
  receptionCount: residence?.receptionCount || 0,
  hasGuardPost: Boolean(residence?.hasGuardPost),
  hasVideoSurveillance: Boolean(residence?.hasVideoSurveillance),
  hasOutdoorLighting: Boolean(residence?.hasOutdoorLighting),
  hasPlayground: Boolean(residence?.hasPlayground),
  description: residence?.description || ''
});

const zoneDefinitions: Record<string, string[]> = {
  'Zone 1': ['JAIS', 'LES CRÊTES', 'RUBIS', 'OPALE', 'EL BOUROUDJ', 'BERYL', 'PYRITE', 'RÉSIDENCE PRESTIGE', 'RESIDENCE PRESTIGE', 'PRESTIGE'],
  'Zone 2': ['COQUELICOT', 'PLUMERIA', 'CORAIL', 'PERIDOT', 'MORDJANE'],
  'Zone 3': ['SELENITE', 'SPINELLE', 'TURQUOISE', 'ÉMERAUDE', 'PERLA', 'CITRINE', 'ANGÉLITE']
};

const normalizeResidenceName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const zoneEntries = Object.entries(zoneDefinitions).flatMap(([zone, names]) =>
  names.map((name) => [normalizeResidenceName(name), zone] as const)
);

const zoneMap = Object.fromEntries(zoneEntries) as Record<string, string>;

const inferZoneFromResidenceName = (name: string) => zoneMap[normalizeResidenceName(name)] || '';

const PROMOTER_NAME = 'Aymen Promotion Immobilière';

const apartmentNumberFromLotNumber = (lotNumber?: string | null) => {
  const raw = String(lotNumber || '').trim();
  if (!raw) return '';
  const parts = raw.split('-').filter(Boolean);
  return (parts[parts.length - 1] || raw).trim();
};

const typologyFromSurface = (surface: unknown) => {
  const s = Number(surface);
  if (!Number.isFinite(s)) return 'F2';
  if (s >= 100) return 'F4';
  if (s >= 70) return 'F3';
  return 'F2';
};

const getPropertyDisplayTitle = (property: any) => {
  const number = apartmentNumberFromLotNumber(property?.lotNumber);
  if (number) return `Appartement n° ${number}`;
  return property?.title || 'Appartement';
};

const isPromoterOwner = (owner?: Owner | null) => {
  if (!owner) return false;
  const fullName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim();
  return /promotion/i.test(fullName);
};

export default function PropertiesClient({ residences: initialResidences, properties: initialProperties }: PropertiesClientProps) {
  const [view, setView] = useState<'residences' | 'properties'>('residences');
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showResidenceModal, setShowResidenceModal] = useState(false);
  const [isEditingResidence, setIsEditingResidence] = useState(false);
  const [isSavingResidence, setIsSavingResidence] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [residenceFormData, setResidenceFormData] = useState<ResidenceFormData>(createResidenceForm());

  const [properties, setProperties] = useState<any[]>(initialProperties || []);
  const [residences, setResidences] = useState<Residence[]>(initialResidences || []);
  const [activeZone, setActiveZone] = useState<'Zone 1' | 'Zone 2' | 'Zone 3'>('Zone 1');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    type: 'Appartement',
    surface: '',
    block: '',
    floor: '',
    lotNumber: '',
    address: '',
    price: '',
    status: 'Libre',
    ownerId: '',
  });

  const resetPropertyForm = () => {
    setPropertyForm({
      title: '',
      type: 'Appartement',
      surface: '',
      block: '',
      floor: '',
      lotNumber: '',
      address: '',
      price: '',
      status: 'Libre',
      ownerId: '',
    });
  };

  const fetchData = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const [resRes, propRes] = await Promise.all([
        fetch(`${API_URL}/residences`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/properties`, {
          headers: { Authorization: `Bearer ${token}` }
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
      console.error('Failed to fetch data', error);
    }
  };

  const fetchOwners = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/owners?onlyResidents=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setOwners(list);
    } catch (e) {
      console.error('Failed to fetch owners', e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOwners();
  }, []);

  useEffect(() => {
    if (residences.length === 0) return;
    const zonesMap = residences.reduce<Record<string, Residence[]>>((accumulator, residence) => {
      const zone = residence.zone || inferZoneFromResidenceName(residence.name) || 'Non définie';
      if (!accumulator[zone]) accumulator[zone] = [];
      accumulator[zone].push(residence);
      return accumulator;
    }, {});
    const order: Array<'Zone 1' | 'Zone 2' | 'Zone 3'> = ['Zone 1', 'Zone 2', 'Zone 3'];
    const currentList = zonesMap[activeZone] || [];
    if (currentList.length === 0) {
      const next = order.find((z) => (zonesMap[z]?.length || 0) > 0) || 'Zone 1';
      setActiveZone(next);
    }
  }, [residences]);

  useEffect(() => {
    if (initialProperties && initialProperties.length > 0) {
      setProperties(initialProperties);
    }
    if (initialResidences && initialResidences.length > 0) {
      setResidences(initialResidences);
    }
  }, [initialProperties, initialResidences]);
  
  const handleResidenceClick = (residence: Residence) => {
    setSelectedResidence(residence);
    setView('properties');
  };

  const handleBackToResidences = () => {
    setSelectedResidence(null);
    setView('residences');
  };

  const handleOpenAddProperty = () => {
    resetPropertyForm();
    setShowAddModal(true);
  };

  const handlePropertyInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setPropertyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProperty = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = sessionStorage.getItem('token');
    if (!token) return;
    if (!selectedResidence?.id) return;
    setIsSavingProperty(true);
    try {
      const surface = Number(String(propertyForm.surface).replace(',', '.'));
      if (!Number.isFinite(surface) || surface <= 0) {
        throw new Error('Surface invalide.');
      }
      const priceRaw = String(propertyForm.price || '').trim();
      const price = priceRaw ? Number(priceRaw.replace(',', '.')) : null;
      const ownerId = propertyForm.ownerId ? Number(propertyForm.ownerId) : null;

      const payload = {
        title: propertyForm.title.trim(),
        type: propertyForm.type,
        surface,
        residenceId: selectedResidence.id,
        status: propertyForm.status,
        block: propertyForm.block.trim() || null,
        floor: propertyForm.floor.trim() || null,
        lotNumber: propertyForm.lotNumber.trim() || null,
        address: propertyForm.address.trim() || null,
        price: priceRaw ? price : null,
        ownerId: ownerId && Number.isFinite(ownerId) ? ownerId : null,
      };

      const response = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.error || 'Erreur lors de la création du bien');
      }

      const created = json?.data || json;
      setProperties((prev) => [created, ...prev]);
      setShowAddModal(false);
      resetPropertyForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Impossible de créer le bien.');
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleOpenCreateResidence = () => {
    setResidenceFormData(createResidenceForm());
    setIsEditingResidence(false);
    setShowResidenceModal(true);
  };

  const handleEditResidence = (event: React.MouseEvent<HTMLButtonElement>, residence: Residence) => {
    event.stopPropagation();
    setResidenceFormData(createResidenceForm(residence));
    setIsEditingResidence(true);
    setShowResidenceModal(true);
  };

  const handleResidenceInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setResidenceFormData(prev => ({ ...prev, [name]: target.checked }));
      return;
    }

    if (target instanceof HTMLInputElement && target.type === 'number') {
      setResidenceFormData(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
      return;
    }

    if (name === 'name') {
      const inferredZone = inferZoneFromResidenceName(value);
      setResidenceFormData(prev => ({
        ...prev,
        name: value,
        zone: inferredZone || prev.zone
      }));
      return;
    }

    setResidenceFormData(prev => ({ ...prev, [name]: value }));
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
      reader.readAsDataURL(file);
    });

  const uploadResidenceMedia = async (type: 'logo' | 'image', file: File) => {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error('Non authentifié');

    if (!residenceFormData.id) throw new Error('Veuillez enregistrer la résidence avant le téléversement');

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.type)) throw new Error('Format non supporté (JPG, PNG, WEBP)');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image trop grande (max 5MB)');

    const dataUrl = await readFileAsDataUrl(file);
    const response = await fetch(`${API_URL}/residences/${residenceFormData.id}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ type, dataUrl })
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error || 'Téléversement impossible');

    const url = String(json?.url || '');
    if (!url) throw new Error('Téléversement impossible');

    setResidenceFormData(prev => ({ ...prev, [type]: url }));
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      await uploadResidenceMedia('logo', file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Téléversement impossible');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleUploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsUploadingCover(true);
    try {
      await uploadResidenceMedia('image', file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Téléversement impossible');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleResidenceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingResidence(true);

    const token = sessionStorage.getItem('token');
    const payload = {
      ...residenceFormData,
      image: residenceFormData.image || null,
      logo: residenceFormData.logo || null,
      occupancyRate: residenceFormData.occupancyRate || null,
      managerName: residenceFormData.managerName || null,
      zone: residenceFormData.zone || null,
      blocks: residenceFormData.blocks || null,
      description: residenceFormData.description || null
    };

    try {
      const url = isEditingResidence
        ? `${API_URL}/residences/${residenceFormData.id}`
        : `${API_URL}/residences`;
      const method = isEditingResidence ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Erreur lors de la sauvegarde de la résidence');
      }

      const savedResidence = await response.json();
      setResidences(prev => {
        if (isEditingResidence) {
          return prev.map((residence) => (
            residence.id === savedResidence.id ? savedResidence : residence
          ));
        }

        return [savedResidence, ...prev.filter((residence) => residence.id !== savedResidence.id)];
      });
      await fetchData();
      setShowResidenceModal(false);
      setResidenceFormData(createResidenceForm());
      setIsEditingResidence(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Impossible de sauvegarder la résidence.');
    } finally {
      setIsSavingResidence(false);
    }
  };

  const displayedProperties = selectedResidence 
    ? properties
        .filter(p => p.residenceId === selectedResidence.id)
        .filter(p => p.status !== 'Location')
    : [];

  const getResidenceHighlights = (residence: Residence) => {
    const items = [
      residence.hasBasement ? 'Sous-sol' : null,
      (residence.elevatorCount || 0) > 0 ? `${residence.elevatorCount} asc.` : null,
      (residence.waterTankCount || 0) > 0 ? `${residence.waterTankCount} bâches` : null,
      (residence.generatorCount || 0) > 0 ? `${residence.generatorCount} groupes` : null,
      residence.hasGuardPost ? 'Poste garde' : null,
      residence.hasVideoSurveillance ? 'Télésurv.' : null,
      residence.hasPlayground ? 'Aire jeux' : null
    ].filter(Boolean);

    return items.slice(0, 4);
  };

  const toggleFields: Array<{ name: keyof ResidenceFormData; label: string }> = [
    { name: 'hasBasement', label: 'Sous-sol' },
    { name: 'hasSmokeExtraction', label: 'Désenfumage' },
    { name: 'hasElectricCurtains', label: 'Rideaux électriques' },
    { name: 'hasGuardPost', label: 'Poste de garde' },
    { name: 'hasVideoSurveillance', label: 'Télésurveillance' },
    { name: 'hasOutdoorLighting', label: 'Éclairage extérieur' },
    { name: 'hasPlayground', label: 'Aire de jeux' }
  ];

  const zonesMap = residences.reduce<Record<string, Residence[]>>((accumulator, residence) => {
    const zone = residence.zone || inferZoneFromResidenceName(residence.name) || 'Non définie';
    if (!accumulator[zone]) accumulator[zone] = [];
    accumulator[zone].push(residence);
    return accumulator;
  }, {});

  const zoneOrder: Array<'Zone 1' | 'Zone 2' | 'Zone 3'> = ['Zone 1', 'Zone 2', 'Zone 3'];
  const zoneLabel: Record<string, string> = { 'Zone 1': 'Zone 01', 'Zone 2': 'Zone 02', 'Zone 3': 'Zone 03' };
  const availableZones = zoneOrder.filter((z) => (zonesMap[z]?.length || 0) > 0);
  const zoneResidences = zonesMap[activeZone] || [];

  return (
    <div className="space-y-6">
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
        
        {view === 'residences' && (
          <button 
            onClick={handleOpenCreateResidence}
            className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nouvelle résidence
          </button>
        )}

        {view === 'properties' && (
          <button 
            onClick={handleOpenAddProperty}
            className="flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-brand-blue hover:bg-brand-gold-hover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un bien
          </button>
        )}
      </div>

      {view === 'residences' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-2">
              {zoneOrder.map((zone) => {
                const isAvailable = (zonesMap[zone]?.length || 0) > 0;
                const isActive = activeZone === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => isAvailable && setActiveZone(zone)}
                    disabled={!isAvailable}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-blue text-white'
                        : isAvailable
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-300'
                    }`}
                  >
                    {zoneLabel[zone] || zone}
                  </button>
                );
              })}
            </div>
            <div className="text-sm text-slate-500 shrink-0">
              {zoneResidences.length} résidence(s)
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {zoneResidences.map((residence) => {
              const residenceProperties = properties
                .filter((p) => p?.residenceId === residence.id)
                .filter((p) => p?.status !== 'Location');
              const totalUnits = residence.totalUnits || residenceProperties.length || 0;
              const soldUnits = residenceProperties.filter((p) => p?.status === 'Vendu').length;
              const occupancyRate = totalUnits > 0 ? `${Math.round((soldUnits / totalUnits) * 100)}%` : '0%';

              return (
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
                  <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-blue shadow-sm">
                      {residence.zone || inferZoneFromResidenceName(residence.name) || 'Non définie'}
                    </span>
                    <button
                      onClick={(event) => handleEditResidence(event, residence)}
                      className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-blue shadow-sm hover:bg-white"
                    >
                      Modifier
                    </button>
                  </div>
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

                  <div className="flex flex-wrap gap-2">
                    {getResidenceHighlights(residence).length > 0 ? (
                      getResidenceHighlights(residence).map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        Équipements à compléter
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Logements</span>
                      <span className="text-lg font-bold text-brand-blue flex items-center gap-2">
                        <Building className="h-4 w-4 text-brand-gold" />
                        {soldUnits} / {totalUnits}
                      </span>
                      <span className="text-[10px] text-slate-400">Vendus / Total</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Occupation</span>
                      <span className="text-lg font-bold text-brand-blue flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand-gold" />
                        {residence.occupancyRate || occupancyRate}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Blocs</span>
                      <span className="font-medium text-slate-700">{residence.blocks || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Accueils</span>
                      <span className="font-medium text-slate-700">{residence.receptionCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Promoteur</span>
                      <span className="font-medium text-slate-700">{PROMOTER_NAME}</span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'properties' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {displayedProperties.length > 0 ? (
            displayedProperties.map((property) => (
              <div key={property.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:ring-brand-gold/30">
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img 
                    src={property.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=60'} 
                    alt={getPropertyDisplayTitle(property)}
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
                      <h3 className="font-semibold text-brand-blue group-hover:text-brand-gold-dark transition-colors">{getPropertyDisplayTitle(property)}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {property.owner
                          ? `${property.owner.firstName} ${property.owner.lastName}`
                          : property.status === 'Libre'
                            ? PROMOTER_NAME
                            : 'Aucun propriétaire'}
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
                      <span>N° appartement {apartmentNumberFromLotNumber(property.lotNumber) || '-'}</span>
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
                        <span>Typologie {property.type || typologyFromSurface(property.surface)}</span>
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

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-brand-blue">{getPropertyDisplayTitle(selectedProperty)}</h2>
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
                  alt={getPropertyDisplayTitle(selectedProperty)}
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
                        <span>Typologie {selectedProperty.type || typologyFromSurface(selectedProperty.surface)}</span>
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
                    {selectedProperty.owner || selectedProperty.status === 'Libre' ? (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                            {selectedProperty.owner?.avatar || 'AP'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {selectedProperty.owner
                                  ? isPromoterOwner(selectedProperty.owner)
                                    ? `${selectedProperty.owner.firstName} ${selectedProperty.owner.lastName} (Promoteur)`
                                    : `${selectedProperty.owner.firstName} ${selectedProperty.owner.lastName}`
                                  : PROMOTER_NAME}
                            </p>
                            <p className="text-xs text-slate-500">
                                {selectedProperty.owner
                                  ? isPromoterOwner(selectedProperty.owner)
                                    ? 'Non vendu'
                                    : `Depuis ${new Date(selectedProperty.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
                                  : 'Non vendu'}
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
             <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-brand-blue">Ajouter un bien</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetPropertyForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProperty} className="p-6 space-y-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Résidence : <span className="font-semibold text-slate-900">{selectedResidence?.name || '-'}</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Titre</label>
                  <input
                    required
                    name="title"
                    value={propertyForm.title}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select
                    name="type"
                    value={propertyForm.type}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Appartement">Appartement</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Local">Local</option>
                    <option value="Parking">Parking</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Surface (m²)</label>
                  <input
                    required
                    name="surface"
                    value={propertyForm.surface}
                    onChange={handlePropertyInputChange}
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <select
                    name="status"
                    value={propertyForm.status}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Libre">Libre</option>
                    <option value="Occupé">Occupé</option>
                    <option value="Vendu">Vendu</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Prix / Charges (DA)</label>
                  <input
                    name="price"
                    value={propertyForm.price}
                    onChange={handlePropertyInputChange}
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Bloc</label>
                  <input
                    name="block"
                    value={propertyForm.block}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Étage</label>
                  <input
                    name="floor"
                    value={propertyForm.floor}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Lot</label>
                  <input
                    name="lotNumber"
                    value={propertyForm.lotNumber}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Adresse (optionnel)</label>
                  <input
                    name="address"
                    value={propertyForm.address}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Propriétaire (optionnel)</label>
                  <select
                    name="ownerId"
                    value={propertyForm.ownerId}
                    onChange={handlePropertyInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Non assigné</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.firstName} {o.lastName}{o.email ? ` • ${o.email}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetPropertyForm();
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingProperty}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {isSavingProperty ? 'Enregistrement...' : 'Créer le bien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-brand-blue">
                {isEditingResidence ? 'Modifier la résidence' : 'Nouvelle résidence'}
              </h2>
              <button
                onClick={() => setShowResidenceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResidenceSubmit} className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Identifiant</label>
                  <input
                    required
                    type="text"
                    name="id"
                    value={residenceFormData.id}
                    onChange={handleResidenceInputChange}
                    disabled={isEditingResidence}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nom</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={residenceFormData.name}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Zone</label>
                  <input
                    type="text"
                    name="zone"
                    value={residenceFormData.zone}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400">Zone affectée automatiquement selon le nom de la résidence.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Responsable</label>
                  <input
                    type="text"
                    name="managerName"
                    value={residenceFormData.managerName}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Adresse</label>
                  <input
                    required
                    type="text"
                    name="address"
                    value={residenceFormData.address}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Logo</label>
                  <div className="flex items-center gap-3">
                    <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${isUploadingLogo ? 'opacity-50' : ''}`}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleUploadLogo}
                        disabled={isUploadingLogo || !residenceFormData.id || !isEditingResidence}
                        className="hidden"
                      />
                      {isUploadingLogo ? 'Téléversement...' : 'Télécharger'}
                    </label>
                    <input
                      type="text"
                      name="logo"
                      value={residenceFormData.logo}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:outline-none"
                    />
                  </div>
                  {!isEditingResidence && (
                    <p className="text-xs text-slate-400">Créez la résidence puis ouvrez “Modifier” pour téléverser le logo.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Image</label>
                  <div className="flex items-center gap-3">
                    <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${isUploadingCover ? 'opacity-50' : ''}`}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleUploadCover}
                        disabled={isUploadingCover || !residenceFormData.id || !isEditingResidence}
                        className="hidden"
                      />
                      {isUploadingCover ? 'Téléversement...' : 'Télécharger'}
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={residenceFormData.image}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:outline-none"
                    />
                  </div>
                  {!isEditingResidence && (
                    <p className="text-xs text-slate-400">Créez la résidence puis ouvrez “Modifier” pour téléverser l’image.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nombre total de lots</label>
                  <input
                    required
                    type="number"
                    name="totalUnits"
                    value={residenceFormData.totalUnits}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Logements livrés</label>
                  <input
                    type="number"
                    name="deliveredUnits"
                    value={residenceFormData.deliveredUnits}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Taux d’occupation</label>
                  <input
                    type="text"
                    name="occupancyRate"
                    value={residenceFormData.occupancyRate}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Blocs</label>
                  <input
                    type="text"
                    name="blocks"
                    value={residenceFormData.blocks}
                    onChange={handleResidenceInputChange}
                    placeholder="Ex: A, B, C"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Ascenseurs</label>
                  <input
                    type="number"
                    name="elevatorCount"
                    value={residenceFormData.elevatorCount}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Bâches à eau</label>
                  <input
                    type="number"
                    name="waterTankCount"
                    value={residenceFormData.waterTankCount}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Groupes électrogènes</label>
                  <input
                    type="number"
                    name="generatorCount"
                    value={residenceFormData.generatorCount}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Accueils</label>
                  <input
                    type="number"
                    name="receptionCount"
                    value={residenceFormData.receptionCount}
                    onChange={handleResidenceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {toggleFields.map((field) => (
                  <label key={field.name} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={Boolean(residenceFormData[field.name])}
                      onChange={handleResidenceInputChange}
                      className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  name="description"
                  value={residenceFormData.description}
                  onChange={handleResidenceInputChange}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResidenceModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingResidence}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {isSavingResidence ? 'Enregistrement...' : isEditingResidence ? 'Enregistrer' : 'Créer la résidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
