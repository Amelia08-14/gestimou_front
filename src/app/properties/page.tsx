import PropertiesClient from '@/components/properties/PropertiesClient';
import { API_URL } from '@/utils/api';

async function getData() {
  try {
    const [residencesRes, propertiesRes] = await Promise.all([
      fetch(`${API_URL}/residences`, { cache: 'no-store' }),
      fetch(`${API_URL}/properties`, { cache: 'no-store' })
    ]);

    const residences = residencesRes.ok ? await residencesRes.json() : [];
    const propertiesData = propertiesRes.ok ? await propertiesRes.json() : {};
    const properties = propertiesData.success ? propertiesData.data : [];

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
