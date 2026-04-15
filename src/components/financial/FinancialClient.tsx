'use client';

import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/utils/api';

interface OwnerSummary {
  firstName: string;
  lastName: string;
}

interface PropertySummary {
  id: number;
  title: string;
  lotNumber?: string | null;
  block?: string | null;
  floor?: string | null;
  status?: string;
  owner?: OwnerSummary | null;
}

interface ResidenceSummary {
  id?: string;
  name: string;
  zone?: string | null;
}

interface DocumentSummary {
  id: number;
  name: string;
  category: string;
  type: string;
  size: string;
  url?: string | null;
  createdAt: string;
}

interface Transaction {
  id: number;
  type: string;
  description: string;
  amount: string;
  status: string;
  date: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  propertyId?: number | null;
  expenseCategory?: string | null;
  documentId?: number | null;
  Residence?: ResidenceSummary | null;
  property?: PropertySummary | null;
  document?: DocumentSummary | null;
}

interface PropertyWithOwner extends PropertySummary {
  residenceId: string;
  price?: string | null;
}

interface FinanceFilters {
  zone: string;
  residenceId: string;
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  owner: string;
  description: string;
}

const initialFilters: FinanceFilters = {
  zone: '',
  residenceId: '',
  type: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  owner: '',
  description: ''
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const extractTaggedCategory = (description: string) => {
  const match = String(description || '').match(/^\[CAT:([A-Z_]+)\]\s*/);
  return match?.[1] || '';
};

const stripTaggedCategory = (description: string) =>
  String(description || '').replace(/^\[CAT:[A-Z_]+\]\s*/, '');

const inferExpenseCategory = (description: string) => {
  const tagged = extractTaggedCategory(description);
  if (tagged) return tagged;
  const d = normalizeText(description || '');
  if (d.includes('eau') || d.includes('seaal')) return 'UTIL_WATER';
  if (d.includes('electric') || d.includes('électric') || d.includes('sonelgaz') || d.includes('sonelgas')) return 'UTIL_ELECTRICITY';
  if (d.includes('facture') || d.includes('prestataire') || d.includes('fournisseur')) return 'SUPPLIER_INVOICE';
  return 'MISC_PURCHASE';
};

const formatDateFr = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
};

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

export default function FinancialClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [residences, setResidences] = useState<ResidenceSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'tracking' | 'expenses'>('history');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FinanceFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<FinanceFilters>(initialFilters);
  const [expenseTab, setExpenseTab] = useState<'UTIL_ELECTRICITY' | 'UTIL_WATER' | 'SUPPLIER_INVOICE' | 'MISC_PURCHASE'>('UTIL_ELECTRICITY');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    residenceId: '',
    category: 'UTIL_ELECTRICITY',
    description: '',
    amount: '',
    status: 'Payé',
    fileName: '',
    dataUrl: ''
  });

  const loadData = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const [financialResponse, propertiesResponse, residencesResponse] = await Promise.all([
        fetch(`${API_URL}/financial`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/properties`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/residences`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (financialResponse.ok) {
        const data = await financialResponse.json();
        if (Array.isArray(data)) {
          setTransactions((prev) => {
            const map = new Map<number, Transaction>();
            data.forEach((t) => map.set(t.id, t));
            prev.forEach((t) => {
              if (!map.has(t.id)) map.set(t.id, t);
            });
            return Array.from(map.values());
          });
        }
      }

      if (propertiesResponse.ok) {
        const data = await propertiesResponse.json();
        if (data.success && Array.isArray(data.data)) {
          setProperties(data.data);
        }
      }

      if (residencesResponse.ok) {
        const data = await residencesResponse.json();
        if (Array.isArray(data)) {
          setResidences(data);
        }
      }
    } catch (error) {
      console.error('Failed to load finance data', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateCharges = async () => {
    setIsGenerating(true);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Non authentifié');
      const response = await fetch(`${API_URL}/financial/generate-charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ year: selectedYear })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }

      await loadData();
      alert('Charges générées avec succès.');
    } catch (error) {
      console.error(error);
      alert('Erreur technique.');
    } finally {
      setIsGenerating(false);
    }
  };

  const expenseLabel = (category: string) => {
    if (category === 'UTIL_ELECTRICITY') return 'Électricité';
    if (category === 'UTIL_WATER') return 'Eau';
    if (category === 'SUPPLIER_INVOICE') return 'Factures prestataires';
    if (category === 'MISC_PURCHASE') return 'Achat divers';
    return category;
  };

  const getExpenseCategory = (transaction: Transaction) =>
    transaction.expenseCategory || inferExpenseCategory(transaction.description);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
      reader.readAsDataURL(file);
    });

  const resetExpenseForm = () => {
    setExpenseForm({
      residenceId: '',
      category: expenseTab,
      description: '',
      amount: '',
      status: 'Payé',
      fileName: '',
      dataUrl: ''
    });
  };

  const handleOpenAddExpense = () => {
    resetExpenseForm();
    setShowAddExpenseModal(true);
  };

  const handleExpenseFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setExpenseForm((prev) => ({ ...prev, fileName: file.name, dataUrl }));
  };

  const handleCreateExpense = async (event: FormEvent) => {
    event.preventDefault();
    const token = sessionStorage.getItem('token');
    if (!token) return;
    setIsSavingExpense(true);
    try {
      const amount = Number(String(expenseForm.amount).replace(',', '.'));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Montant invalide.');
      }
      if (!expenseForm.residenceId) {
        throw new Error('Résidence requise.');
      }

      let documentId: number | null = null;

      if (expenseForm.dataUrl) {
        const docCategory = `Finance - ${expenseLabel(expenseForm.category)}`;
        const docName = expenseForm.fileName || `facture-${Date.now()}`;
        const docRes = await fetch(`${API_URL}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: docName,
            category: docCategory,
            residenceId: expenseForm.residenceId,
            dataUrl: expenseForm.dataUrl
          })
        });
        const docJson = await docRes.json().catch(() => ({}));
        if (!docRes.ok) throw new Error(docJson?.error || 'Téléversement impossible');
        documentId = Number(docJson?.id) || null;
      }

      const taggedDescription = `[CAT:${expenseForm.category}] ${expenseForm.description.trim() || `Dépense - ${expenseLabel(expenseForm.category)}`}`;
      const res = await fetch(`${API_URL}/financial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'Dépense',
          description: taggedDescription,
          amount,
          status: expenseForm.status,
          date: new Date().toISOString(),
          residenceId: expenseForm.residenceId,
          expenseCategory: expenseForm.category,
          documentId
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Création impossible');
      const selectedResidence = residences.find((r) => r.id === expenseForm.residenceId);
      const optimistic = {
        ...json,
        expenseCategory: expenseForm.category,
        description: taggedDescription,
        Residence: selectedResidence || null,
        document: documentId
          ? {
              id: documentId,
              name: expenseForm.fileName || 'Facture',
              category: `Finance - ${expenseLabel(expenseForm.category)}`,
              type: '',
              size: '',
              url: null,
              createdAt: new Date().toISOString()
            }
          : json?.document || null
      } as Transaction;
      setTransactions((prev) => [optimistic, ...prev]);
      await loadData();
      setShowAddExpenseModal(false);
      resetExpenseForm();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const transactionType = transactions.find((t) => t.id === id)?.type;
    const newStatus = transactionType === 'Charge'
      ? (currentStatus === 'Payé' ? 'Impayé' : 'Payé')
      : (currentStatus === 'Payé' ? 'En attente' : 'Payé');

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Non authentifié');
      const response = await fetch(`${API_URL}/financial/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setTransactions((prev) => prev.map((transaction) => (
        transaction.id === id ? { ...transaction, status: newStatus } : transaction
      )));

      if (selectedTransaction?.id === id) {
        setSelectedTransaction({ ...selectedTransaction, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const residenceById = useMemo(() => {
    const map = new Map<string, ResidenceSummary>();
    residences.forEach((residence) => {
      if (residence.id) {
        map.set(residence.id, residence);
      }
    });
    return map;
  }, [residences]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    residences.forEach((residence) => {
      if (residence.zone) set.add(residence.zone);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [residences]);

  const residenceOptions = useMemo(() => {
    const zone = showFilters ? draftFilters.zone : filters.zone;
    const filtered = zone
      ? residences.filter((residence) => residence.zone === zone)
      : residences;
    return filtered
      .filter((residence) => residence.id)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [draftFilters.zone, filters.zone, residences, showFilters]);

  const filteredTransactions = useMemo(() => {
    const ownerNeedle = normalizeText(filters.owner);
    const descNeedle = normalizeText(filters.description);
    const zone = filters.zone;
    const residenceId = filters.residenceId;
    const type = filters.type;
    const status = filters.status;
    const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
    const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : null;

    return transactions
      .filter((transaction) => {
      if (type && transaction.type !== type) return false;
      if (status && transaction.status !== status) return false;

      const transactionResidenceZone = transaction.Residence?.zone || '';
      const transactionResidenceId = transaction.Residence?.id || '';
      if (zone && transactionResidenceZone !== zone) return false;
      if (residenceId && transactionResidenceId !== residenceId) return false;

      const basisDate = transaction.periodStart || transaction.date;
      const date = new Date(basisDate);
      if (from && date < from) return false;
      if (to && date > to) return false;

      if (ownerNeedle) {
        const owner = transaction.property?.owner
          ? `${transaction.property.owner.firstName} ${transaction.property.owner.lastName}`
          : '';
        if (!normalizeText(owner).includes(ownerNeedle)) return false;
      }

      if (descNeedle && !normalizeText(stripTaggedCategory(transaction.description)).includes(descNeedle)) return false;

      return true;
    })
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filters, transactions]);

  const filteredProperties = useMemo(() => {
    if (!filters.zone && !filters.residenceId) return properties;

    return properties.filter((property) => {
      if (filters.residenceId && property.residenceId !== filters.residenceId) return false;
      if (filters.zone) {
        const residence = residenceById.get(property.residenceId);
        if (!residence || residence.zone !== filters.zone) return false;
      }
      return true;
    });
  }, [filters.residenceId, filters.zone, properties, residenceById]);

  const chargeTransactions = useMemo(
    () => filteredTransactions.filter((transaction) => transaction.type === 'Charge'),
    [filteredTransactions]
  );

  const paidChargesCount = chargeTransactions.filter((transaction) => transaction.status === 'Payé').length;
  const unpaidChargesCount = chargeTransactions.filter((transaction) => transaction.status !== 'Payé').length;
  const consistenciesCount = filteredProperties.length;
  const soldHousingCount = filteredProperties.filter((property) => property.status === 'Vendu').length;
  const paidChargesAmount = chargeTransactions
    .filter((transaction) => transaction.status === 'Payé')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalChargesAmount = chargeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalExpensesAmount = filteredTransactions
    .filter((transaction) => transaction.type !== 'Charge')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const paidExpensesAmount = filteredTransactions
    .filter((transaction) => transaction.type !== 'Charge' && transaction.status === 'Payé')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const unpaidExpensesAmount = filteredTransactions
    .filter((transaction) => transaction.type !== 'Charge' && transaction.status !== 'Payé')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalBalance = paidChargesAmount - paidExpensesAmount;

  const expenseTransactions = useMemo(
    () => filteredTransactions.filter((transaction) => transaction.type !== 'Charge'),
    [filteredTransactions]
  );

  const selectedExpenseTransactions = useMemo(() => {
    return expenseTransactions
      .filter((t) => getExpenseCategory(t) === expenseTab)
      .filter((t) => new Date(t.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenseTransactions, expenseTab, selectedYear]);

  const selectedPeriodCharges = filteredProperties.map((property) => {
    const charge = filteredTransactions.find((transaction) => (
      transaction.propertyId === property.id &&
      transaction.type === 'Charge' &&
      new Date(transaction.periodStart || transaction.date).getFullYear() === selectedYear &&
      new Date(transaction.periodEnd || transaction.date).getFullYear() === selectedYear
    ));

    return { property, charge };
  });

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

  const handleExportCurrentView = () => {
    if (activeTab === 'history') {
      const rows: Array<Array<unknown>> = [
        [
          'ID',
          'Type',
          'Description',
          'Montant',
          'Statut',
          'Date',
          'Date début paiement',
          'Date fin paiement',
          'Zone',
          'Résidence',
          'Bien',
          'Lot',
          'Bloc',
          'Étage',
          'Propriétaire'
        ],
        ...filteredTransactions.map((transaction) => ([
          transaction.id,
          transaction.type,
          stripTaggedCategory(transaction.description),
          transaction.amount,
          transaction.status,
          formatDateFr(transaction.date),
          formatDateFr(transaction.periodStart),
          formatDateFr(transaction.periodEnd),
          transaction.Residence?.zone || '',
          transaction.Residence?.name || '',
          transaction.property?.title || '',
          transaction.property?.lotNumber || '',
          transaction.property?.block || '',
          transaction.property?.floor || '',
          transaction.property?.owner
            ? `${transaction.property.owner.firstName} ${transaction.property.owner.lastName}`
            : ''
        ]))
      ];

      downloadCsv(`transactions_${new Date().toISOString().slice(0, 10)}.csv`, rows);
      return;
    }

    const rows: Array<Array<unknown>> = [
      [
        'Propriétaire',
        'Zone',
        'Résidence',
        'Bien',
        'Lot',
        'Bloc',
        'Date début paiement',
        'Date fin paiement',
        'Montant',
        'Statut'
      ],
      ...selectedPeriodCharges.map(({ property, charge }) => {
        const residence = residenceById.get(property.residenceId);
        return [
          property.owner ? `${property.owner.firstName} ${property.owner.lastName}` : 'Non assigné',
          charge?.Residence?.zone || residence?.zone || '',
          charge?.Residence?.name || residence?.name || '',
          property.title,
          property.lotNumber || '',
          property.block || '',
          formatDateFr(charge?.periodStart),
          formatDateFr(charge?.periodEnd),
          charge ? Number(charge.amount).toLocaleString('fr-FR') : property.price ? Number(property.price).toLocaleString('fr-FR') : '',
          charge?.status || 'Non généré'
        ];
      })
    ];

    downloadCsv(`suivi_paiements_${selectedYear}.csv`, rows);
  };

  const handleExportTransaction = (transaction: Transaction) => {
    const rows: Array<Array<unknown>> = [
      ['Champ', 'Valeur'],
      ['ID', transaction.id],
      ['Type', transaction.type],
      ['Description', stripTaggedCategory(transaction.description)],
      ['Montant', transaction.amount],
      ['Statut', transaction.status],
      ['Date', formatDateFr(transaction.date)],
      ['Date début paiement', formatDateFr(transaction.periodStart)],
      ['Date fin paiement', formatDateFr(transaction.periodEnd)],
      ['Zone', transaction.Residence?.zone || ''],
      ['Résidence', transaction.Residence?.name || ''],
      ['Bien', transaction.property?.title || ''],
      ['Lot', transaction.property?.lotNumber || ''],
      ['Bloc', transaction.property?.block || ''],
      ['Étage', transaction.property?.floor || ''],
      ['Propriétaire', transaction.property?.owner ? `${transaction.property.owner.firstName} ${transaction.property.owner.lastName}` : '']
    ];

    downloadCsv(`transaction_${transaction.id}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion Financière</h1>
          <p className="text-sm text-slate-500">Suivi des charges de gestion, des paiements et des indicateurs copropriété.</p>
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
            onClick={handleExportCurrentView}
            className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Nbr consistances</p>
          <div className="mt-2 text-3xl font-bold text-brand-blue">{consistenciesCount}</div>
          <p className="mt-3 text-sm text-slate-500">Lots enregistrés dans la plateforme</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Nbr logements vendus</p>
          <div className="mt-2 text-3xl font-bold text-slate-900">{soldHousingCount}</div>
          <p className="mt-3 text-sm text-slate-500">Biens marqués comme vendus</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Nbr charges payées</p>
          <div className="mt-2 text-3xl font-bold text-emerald-600">{paidChargesCount}</div>
          <p className="mt-3 text-sm text-slate-500">Charges de gestion réglées</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Nbr charges non payées</p>
          <div className="mt-2 text-3xl font-bold text-red-600">{unpaidChargesCount}</div>
          <p className="mt-3 text-sm text-slate-500">Charges en attente de règlement</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Solde global</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalBalance.toLocaleString()} DA
            </span>
          </div>
          <div className={`mt-4 flex w-fit items-center gap-2 rounded px-2 py-1 text-sm ${totalBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {totalBalance >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>Paiements reçus - dépenses effectuées</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Paiements reçus</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{paidChargesAmount.toLocaleString()} DA</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
            <Wallet className="h-4 w-4" />
            <span>Charges payées par les locataires</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Dépenses effectuées</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{paidExpensesAmount.toLocaleString()} DA</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
            <ArrowDownRight className="h-4 w-4" />
            <span>En attente: {unpaidExpensesAmount.toLocaleString()} DA</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Historique des transactions
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'tracking' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Suivi des paiements
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Dépenses
        </button>
      </div>

      {activeTab === 'tracking' && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-900">État des paiements (annuel)</h3>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            <button
              onClick={handleGenerateCharges}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isGenerating ? 'Génération...' : 'Générer les charges annuelles'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Propriétaire</th>
                  <th className="px-6 py-4 font-medium">Résidence / Bien</th>
                  <th className="px-6 py-4 font-medium">Date début</th>
                  <th className="px-6 py-4 font-medium">Date fin</th>
                  <th className="px-6 py-4 font-medium">Montant</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPeriodCharges.map(({ property, charge }) => (
                  <tr key={property.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {property.owner ? `${property.owner.firstName} ${property.owner.lastName}` : <span className="italic text-slate-400">Non assigné</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{charge?.Residence?.name || residenceById.get(property.residenceId)?.name || '-'}</span>
                        <span className="text-xs text-slate-500">
                          {property.title} • Lot {property.lotNumber || '-'} • Bloc {property.block || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {charge?.periodStart ? new Date(charge.periodStart).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {charge?.periodEnd ? new Date(charge.periodEnd).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {charge ? `${Number(charge.amount).toLocaleString()} DA` : property.price ? `${Number(property.price).toLocaleString()} DA` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {charge ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          charge.status === 'Payé'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                            : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                        }`}>
                          {charge.status}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Non généré</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {charge && (
                        <button
                          onClick={() => handleStatusChange(charge.id, charge.status)}
                          className="text-xs font-medium text-brand-blue hover:underline"
                        >
                          {charge.status === 'Payé' ? 'Marquer impayé' : 'Marquer payé'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(['UTIL_ELECTRICITY', 'UTIL_WATER', 'SUPPLIER_INVOICE', 'MISC_PURCHASE'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setExpenseTab(key);
                      setExpenseForm((prev) => ({ ...prev, category: key }));
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      expenseTab === key ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {expenseLabel(key)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
                <button
                  onClick={handleOpenAddExpense}
                  className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-brand-blue hover:bg-brand-gold-hover"
                >
                  Nouvelle dépense
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Catégorie</th>
                    <th className="px-6 py-4 font-medium">Résidence</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Statut</th>
                    <th className="px-6 py-4 font-medium text-right">Montant</th>
                    <th className="px-6 py-4 font-medium text-right">Facture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedExpenseTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Aucune dépense trouvée.
                      </td>
                    </tr>
                  ) : (
                    selectedExpenseTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-900">{expenseLabel(getExpenseCategory(t))}</td>
                        <td className="px-6 py-4 text-slate-600">{t.Residence?.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{stripTaggedCategory(t.description)}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDateFr(t.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            t.status === 'Payé'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                              : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">-{Number(t.amount).toLocaleString()} DA</td>
                        <td className="px-6 py-4 text-right">
                          {(t.document?.id || t.documentId) ? (
                            <a
                              href={`${API_URL}/documents/${t.document?.id || t.documentId}/download`}
                              className="text-xs font-medium text-brand-blue hover:underline"
                            >
                              Télécharger
                            </a>
                          ) : (
                            <span className="text-xs italic text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold text-slate-900">Historique des transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Résidence / Bien</th>
                  <th className="px-6 py-4 font-medium">Propriétaire</th>
                  <th className="px-6 py-4 font-medium">Période</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right">Montant</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50/50"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${transaction.type === 'Charge' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {transaction.type === 'Charge' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        {stripTaggedCategory(transaction.description)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{transaction.Residence?.name || '—'}</span>
                        {transaction.property && (
                          <span className="text-xs text-slate-500">
                            {transaction.property.title} (Lot {transaction.property.lotNumber || '-'})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {transaction.property?.owner
                        ? `${transaction.property.owner.firstName} ${transaction.property.owner.lastName}`
                        : <span className="text-xs italic text-slate-400">Non assigné</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {transaction.periodStart && transaction.periodEnd
                        ? `${new Date(transaction.periodStart).toLocaleDateString('fr-FR')} - ${new Date(transaction.periodEnd).toLocaleDateString('fr-FR')}`
                        : new Date(transaction.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStatusChange(transaction.id, transaction.status);
                        }}
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${
                          transaction.status === 'Payé'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                            : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                        }`}
                      >
                        {transaction.status}
                      </button>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${transaction.type === 'Charge' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {transaction.type === 'Charge' ? '+' : '-'}{Number(transaction.amount).toLocaleString()} DA
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">Détails de la transaction</h2>
              <button onClick={() => setSelectedTransaction(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Montant</span>
                <span className={`text-2xl font-bold ${selectedTransaction.type === 'Charge' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {selectedTransaction.type === 'Charge' ? '+' : '-'}{Number(selectedTransaction.amount).toLocaleString()} DA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Type</span>
                  <p className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                    {selectedTransaction.type === 'Charge'
                      ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                    {selectedTransaction.type}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Statut</span>
                  <div className="mt-1">
                    <button
                      onClick={() => handleStatusChange(selectedTransaction.id, selectedTransaction.status)}
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        selectedTransaction.status === 'Payé'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                          : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                      }`}
                    >
                      {selectedTransaction.status}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Description</span>
                  <p className="mt-1 text-slate-900">{stripTaggedCategory(selectedTransaction.description)}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Date</span>
                  <p className="mt-1 text-slate-900">
                    {new Date(selectedTransaction.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Date début paiement</span>
                  <p className="mt-1 text-slate-900">
                    {selectedTransaction.periodStart ? new Date(selectedTransaction.periodStart).toLocaleDateString('fr-FR') : 'Non renseignée'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Date fin paiement</span>
                  <p className="mt-1 text-slate-900">
                    {selectedTransaction.periodEnd ? new Date(selectedTransaction.periodEnd).toLocaleDateString('fr-FR') : 'Non renseignée'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Résidence / Bien</span>
                  <p className="mt-1 text-slate-900">{selectedTransaction.Residence?.name || 'N/A'}</p>
                  {selectedTransaction.property && (
                    <p className="text-sm text-slate-500">
                      {selectedTransaction.property.title} (Lot {selectedTransaction.property.lotNumber || '-'})
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Propriétaire</span>
                  <p className="mt-1 text-slate-900">
                    {selectedTransaction.property?.owner
                      ? `${selectedTransaction.property.owner.firstName} ${selectedTransaction.property.owner.lastName}`
                      : 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Facture</span>
                  <p className="mt-1 text-slate-900">
                    {(selectedTransaction.document?.id || selectedTransaction.documentId) ? (
                      <a
                        href={`${API_URL}/documents/${selectedTransaction.document?.id || selectedTransaction.documentId}/download`}
                        className="text-sm font-medium text-brand-blue hover:underline"
                      >
                        Télécharger
                      </a>
                    ) : (
                      'Non renseignée'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => handleExportTransaction(selectedTransaction)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Exporter CSV
                </button>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue/90"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">Nouvelle dépense</h2>
              <button
                onClick={() => {
                  setShowAddExpenseModal(false);
                  resetExpenseForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Catégorie</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="UTIL_ELECTRICITY">Électricité</option>
                    <option value="UTIL_WATER">Eau</option>
                    <option value="SUPPLIER_INVOICE">Factures prestataires</option>
                    <option value="MISC_PURCHASE">Achat divers</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Résidence</label>
                  <select
                    value={expenseForm.residenceId}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, residenceId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Sélectionner une résidence</option>
                    {residenceOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <input
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Ex: Facture SONELGAZ T1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Montant (DA)</label>
                  <input
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <select
                    value={expenseForm.status}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Payé">Payé</option>
                    <option value="En attente">En attente</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Facture / Bon (PDF ou image)</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleExpenseFileChange}
                      />
                      Choisir un fichier
                    </label>
                    <span className="text-sm text-slate-500">
                      {expenseForm.fileName ? expenseForm.fileName : 'Aucun fichier'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpenseModal(false);
                    resetExpenseForm();
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingExpense}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {isSavingExpense ? 'Enregistrement...' : 'Créer'}
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
              <button
                onClick={() => setShowFilters(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Zone</label>
                  <select
                    value={draftFilters.zone}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, zone: event.target.value, residenceId: '' }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="">Toutes</option>
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Résidence</label>
                  <select
                    value={draftFilters.residenceId}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, residenceId: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="">Toutes</option>
                    {residenceOptions.map((residence) => (
                      <option key={residence.id} value={residence.id}>{residence.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={draftFilters.type}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, type: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="">Tous</option>
                    <option value="Charge">Charge</option>
                    <option value="Dépense">Dépense</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <select
                    value={draftFilters.status}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="">Tous</option>
                    <option value="Payé">Payé</option>
                    <option value="Impayé">Impayé</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date du</label>
                  <input
                    type="date"
                    value={draftFilters.dateFrom}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Au</label>
                  <input
                    type="date"
                    value={draftFilters.dateTo}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Propriétaire</label>
                  <input
                    type="text"
                    value={draftFilters.owner}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, owner: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="Nom ou prénom"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <input
                    type="text"
                    value={draftFilters.description}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, description: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="Contient…"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={handleResetFilters}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-brand-blue/90"
                >
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
