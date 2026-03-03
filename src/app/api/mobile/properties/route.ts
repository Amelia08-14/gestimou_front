import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    // Find owner by email to get their property
    const owner = await prisma.owner.findUnique({
      where: { email },
      include: {
        properties: {
          include: {
            reserves: true
          }
        }
      }
    });

    if (!owner) {
        // Maybe it's a user but not an owner (e.g. admin)
        return NextResponse.json({ error: 'Propriétaire non trouvé' }, { status: 404 });
    }

    return NextResponse.json(owner.properties);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
