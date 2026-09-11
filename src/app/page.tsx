import DashboardClient from '@/components/dashboard/DashboardClient';

// No server-side data fetch here on purpose: this app has no way to attach
// the browser's auth token to a server-side request, so it always came back
// empty/unauthenticated anyway — and doing it added a slow, blocking
// server-to-server call on every navigation. DashboardClient fetches its
// own data client-side (with the real token) right after mount.
export default function Home() {
  return (
    <DashboardClient
      stats={{ totalResidences: 0, occupancyRate: '0%', ticketsCount: 0, monthlyRevenue: '0 DA' }}
      revenueData={[]}
      activities={[]}
      weeklyActivity={[]}
    />
  );
}
