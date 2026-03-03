import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Validate status
    const allowedStatuses = ['Signalé', 'En cours', 'Terminé'];
    if (data.status && !allowedStatuses.includes(data.status)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.assignee !== undefined && { assignee: data.assignee || null }),
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}
