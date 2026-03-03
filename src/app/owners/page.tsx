import { prisma } from '@/lib/prisma';
import OwnersClient from '@/components/owners/OwnersClient';

export default async function OwnersPage() {
  const owners = await prisma.owner.findMany({
    include: {
      _count: {
        select: { properties: true }
      }
    }
  });

  // Serialize and map
  const serializedOwners = owners.map((o: any) => ({
    ...o,
    totalChargesPaid: o.totalChargesPaid.toString(),
    propertiesCount: o._count.properties,
  }));

  return <OwnersClient owners={serializedOwners} />;
}
