import OwnersClient from '@/components/owners/OwnersClient';

async function getOwners() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${API_URL}/owners`, { cache: 'no-store' });
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
