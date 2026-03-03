import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // In a real app, verify password hash. Here we just simulate login.
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Simple role check
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: 'fake-jwt-token-123456', // Mobile app will store this
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
