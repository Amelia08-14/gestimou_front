'use client';

import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FinancialClient() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'tracking'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [properties, setProperties] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/financial`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setTransactions(data);
        })
        .catch(err => console.error("Failed to load transactions", err));

    fetch(`${API_URL}/properties`)
        .then(res => res.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) setProperties(data.data);
        })
        .catch(err => console.error("Failed to load properties", err));
  }, []);

  const handleGenerateCharges = async () => {
    setIsGenerating(true);
    try {
        const res = await fetch(`${API_URL}/financial/generate-charges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month: selectedMonth, year: selectedYear, amount: 15000 })
        });
        
        if (res.ok) {
            // Reload transactions
            const txRes = await fetch(`${API_URL}/financial`);
            const txData = await txRes.json();
            if (Array.isArray(txData)) setTransactions(txData);
            alert('Charges générées avec succès !');
        } else {
            alert('Erreur lors de la génération des charges.');
        }
    } catch (err) {
        console.error(err);
        alert('Erreur technique.');
    } finally {
        setIsGenerating(false);
    }
  };

  const annualBalance = transactions.reduce((acc, curr) => {
    // Backend uses 'Charge' for income (credit) and 'Dépense' for expense (debit)
    // Or we can map based on 'type' field
    const isCredit = curr.type === 'Charge'; 
    return isCredit ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Payé' ? 'Impayé' : 'Payé';
    try {
        const res = await fetch(`${API_URL}/financial/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
            if (selectedTransaction && selectedTransaction.id === id) {
                setSelectedTransaction({ ...selectedTransaction, status: newStatus });
            }
        }
    } catch (err) {
        console.error("Failed to update status", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion Financière</h1>
          <p className="text-sm text-slate-500">Suivi de la trésorerie et des paiements.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filtres
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Solde Annuel (2024)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">{annualBalance.toLocaleString()} DA</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
            <ArrowUpRight className="h-4 w-4" />
            <span>+12% vs 2023</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Revenus (Annuel)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
                {transactions.filter(t => t.type === 'Charge').reduce((a, b) => a + Number(b.amount), 0).toLocaleString()} DA
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
            <Wallet className="h-4 w-4" />
            <span>Charges encaissées</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Dépenses (Annuel)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
                {transactions.filter(t => t.type !== 'Charge').reduce((a, b) => a + Number(b.amount), 0).toLocaleString()} DA
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
            <ArrowDownRight className="h-4 w-4" />
            <span>Factures & Maintenance</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'history' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
            Historique des transactions
        </button>
        <button 
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'tracking' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
            Suivi des paiements
        </button>
      </div>

      {activeTab === 'tracking' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center">
                    <h3 className="font-bold text-slate-900">État des paiements</h3>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(2024, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
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
                    {isGenerating ? 'Génération...' : 'Générer les charges du mois'}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">Propriétaire</th>
                            <th className="px-6 py-4 font-medium">Bien</th>
                            <th className="px-6 py-4 font-medium">Montant Charge</th>
                            <th className="px-6 py-4 font-medium">Statut</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {properties.map(p => {
                            // Find charge for this property for selected month/year
                            const charge = transactions.find(t => 
                                t.propertyId === p.id && 
                                t.type === 'Charge' &&
                                new Date(t.date).getMonth() + 1 === selectedMonth &&
                                new Date(t.date).getFullYear() === selectedYear
                            );

                            return (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : <span className="text-slate-400 italic">Non assigné</span>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {p.title} (Lot {p.lotNumber})
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        {charge ? `${Number(charge.amount).toLocaleString()} DA` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {charge ? (
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                charge.status === 'Payé' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10' :
                                                'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                                            }`}>
                                                {charge.status}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Non généré</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {charge && (
                                            <button 
                                                onClick={() => handleStatusChange(charge.id, charge.status)}
                                                className="text-brand-blue hover:underline text-xs font-medium"
                                            >
                                                {charge.status === 'Payé' ? 'Marquer Impayé' : 'Marquer Payé'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Transactions Table (History) */}
      {activeTab === 'history' && (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedTransaction(t)}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${t.type === 'Charge' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {t.type === 'Charge' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        {t.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{t.Residence?.name || 'Résidence Prestige'}</span>
                        {t.property && <span className="text-xs text-slate-500">{t.property.title} (Lot {t.property.lotNumber})</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {t.property?.owner ? (
                        <span className="text-sm">{t.property.owner.firstName} {t.property.owner.lastName}</span>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(t.id, t.status);
                        }}
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                      t.status === 'Payé' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10' :
                      'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                    }`}>
                      {t.status}
                    </button>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${t.type === 'Charge' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {t.type === 'Charge' ? '+' : '-'}{Number(t.amount).toLocaleString()} DA
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

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">Détails de la transaction</h2>
              <button onClick={() => setSelectedTransaction(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Montant</span>
                    <span className={`text-2xl font-bold ${selectedTransaction.type === 'Charge' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {selectedTransaction.type === 'Charge' ? '+' : '-'}{Number(selectedTransaction.amount).toLocaleString()} DA
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Type</span>
                        <p className="font-medium text-slate-900 flex items-center gap-2 mt-1">
                            {selectedTransaction.type === 'Charge' ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                            {selectedTransaction.type}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Statut</span>
                        <div className="mt-1">
                            <button 
                                onClick={() => handleStatusChange(selectedTransaction.id, selectedTransaction.status)}
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium cursor-pointer ${
                                selectedTransaction.status === 'Payé' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10' :
                                'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                            }`}>
                                {selectedTransaction.status}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                        <p className="text-slate-900 mt-1">{selectedTransaction.description}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Date</span>
                        <p className="text-slate-900 mt-1">{new Date(selectedTransaction.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Résidence / Bien</span>
                        <p className="text-slate-900 mt-1">{selectedTransaction.Residence?.name || 'N/A'}</p>
                        {selectedTransaction.property && (
                            <p className="text-sm text-slate-500">{selectedTransaction.property.title} (Lot {selectedTransaction.property.lotNumber})</p>
                        )}
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Propriétaire</span>
                        <p className="text-slate-900 mt-1">
                            {selectedTransaction.property?.owner 
                                ? `${selectedTransaction.property.owner.firstName} ${selectedTransaction.property.owner.lastName}`
                                : 'Non spécifié'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Télécharger facture</button>
                    <button onClick={() => setSelectedTransaction(null)} className="px-4 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-lg">Fermer</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
