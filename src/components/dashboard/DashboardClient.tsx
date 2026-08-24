'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Users,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_URL } from '@/utils/api';

const WIDGET_LABELS: Record<string, string> = {
  totalResidences: 'Total résidences',
  occupancyRate: "Taux d'occupation",
  monthlyRevenue: 'Revenus mensuels',
  ticketsCount: 'Tickets en cours',
  revenueChart: 'Évolution des revenus',
  activityChart: 'Activité hebdomadaire',
  recentActivity: 'Dernières activités',
};
const ALL_WIDGET_KEYS = Object.keys(WIDGET_LABELS);

interface RevenuePoint {
  name: string;
  [residenceKey: string]: string | number;
}

interface ActivityItem {
  action: string;
  user: string;
  time: string;
  amount: string;
  type: 'success' | 'warning' | 'info' | string;
}

interface WeeklyActivityPoint {
  name: string;
  payments: number;
  tickets: number;
}

// Props interface
interface DashboardClientProps {
  stats: {
    totalResidences: number;
    occupancyRate: string;
    ticketsCount: number;
    monthlyRevenue: string;
  };
  revenueData: RevenuePoint[];
  activities: ActivityItem[];
  weeklyActivity: WeeklyActivityPoint[];
}

export default function DashboardClient({ 
    stats: initialStats, 
    revenueData: initialRevenueData, 
    activities: initialActivities, 
    weeklyActivity: initialWeeklyActivity 
}: DashboardClientProps) {

  // State
  const [stats, setStats] = useState(initialStats);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>(initialRevenueData);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityPoint[]>(initialWeeklyActivity);
  const [loading, setLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'month' | 'year'>('month');

  // ── Dashboard personalization (per-browser, persisted in localStorage) ──
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(new Set(ALL_WIDGET_KEYS));
  const [showCustomize, setShowCustomize] = useState(false);
  const customizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('dashboard_widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setVisibleWidgets(new Set(parsed));
      }
    } catch {
      // ignore malformed/missing preference
    }
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) setShowCustomize(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleWidget = (key: string) => {
    setVisibleWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        window.localStorage.setItem('dashboard_widgets', JSON.stringify(Array.from(next)));
      } catch {
        // localStorage unavailable — preference just won't persist
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRevenueData(data.revenueData);
          setActivities(data.activities);
          setWeeklyActivity(data.weeklyActivity);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const interval = window.setInterval(fetchData, 15000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, []);

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

  const handleDownloadReport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows: Array<Array<unknown>> = [
      ['Section', 'Champ', 'Valeur'],
      ['Stats', 'Total résidences', stats.totalResidences],
      ['Stats', 'Taux occupation', stats.occupancyRate],
      ['Stats', 'Revenus mensuels', stats.monthlyRevenue],
      ['Stats', 'Tickets en cours', stats.ticketsCount],
      [],
      ['Revenus', 'Période', reportPeriod === 'month' ? 'Ce mois-ci' : 'Cette année'],
      [],
      ['Revenus', 'Série', 'Valeur', 'Label'],
      ...revenueData.flatMap((row) => (
        Object.keys(row || {})
          .filter((key) => key !== 'name')
          .map((key) => (['Revenus', key, row[key], row.name]))
      )),
      [],
      ['Activité Hebdomadaire', 'Jour', 'Paiements', 'Tickets'],
      ...weeklyActivity.map((row) => (['Activité Hebdomadaire', row.name, row.payments, row.tickets])),
      [],
      ['Dernières activités', 'Action', 'Utilisateur', 'Temps', 'Montant'],
      ...activities.map((row) => (['Dernières activités', row.action, row.user, row.time, row.amount]))
    ];

    downloadCsv(`dashboard_report_${today}.csv`, rows);
  };

  const statsDisplay = [
    {
      key: 'totalResidences',
      name: 'Total Résidences',
      value: stats.totalResidences.toString(),
      change: '+0',
      changeType: 'neutral',
      icon: Building2,
      color: 'blue-500',
    },
    {
      key: 'occupancyRate',
      name: 'Taux d\'Occupation',
      value: stats.occupancyRate,
      change: '+2%',
      changeType: 'positive',
      icon: Users,
      color: 'emerald-500',
    },
    {
      key: 'monthlyRevenue',
      name: 'Revenus Mensuels',
      value: stats.monthlyRevenue,
      change: '+12%',
      changeType: 'positive',
      icon: Wallet,
      color: 'brand-gold',
    },
    {
      key: 'ticketsCount',
      name: 'Tickets En Cours',
      value: stats.ticketsCount.toString(),
      change: '-2',
      changeType: 'positive',
      icon: AlertTriangle,
      color: 'orange-500',
    },
  ].filter((item) => visibleWidgets.has(item.key));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Tableau de bord</h1>
          <p className="text-sm text-slate-500">Bienvenue sur Global Immo Service, voici un aperçu de votre activité.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value === 'year' ? 'year' : 'month')}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-amber"
          >
            <option value="month">Ce mois-ci</option>
            <option value="year">Cette année</option>
          </select>
          <div className="relative" ref={customizeRef}>
            <button
              onClick={() => setShowCustomize((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Personnaliser
            </button>
            {showCustomize && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Widgets affichés</p>
                {ALL_WIDGET_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleWidget(key)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {WIDGET_LABELS[key]}
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        visibleWidgets.has(key) ? 'border-brand-amber bg-brand-amber text-white' : 'border-slate-300'
                      }`}
                    >
                      {visibleWidgets.has(key) && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleDownloadReport}
            className="rounded-xl bg-brand-amber px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-95"
          >
            Télécharger le rapport
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {statsDisplay.length > 0 && (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">{item.name}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 truncate" title={item.value}>{item.value}</p>
              </div>
              <div className={`rounded-lg p-3 shrink-0 bg-${item.color}/10 text-${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`flex items-center text-sm font-medium ${
                item.changeType === 'positive' ? 'text-emerald-600' : 'text-slate-600'
              }`}>
                {item.changeType === 'positive' && <ArrowUpRight className="mr-1 h-4 w-4" />}
                {item.change}
              </span>
              <span className="text-sm text-slate-400">vs mois dernier</span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Charts Section */}
      {(visibleWidgets.has('revenueChart') || visibleWidgets.has('activityChart')) && (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart - Updated to show per residence */}
        {visibleWidgets.has('revenueChart') && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Évolution des Revenus par Résidence</h3>
              <p className="text-sm text-slate-500">En Millions de Dinars (DZD)</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="h-72 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                />
                {/* Dynamically render lines based on data keys, excluding 'name' */}
                {revenueData.length > 0 && Object.keys(revenueData[0])
                  .filter(key => key !== 'name')
                  .map((key, index) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      name={key} 
                      stroke={`hsl(${index * 60}, 70%, 50%)`} 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 5 }} 
                    />
                  ))
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Activity Chart */}
        {visibleWidgets.has('activityChart') && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Activité Hebdomadaire</h3>
              <p className="text-sm text-slate-500">Tickets vs Paiements</p>
            </div>
          </div>
          <div className="h-72 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="payments" name="Paiements" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="tickets" name="Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}
      </div>
      )}

      {/* Recent Activity Table - Updated to be scrollable and show all types */}
      {visibleWidgets.has('recentActivity') && (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Dernières Activités</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
             <div className="px-6 py-4 text-center text-slate-500">Aucune activité récente.</div>
          ) : (
            activities.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-2 w-2 rounded-full ${
                  item.type === 'success' ? 'bg-emerald-500' :
                  item.type === 'warning' ? 'bg-red-500' :
                  item.type === 'info' ? 'bg-blue-500' : 'bg-slate-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.action}</p>
                  <p className="text-xs text-slate-500">{item.user} • {item.time}</p>
                </div>
              </div>
              <span className={`text-sm font-medium ${
                item.type === 'success' ? 'text-emerald-600' :
                item.type === 'warning' ? 'text-red-600' :
                'text-slate-600'
              }`}>
                {item.amount}
              </span>
            </div>
          )))}
        </div>
      </div>
      )}
    </div>
  );
}
