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

  useEffect(() => {
    fetch(`${API_URL}/financial`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setTransactions(data);
        })
        .catch(err => console.error("Failed to load transactions", err));
  }, []);

  const annualBalance = transactions.reduce((acc, curr) => {
    // Backend uses 'Charge' for income (credit) and 'Dépense' for expense (debit)
    // Or we can map based on 'type' field
    const isCredit = curr.type === 'Charge'; 
    return isCredit ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

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

      {/* Transactions Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Historique des transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Résidence</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${t.type === 'Charge' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {t.type === 'Charge' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        {t.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{t.residenceId || 'Résidence Prestige'}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      t.status === 'Payé' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10' :
                      'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10'
                    }`}>
                      {t.status}
                    </span>
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
    </div>
  );
}
