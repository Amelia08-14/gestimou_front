import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate
    if (!data.title || !data.requester) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const newTicket = await prisma.maintenanceTicket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        category: data.category,
        location: 'Parties Communes', // Enforce location
        requester: data.requester,
        assignee: data.assignee,
      } as any
    });

    return NextResponse.json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
