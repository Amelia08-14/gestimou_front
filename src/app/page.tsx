import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function Home() {
  // 1. Stats
  const totalResidences = await prisma.residence.count();
  const totalTickets = await prisma.maintenanceTicket.count({ where: { status: { not: 'Terminé' } } });
  
  // Calculate occupancy
  const residences = await prisma.residence.findMany({
    select: { id: true, name: true, totalUnits: true, deliveredUnits: true }
  });
  
  let totalDelivered = 0;
  let totalUnits = 0;
  residences.forEach((r: any) => {
    totalDelivered += r.deliveredUnits;
    totalUnits += r.totalUnits;
  });
  const occupancyRate = totalUnits > 0 ? Math.round((totalDelivered / totalUnits) * 100) + '%' : '0%';

  // Monthly Revenue (Current Month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  
  const monthlyRevenueAgg = await prisma.financialTransaction.aggregate({
    _sum: { amount: true },
    where: { 
      type: 'Charge', 
      date: { gte: startOfMonth } 
    }
  });
  const monthlyRevenue = (monthlyRevenueAgg._sum.amount ? Number(monthlyRevenueAgg._sum.amount).toLocaleString() : '0') + ' DA';

  // 2. Revenue Evolution (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  
  const transactions = await prisma.financialTransaction.findMany({
    where: { 
      type: 'Charge',
      date: { gte: sixMonthsAgo }
    },
    include: { residence: true },
    orderBy: { date: 'asc' }
  } as any);

  // Process into format: [{ name: 'Jan', ResidenceA: 1000, ResidenceB: 2000 }]
  const revenueMap = new Map<string, any>();
  
  transactions.forEach((t: any) => {
    const month = t.date.toLocaleString('default', { month: 'short' });
    if (!revenueMap.has(month)) {
      revenueMap.set(month, { name: month });
    }
    const entry = revenueMap.get(month);
    const resName = t.residence?.name || 'Inconnu';
    // Sum amount
    entry[resName] = (entry[resName] || 0) + Number(t.amount);
  });
  
  // Fill in missing months to ensure chart continuity? 
  // For now just values present.
  const revenueData = Array.from(revenueMap.values());

  // 3. Weekly Activity (Last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  
  const weekTickets = await prisma.maintenanceTicket.findMany({
    where: { createdAt: { gte: sevenDaysAgo } }
  });
  const weekPayments = await prisma.financialTransaction.findMany({
    where: { type: 'Charge', date: { gte: sevenDaysAgo } }
  });

  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const weeklyActivityMap = new Map<string, { name: string, tickets: number, payments: number }>();
  
  // Initialize last 7 days map
  const weeklyActivity: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    // Use date string as key to handle duplicate day names if spanning weeks?
    // But chart usually just shows 'Lun', 'Mar'.
    // We'll create objects directly.
    weeklyActivity.push({ date: d.toISOString().split('T')[0], name: dayName, tickets: 0, payments: 0 });
  }

  // Populate data
  weekTickets.forEach((t: any) => {
    const dateStr = t.createdAt.toISOString().split('T')[0];
    const day = weeklyActivity.find(d => d.date === dateStr);
    if (day) day.tickets++;
  });
  weekPayments.forEach((p: any) => {
    const dateStr = p.date.toISOString().split('T')[0];
    const day = weeklyActivity.find(d => d.date === dateStr);
    if (day) day.payments++;
  });

  // 4. Recent Activities (All types)
  const recentTickets = await prisma.maintenanceTicket.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { residence: true }
  });
  const recentTransactions = await prisma.financialTransaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { residence: true, property: { include: { owner: true } } }
  } as any);
  const recentOwners = await prisma.owner.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  const activities = [
    ...recentTickets.map((t: any) => ({
      type: 'warning',
      user: t.requester,
      action: `A signalé: ${t.title}`,
      time: new Date(t.createdAt).toLocaleDateString('fr-FR'),
      amount: t.status,
      date: t.createdAt
    })),
    ...recentTransactions.map((t: any) => ({
      type: t.type === 'Charge' ? 'success' : 'neutral',
      user: t.property?.owner?.lastName || 'Système',
      action: t.description,
      time: new Date(t.date).toLocaleDateString('fr-FR'),
      amount: Number(t.amount).toLocaleString() + ' DA',
      date: t.createdAt
    })),
    ...recentOwners.map((o: any) => ({
      type: 'info',
      user: o.createdBy || 'Admin',
      action: `A ajouté un propriétaire: ${o.lastName}`,
      time: new Date(o.createdAt).toLocaleDateString('fr-FR'),
      amount: 'Nouveau',
      date: o.createdAt
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 20); // Show more as requested "toutes les actions" (but 20 is reasonable for "Last Activities")

  const stats = {
    totalResidences,
    occupancyRate,
    ticketsCount: totalTickets,
    monthlyRevenue
  };

  return <DashboardClient 
    stats={stats} 
    revenueData={revenueData} 
    activities={activities}
    weeklyActivity={weeklyActivity}
  />;
}
