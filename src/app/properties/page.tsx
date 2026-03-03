import { prisma } from '@/lib/prisma';
import PropertiesClient from '@/components/properties/PropertiesClient';

export default async function PropertiesPage() {
  const residences = await prisma.residence.findMany();
  const properties = await prisma.property.findMany({
    include: {
      owner: true,
      reserves: true,
    }
  } as any);

  // Convert Decimal to number/string if needed, but Prisma usually returns Decimal object which can be tricky in Client Components
  // We need to serialize the data. Recharts and simple display is fine with strings.
  // The 'price' in Property is Decimal.
  // We should map it.
  
  const serializedProperties = properties.map((p: any) => ({
    ...p,
    price: p.price ? p.price.toString() : null,
    surface: p.surface, // Float is fine
  }));

  return <PropertiesClient residences={residences} properties={serializedProperties as any} />;
}
