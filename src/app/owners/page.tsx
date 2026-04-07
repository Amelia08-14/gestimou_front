import OwnersClient from '@/components/owners/OwnersClient';
import { API_URL } from '@/utils/api';

async function getOwners() {
  try {
    const res = await fetch(`${API_URL}/owners?onlyResidents=true`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch owners:', error);
    return [];
  }
}

export default async function OwnersPage() {
  const owners = await getOwners();
  return <OwnersClient owners={owners} />;
}
