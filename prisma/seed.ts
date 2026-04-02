import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 🔌 Connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// 🔗 Adapter Prisma 7
const adapter = new PrismaPg(pool)

// 🚀 Client Prisma
const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('🌱 Début du seeding de la base de données...')

  // 1. Créer ou récupérer un événement
  let event = await prisma.votingEvent.findFirst({
    where: { isActive: true },
  })

  if (!event) {
    event = await prisma.votingEvent.create({
      data: {
        title: 'Élection Miss & Mister JMFC 2026',
        description: 'La grande finale pour élire les ambassadeurs de cette année !',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      },
    })
    console.log(`✅ Événement créé : ${event.title}`)
  } else {
    console.log(`💡 Événement actif existant trouvé : ${event.title}`)
  }

  // 2. Vérifier si des participants existent déjà
  const participantsCount = await prisma.participant.count({
    where: { eventId: event.id },
  })

  if (participantsCount === 0) {
    console.log('👯‍♀️ Création de participants de test...')

    const candidates = [
      { name: 'Amina', category: 'MISS' as const, number: 1, description: 'Passionnée par la tech africaine.' },
      { name: 'Koffi', category: 'MISTER' as const, number: 1, description: 'Futur leader dans la finance.' },
      { name: 'Sara', category: 'MISS' as const, number: 2, description: 'Engagement social et associatif.' },
      { name: 'Yann', category: 'MISTER' as const, number: 2, description: 'Sportif de haut niveau et motivé.' },
    ]

    for (const candidate of candidates) {
      const created = await prisma.participant.create({
        data: {
          eventId: event.id,
          name: candidate.name,
          category: candidate.category,
          number: candidate.number,
          description: candidate.description,
          imageUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${candidate.name}`,
          totalVotes: Math.floor(Math.random() * 50),
        },
      })

      console.log(`✅ Participant créé : ${created.name} (${created.category} n°${created.number})`)
    }
  } else {
    console.log(`💡 Des participants existent déjà (${participantsCount}), on passe la création.`)
  }

  console.log('🎉 Seeding terminé avec succès !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding: ', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end() // 👈 très important pour fermer la connexion
  })