'use client';

import { 
  Building2, 
  Users, 
  Wallet, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Props interface
interface DashboardClientProps {
  stats: {
    totalResidences: number;
    occupancyRate: string;
    ticketsCount: number;
    monthlyRevenue: string;
  };
  revenueData: any[];
  activities: any[];
  weeklyActivity: any[];
}

export default function DashboardClient({ stats, revenueData, activities, weeklyActivity }: DashboardClientProps) {
  
  const statsDisplay = [
    {
      name: 'Total Résidences',
      value: stats.totalResidences.toString(),
      change: '+0',
      changeType: 'neutral',
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Taux d\'Occupation',
      value: stats.occupancyRate,
      change: '+2%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-emerald-500',
    },
    {
      name: 'Revenus Mensuels',
      value: stats.monthlyRevenue,
      change: '+12%',
      changeType: 'positive',
      icon: Wallet,
      color: 'bg-brand-gold',
    },
    {
      name: 'Tickets En Cours',
      value: stats.ticketsCount.toString(),
      change: '-2',
      changeType: 'positive', 
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
          <p className="text-sm text-slate-500">Bienvenue sur GESTIMOU, voici un aperçu de votre activité.</p>
        </div>
        <div className="flex gap-3">
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-brand-blue focus:outline-none">
            <option>Ce mois-ci</option>
            <option>Cette année</option>
          </select>
          <button className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 transition-colors">
            Télécharger le rapport
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{item.name}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${item.color} bg-opacity-10`}>
                <item.icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
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

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart - Updated to show per residence */}
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
          <div className="h-72 w-full">
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

        {/* Activity Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Activité Hebdomadaire</h3>
              <p className="text-sm text-slate-500">Tickets vs Paiements</p>
            </div>
          </div>
          <div className="h-72 w-full">
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
      </div>

      {/* Recent Activity Table - Updated to be scrollable and show all types */}
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
    </div>
  );
}
