import { prisma } from '@/lib/prisma';
import MaintenanceClient from '@/components/maintenance/MaintenanceClient';

export default async function MaintenancePage() {
  const tickets = await prisma.maintenanceTicket.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Serialize dates and ensure plain objects
  const serializedTickets = tickets.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <MaintenanceClient tickets={serializedTickets as any} />;
}
