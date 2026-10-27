'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, Building2, Check, Download, SlidersHorizontal, Users, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_URL } from '@/utils/api';
import { useRole } from '@/contexts/RoleContext';
import { Card, PageHeader, SectionTitle, StatTile, primaryButton, squareButton } from '@/components/ui';

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

  const { user } = useRole();

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
    { key: 'totalResidences', name: 'Résidences', value: stats.totalResidences.toString(), icon: Building2, accent: '#5794ea' },
    { key: 'occupancyRate', name: "Taux d'occupation", value: stats.occupancyRate, icon: Users, accent: '#2ecc71' },
    { key: 'monthlyRevenue', name: 'Revenus du mois', value: stats.monthlyRevenue, icon: Wallet, accent: '#db9200' },
    { key: 'ticketsCount', name: 'Tickets en cours', value: stats.ticketsCount.toString(), icon: AlertTriangle, accent: '#e74c3c' },
  ].filter((item) => visibleWidgets.has(item.key));

  const firstName = (user?.name || '').trim().split(/\s+/)[0] || '';
  const seriesColors = ['#db9200', '#5794ea', '#2ecc71', '#7b6fde', '#e74c3c', '#a08851', '#8b81cb'];
  const axisTick = { fill: '#999999', fontSize: 12, fontFamily: 'var(--font-montserrat)' };
  const tooltipStyle = {
    backgroundColor: '#fbfaf7',
    borderRadius: 12,
    border: '1px solid #e7e4de',
    boxShadow: '0 12px 32px -12px rgb(12 22 32 / 0.18)',
    fontSize: 13,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        large
        title={firstName ? `Bonjour ${firstName}` : 'Bonjour'}
        subtitle="Voici un aperçu de votre activité."
        actions={
          <>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value === 'year' ? 'year' : 'month')}
              className="h-10 rounded-full border border-gi-card-border bg-gi-card px-4 text-[13px] font-medium text-gi-body outline-none focus:border-brand-amber"
            >
              <option value="month">Ce mois-ci</option>
              <option value="year">Cette année</option>
            </select>
            <div className="relative" ref={customizeRef}>
              <button onClick={() => setShowCustomize((v) => !v)} title="Personnaliser" className={squareButton}>
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              {showCustomize && (
                <div className="gi-appear absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-gi-card-border bg-gi-raised p-2 shadow-xl">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gi-faint">Widgets affichés</p>
                  {ALL_WIDGET_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleWidget(key)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] text-gi-body hover:bg-black/[0.04]"
                    >
                      {WIDGET_LABELS[key]}
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          visibleWidgets.has(key) ? 'border-brand-amber bg-brand-amber text-black' : 'border-slate-300'
                        }`}
                      >
                        {visibleWidgets.has(key) && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleDownloadReport} className={primaryButton}>
              <Download className="h-4 w-4" />
              Rapport
            </button>
          </>
        }
      />

      {/* KPI tiles — AdminStatTile */}
      {statsDisplay.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statsDisplay.map((item) => (
            <StatTile
              key={item.key}
              accent={item.accent}
              icon={<item.icon className="h-[18px] w-[18px]" />}
              label={item.name}
              value={loading && item.value === '0' ? '—' : item.value}
            />
          ))}
        </div>
      )}

      {(visibleWidgets.has('revenueChart') || visibleWidgets.has('activityChart')) && (
        <div className="grid gap-6 lg:grid-cols-5">
          {visibleWidgets.has('revenueChart') && (
            <section className={visibleWidgets.has('activityChart') ? 'space-y-3 lg:col-span-3' : 'space-y-3 lg:col-span-5'}>
              <SectionTitle title="Revenus par résidence" action={<span className="text-xs text-gi-faint">Millions DZD</span>} />
              <Card className="h-[320px] !p-4 !pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid vertical={false} stroke="#e2e0d9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#cccccc', strokeWidth: 1 }} />
                    {revenueData.length > 0 &&
                      Object.keys(revenueData[0])
                        .filter((key) => key !== 'name')
                        .map((key, index) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={key}
                            stroke={seriesColors[index % seriesColors.length]}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                          />
                        ))}
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </section>
          )}

          {visibleWidgets.has('activityChart') && (
            <section className={visibleWidgets.has('revenueChart') ? 'space-y-3 lg:col-span-2' : 'space-y-3 lg:col-span-5'}>
              <SectionTitle
                title="Volume — 7 jours"
                action={
                  <span className="flex items-center gap-3 text-xs text-gi-muted">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-amber" />Paiements</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-navy" />Tickets</span>
                  </span>
                }
              />
              <Card className="h-[320px] !p-4 !pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity} barGap={4}>
                    <CartesianGrid vertical={false} stroke="#e2e0d9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(0 0 0 / 0.04)' }} />
                    <Bar dataKey="payments" name="Paiements" fill="#db9200" radius={[6, 6, 6, 6]} barSize={14} />
                    <Bar dataKey="tickets" name="Tickets" fill="#0c1620" radius={[6, 6, 6, 6]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </section>
          )}
        </div>
      )}

      {visibleWidgets.has('recentActivity') && (
        <section className="space-y-3">
          <SectionTitle title="Dernières activités" count={activities.length} />
          {activities.length === 0 ? (
            <Card className="py-10 text-center text-[13px] text-gi-faint">Aucune activité récente.</Card>
          ) : (
            <div className="max-h-[480px] space-y-2 overflow-y-auto">
              {activities.map((item, i) => {
                const accent =
                  item.type === 'success' ? '#2ecc71' : item.type === 'warning' ? '#e74c3c' : item.type === 'info' ? '#5794ea' : '#999999';
                const Icon = item.type === 'success' ? Wallet : item.type === 'warning' ? AlertTriangle : Activity;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-gi-card-border bg-gi-card px-4 py-3">
                    <span
                      className="flex h-[35px] w-[35px] flex-shrink-0 items-center justify-center rounded-lg border"
                      style={{ backgroundColor: `${accent}0d`, borderColor: `${accent}1a`, color: accent }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gi-body">{item.action}</p>
                      <p className="mt-0.5 truncate text-[11px] text-gi-faint">
                        {item.user} · {item.time}
                      </p>
                    </div>
                    {item.amount && (
                      <span className="flex-shrink-0 text-sm font-semibold" style={{ color: item.type === 'info' || !item.type ? '#4c4c4c' : accent }}>
                        {item.amount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
