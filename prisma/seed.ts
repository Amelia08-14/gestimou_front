import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with realistic data...')

  // 1. Users (Roles)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aymen.com' },
    update: { role: 'ADMIN', name: 'Super Admin' },
    create: { email: 'admin@aymen.com', name: 'Super Admin', role: 'ADMIN' },
  })

  const intervenantElec = await prisma.user.upsert({
    where: { email: 'elec@aymen.com' },
    update: { role: 'INTERVENANT', name: 'Ahmed Electricien' },
    create: { email: 'elec@aymen.com', name: 'Ahmed Electricien', role: 'INTERVENANT' },
  })

  const intervenantPlomberie = await prisma.user.upsert({
    where: { email: 'plomberie@aymen.com' },
    update: { role: 'INTERVENANT', name: 'Samir Plombier' },
    create: { email: 'plomberie@aymen.com', name: 'Samir Plombier', role: 'INTERVENANT' },
  })

  // 2. Residences
  const prestige = await prisma.residence.upsert({
    where: { id: 'prestige' },
    update: { address: 'Alger, Algérie', managerName: 'M. Karim' },
    create: {
      id: 'prestige',
      name: 'Résidence Prestige',
      address: 'Alger, Algérie',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=500&q=60',
      totalUnits: 40,
      deliveredUnits: 32,
      occupancyRate: '80%',
      managerName: 'M. Karim',
      description: 'Résidence de haut standing avec vue sur la baie.',
    },
  })

  // 3. Owners & Properties
  // Clear existing data to avoid duplicates and constraint errors
  await prisma.financialTransaction.deleteMany({})
  await prisma.reserve.deleteMany({})
  await prisma.maintenanceTicket.deleteMany({})
  await prisma.property.deleteMany({})
  await prisma.owner.deleteMany({})
  // Also clear residents from User table if needed, but keep Admin/Intervenants
  await prisma.user.deleteMany({
    where: {
      role: 'RESIDENT'
    }
  })

  const ownersList = [
    { fn: 'Amine', ln: 'Mostefaoui', email: 'a.mostefaoui@aymenpromotion.com', phone: '213560709669', block: 'A', floor: '6', lot: '1' },
    { fn: 'Saber', ln: 'Tidjani', email: 's.tidjani@aymenpromotion.com', phone: '213560298174', block: 'B', floor: '0', lot: '2' },
    { fn: 'Amir', ln: 'Haddoud', email: 'a.haddoud@aymenpromotion.com', phone: '213558006613', block: 'C', floor: '1', lot: '3' },
    { fn: 'Abdelkrim', ln: 'Messaoudi', email: 'a.messaoudi@aymenpromotion.com', phone: '213550000000', block: 'C', floor: '2', lot: '4' },
    { fn: 'Ghilas', ln: 'Ben Abdelaziz', email: 'g.benabdelaziz@aymenpromotion.com', phone: '213550000001', block: 'A', floor: '3', lot: '5' },
  ];

  for (const o of ownersList) {
    const owner = await prisma.owner.create({
      data: {
        firstName: o.fn,
        lastName: o.ln,
        email: o.email,
        phone: o.phone,
        status: 'Actif',
        totalChargesPaid: Math.floor(Math.random() * 50000),
        createdBy: 'Admin',
        emergencyContactName: 'Contact Urgence ' + o.ln,
        emergencyContactPhone: '0550000000'
      },
    })

    // Create User account for this owner (Resident)
    await prisma.user.upsert({
        where: { email: o.email },
        update: {},
        create: {
            email: o.email,
            name: `${o.fn} ${o.ln}`,
            role: 'RESIDENT',
            password: 'password123'
        }
    });

    const prop = await prisma.property.create({
      data: {
        title: `Appartement F4 - Bloc ${o.block}`,
        type: 'Appartement F4',
        surface: 125, 
        floor: o.floor,
        block: o.block,
        lotNumber: o.lot,
        status: 'Occupé',
        residenceId: prestige.id,
        ownerId: owner.id,
        price: 15000, 
      }
    })

    // Random Reserves
    if (Math.random() > 0.5) {
        await (prisma as any).reserve.create({
            data: {
                propertyId: prop.id,
                description: Math.random() > 0.5 ? 'Fissure mur salon' : 'Prise électrique défectueuse chambre',
                severity: Math.random() > 0.5 ? 'Mineur' : 'Majeur',
                status: 'Non traité',
                photo: 'https://placehold.co/600x400/png'
            }
        })
    }
  }

  // 4. Maintenance Tickets (Parties Communes)
  const tickets = [
    { title: 'Ascenseur en panne', cat: 'Ascenseur en panne', desc: 'Bloc A à l\'arrêt', loc: 'Bloc A', prio: 'Urgent', status: 'En cours', user: 'Gardien' },
    { title: 'Lumière Hall', cat: 'Eclairage défectueux', desc: 'Ampoule grillée entrée', loc: 'Hall Bloc B', prio: 'Basse', status: 'Terminé', user: 'Saber Tidjani' },
    { title: 'Fuite d\'eau', cat: 'Autres', desc: 'Fuite niveau parking sous-sol', loc: 'Parking', prio: 'Haute', status: 'Signalé', user: 'Amine Mostefaoui' },
    { title: 'Porte Garage', cat: 'Rideau parking défaillant', desc: 'Ne se ferme pas', loc: 'Entrée Parking', prio: 'Urgent', status: 'En cours', user: 'Gardien' },
    { title: 'Déchets', cat: 'Déchets accumulés', desc: 'Poubelles non vidées', loc: 'Extérieur', prio: 'Moyenne', status: 'Signalé', user: 'Leila Bekhti' },
  ];

  for (const t of tickets) {
    await prisma.maintenanceTicket.create({
        data: {
            title: t.title,
            category: t.cat,
            description: t.desc,
            location: t.loc, // Specific common area
            priority: t.prio,
            status: t.status,
            requester: t.user,
            residenceId: prestige.id,
            assignee: t.cat.includes('Eclairage') ? 'Ahmed Electricien' : null
        } as any
    })
  }

  // 5. Financial Transactions
  // Use current year or last 6 months for dashboard
  const now = new Date();
  const currentYear = now.getFullYear();
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
  
  for (let i = 0; i < months.length; i++) {
      const monthDate = new Date(currentYear, i, 15);
      // Only add if date is not in future (or just add them anyway for demo)
      if (monthDate <= now || i < 3) {
        await prisma.financialTransaction.create({
            data: {
                type: 'Charge',
                description: `Charges Copropriété - ${months[i]}`,
                amount: 450000 + (Math.random() * 50000),
                status: 'Payé',
                date: monthDate,
                residenceId: prestige.id
            } as any
        })
      }
  }

  // Create an Unpaid Owner ("Mauvais Payeur") for demo
  const badPayer = await prisma.owner.create({
    data: {
        firstName: 'Redouane',
        lastName: 'Bensalem',
        email: 'r.bensalem@example.com',
        phone: '0550998877',
        status: 'Actif',
        totalChargesPaid: 10000, // Low amount
        createdBy: 'Admin',
        emergencyContactName: 'Frère',
        emergencyContactPhone: '0550112233'
    }
  });

  const badPayerProp = await prisma.property.create({
    data: {
        title: 'Appartement F3 - Bloc B',
        type: 'Appartement F3',
        surface: 90,
        floor: '2',
        block: 'B',
        lotNumber: '12',
        status: 'Occupé',
        residenceId: prestige.id,
        ownerId: badPayer.id,
        price: 12000
    }
  });

  // Create unpaid transactions for him
  await prisma.financialTransaction.create({
    data: {
        type: 'Charge',
        description: 'Charges Copropriété - Janvier (Impayé)',
        amount: 15000,
        status: 'Impayé',
        date: new Date(currentYear, 0, 15),
        residenceId: prestige.id,
        propertyId: badPayerProp.id
    } as any
  });

  await prisma.financialTransaction.create({
    data: {
        type: 'Charge',
        description: 'Charges Copropriété - Février (Impayé)',
        amount: 15000,
        status: 'Impayé',
        date: new Date(currentYear, 1, 15),
        residenceId: prestige.id,
        propertyId: badPayerProp.id
    } as any
  });

  // Add some recent tickets for "This week"
  const recentTicketDate = new Date();
  recentTicketDate.setDate(recentTicketDate.getDate() - 2);
  
  await prisma.maintenanceTicket.create({
    data: {
        title: 'Porte Hall bloquée',
        category: 'Serrurerie',
        description: 'La porte d\'entrée du Bloc A ne s\'ouvre plus avec le badge',
        location: 'Hall Bloc A',
        priority: 'Haute',
        status: 'En cours',
        requester: 'Amine Mostefaoui',
        residenceId: prestige.id,
        createdAt: recentTicketDate,
        assignee: 'Serrurier Express'
    } as any
  });

  console.log('Seed completed with realistic data!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
