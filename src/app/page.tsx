import DashboardClient from '@/components/dashboard/DashboardClient';

async function getDashboardData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${API_URL}/dashboard`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    // Return empty/default structure if fetch fails
    return {
        stats: { totalResidences: 0, occupancyRate: '0%', ticketsCount: 0, monthlyRevenue: '0 DA' },
        revenueData: [],
        activities: [],
        weeklyActivity: []
    };
  }
}

export default async function Home() {
  const data = await getDashboardData();

  return <DashboardClient 
    stats={data.stats} 
    revenueData={data.revenueData} 
    activities={data.activities}
    weeklyActivity={data.weeklyActivity}
  />;
}
