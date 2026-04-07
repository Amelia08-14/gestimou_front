import MaintenanceClient from '@/components/maintenance/MaintenanceClient';
import { API_URL } from '@/utils/api';

async function getTickets() {
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
