import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Attempt to connect and query
    const residenceCount = await prisma.residence.count()
    return NextResponse.json({ 
      status: 'Database Connected', 
      residenceCount,
      message: 'La connexion à la base de données XAMPP est fonctionnelle.'
    })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ 
      status: 'Database Connection Failed', 
      error: String(error) 
    }, { status: 500 })
  }
}
