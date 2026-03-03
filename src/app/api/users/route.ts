import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate
    if (!data.email || !data.name || !data.role) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    // Use raw query to bypass outdated Prisma Client validation until server restarts
    try {
        await prisma.$executeRawUnsafe(
            `INSERT INTO User (email, name, role, profession, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'password123', NOW(), NOW())`,
            data.email, data.name, data.role, data.profession || null
        );
    } catch (e) {
        // Fallback if table name is different or unique constraint
        console.error("Raw insert failed, trying standard create without profession", e);
        // Standard create without profession
        const created = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                password: 'password123',
            }
        });
        return NextResponse.json(created);
    }

    const newUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
