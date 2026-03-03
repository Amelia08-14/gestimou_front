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

    const updatedOwner = await prisma.owner.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
      },
    });

    return NextResponse.json(updatedOwner);
  } catch (error) {
    console.error('Error updating owner:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
        }

        const owner = await prisma.owner.findUnique({
            where: { id },
            include: { properties: true }
        });

        if (!owner) {
            return NextResponse.json({ error: 'Propriétaire non trouvé' }, { status: 404 });
        }

        // Calculate Unpaid Balance (Simulated for demo based on transactions)
        // In real app, we'd query FinancialTransaction where status = 'Impayé' and property.ownerId = id
        // Since we don't have direct relation owner->transactions easily accessible without nested include:
        
        const unpaidTransactions = await prisma.financialTransaction.findMany({
            where: {
                property: {
                    ownerId: id
                },
                status: 'Impayé'
            }
        });
        
        const unpaidBalance = unpaidTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // Convert Decimal to string
        return NextResponse.json({
            ...owner,
            totalChargesPaid: owner.totalChargesPaid.toString(),
            unpaidBalance: unpaidBalance.toString(),
            properties: owner.properties.map(p => ({
                ...p,
                price: p.price ? p.price.toString() : null
            }))
        });
    } catch (error) {
        console.error('Error fetching owner:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
