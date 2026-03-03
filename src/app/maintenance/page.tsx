import MaintenanceClient from '@/components/maintenance/MaintenanceClient';

async function getTickets() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${API_URL}/maintenance`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return [];
  }
}

export default async function MaintenancePage() {
  const tickets = await getTickets();
  return <MaintenanceClient tickets={tickets} />;
}
