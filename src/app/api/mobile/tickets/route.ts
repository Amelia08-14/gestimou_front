import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const tickets = await prisma.maintenanceTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: 'Moyenne',
        status: 'Signalé',
        location: data.location || 'Parties Communes',
        requester: data.requester,
        residenceId: 'prestige', // Hardcoded for demo
      } as any
    });
    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
