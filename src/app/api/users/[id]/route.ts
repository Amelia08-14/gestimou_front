import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();

    if (isNaN(id)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Prepare update data
    // We use a raw query again if we added new columns like 'profession' that Prisma might not know about yet
    // But for standard fields (name, email, role, password), Prisma is fine.
    // 'profession' was the issue.
    
    // Let's try standard update first, if it fails due to 'profession', we fallback to raw.
    // Actually, 'profession' is in the DB now (added via migration/push), but the client types might be stale.
    // So standard update might fail if we pass 'profession' in the object but Typescript/Prisma Client doesn't know it.
    
    // We can use Unsafe Raw for the update to be safe and support all fields including password.
    
    const passwordUpdate = data.password ? `, password = '${data.password}'` : '';
    const professionUpdate = data.profession ? `, profession = '${data.profession}'` : `, profession = NULL`;
    
    await prisma.$executeRawUnsafe(
        `UPDATE User SET name = ?, email = ?, role = ?${passwordUpdate}${professionUpdate}, updatedAt = NOW() WHERE id = ?`,
        data.name, data.email, data.role, id
    );

    const updatedUser = await prisma.user.findUnique({ where: { id } });
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
