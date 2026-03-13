const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash du mot de passe par défaut
  const defaultPassword = await bcrypt.hash('coach2024', 10)

  // Créer l'entraineur YMADOUI
  const ymadoui = await prisma.user.upsert({
    where: { username: 'YMADOUI' },
    update: { password: defaultPassword },
    create: {
      username: 'YMADOUI',
      email: 'ymadoui@footballtactics.com',
      password: defaultPassword,
      role: 'ENTRAINEUR',
      firstName: 'Yassine',
      lastName: 'MADOUI',
    },
  })
  console.log('✅ Entraineur créé:', ymadoui.username, '(mdp: coach2024)')

  // Liste des équipes à créer
  const teamsData = [
    { name: 'U7', category: 'U7' },
    { name: 'U8', category: 'U8' },
    { name: 'U9', category: 'U9' },
    { name: 'U10', category: 'U10' },
    { name: 'U11', category: 'U11' },
    { name: 'U12', category: 'U12' },
    { name: 'U13', category: 'U13' },
    { name: 'U14', category: 'U14' },
    { name: 'U15', category: 'U15' },
    { name: 'Senior 1', category: 'Senior' },
    { name: 'Senior 2', category: 'Senior' },
  ]

  // Créer les équipes
  for (const teamData of teamsData) {
    const team = await prisma.team.upsert({
      where: { name: teamData.name },
      update: {},
      create: teamData,
    })
    console.log('✅ Équipe créée:', team.name)

    // Ajouter YMADOUI comme entraineur de cette équipe
    await prisma.membership.upsert({
      where: {
        userId_teamId: {
          userId: ymadoui.id,
          teamId: team.id,
        },
      },
      update: {},
      create: {
        userId: ymadoui.id,
        teamId: team.id,
        role: 'ENTRAINEUR',
      },
    })
    console.log(`  └─ YMADOUI ajouté comme entraineur de ${team.name}`)
  }

  console.log('')
  console.log('🎉 Seed terminé!')
  console.log(`   - 1 entraineur: YMADOUI`)
  console.log(`   - ${teamsData.length} équipes: U7 → Senior 2`)
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
