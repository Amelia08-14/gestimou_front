import PropertiesClient from '@/components/properties/PropertiesClient';

async function getData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const [residencesRes, propertiesRes] = await Promise.all([
      fetch(`${API_URL}/residences`, { cache: 'no-store' }),
      fetch(`${API_URL}/properties`, { cache: 'no-store' })
    ]);

    const residences = residencesRes.ok ? await residencesRes.json() : [];
    const properties = propertiesRes.ok ? await propertiesRes.json() : [];

    return { residences, properties };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { residences: [], properties: [] };
  }
}

export default async function PropertiesPage() {
  const { residences, properties } = await getData();
  return <PropertiesClient residences={residences} properties={properties} />;
}
