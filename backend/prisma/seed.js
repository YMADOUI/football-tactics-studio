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

  // Créer les sessions de démonstration
  const u8Team = await prisma.team.findUnique({ where: { name: 'U8' } })
  const u14Team = await prisma.team.findUnique({ where: { name: 'U14' } })

  if (u8Team && u14Team) {
    // Session 1 - Séance basique
    const session1Data = {"players":[{"id":1,"name":"Hugo","number":1,"position":"GK","team":"home","x":20,"y":15},{"id":2,"name":"Lucas","number":2,"position":"RB","team":"home","x":35,"y":15},{"id":3,"name":"Raph","number":4,"position":"CB","team":"home","x":50,"y":15},{"id":4,"name":"Dayot","number":5,"position":"CB","team":"home","x":65,"y":15},{"id":5,"name":"Theo","number":3,"position":"LB","team":"home","x":20,"y":33},{"id":6,"name":"Aurel","number":6,"position":"CDM","team":"home","x":35,"y":33}],"equipment":[{"id":1773393372618,"type":"cone","x":52.5,"y":34}]}

    await prisma.session.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Séance 1 - Placement défensif',
        type: 'training',
        format: 'training',
        teamId: u8Team.id,
        createdById: ymadoui.id,
        data: JSON.stringify(session1Data),
      },
    })
    console.log('✅ Session créée: Séance 1 - Placement défensif')

    // Session 2 - Animation avec exercices
    const session2Data = {"exercises":[{"name":"Exercice 1","frames":[{"players":[{"id":1773394827768,"name":"J1","number":1,"position":"CM","team":"home","color":"blue","x":84.56,"y":26.26},{"id":1773394828209,"name":"J2","number":2,"position":"CM","team":"home","color":"yellow","x":41.19,"y":13.91},{"id":1773394828360,"name":"J3","number":3,"position":"CM","team":"home","color":"yellow","x":22.67,"y":10.29},{"id":1773394836088,"name":"J4","number":4,"position":"CM","team":"home","color":"yellow","x":42.11,"y":31.65},{"id":1773394838152,"name":"J5","number":5,"position":"CM","team":"home","color":"yellow","x":36.46,"y":53.46},{"id":1773394838848,"name":"J6","number":6,"position":"CM","team":"home","color":"yellow","x":11.76,"y":51.62},{"id":1773394841648,"name":"J7","number":7,"position":"CM","team":"home","color":"yellow","x":12.22,"y":27.31},{"id":1773394854024,"name":"J8","number":8,"position":"CM","team":"home","color":"blue","x":86.20,"y":51.55},{"id":1773394855168,"name":"J9","number":9,"position":"CM","team":"home","color":"blue","x":61.50,"y":20.61},{"id":1773394856248,"name":"J10","number":10,"position":"CM","team":"home","color":"blue","x":61.76,"y":50.04},{"id":1773394862016,"name":"J11","number":11,"position":"CM","team":"home","color":"blue","x":57.29,"y":34.67}],"equipment":[{"id":1773394866432,"type":"ball","x":61.04,"y":35.03},{"id":1773394869536,"type":"arrow","x":57.29,"y":34.70,"endX":79.96,"endY":26.03,"color":"#000","dashed":true}]}]},{"name":"Exercice 2","frames":[{"players":[{"id":1,"name":"Hugo","number":1,"position":"GK","team":"home","x":20,"y":15,"color":"blue"},{"id":2,"name":"Lucas","number":2,"position":"RB","team":"home","x":35,"y":15,"color":"blue"},{"id":3,"name":"Raph","number":4,"position":"CB","team":"home","x":50,"y":15,"color":"blue"},{"id":4,"name":"Dayot","number":5,"position":"CB","team":"home","x":65,"y":15,"color":"blue"},{"id":5,"name":"Theo","number":3,"position":"LB","team":"home","x":20,"y":33,"color":"blue"},{"id":6,"name":"Aurel","number":6,"position":"CDM","team":"home","x":35,"y":33,"color":"blue"}],"equipment":[]}]}],"players":[{"id":1,"name":"Hugo","number":1,"position":"GK","team":"home","x":20,"y":15,"color":"blue"},{"id":2,"name":"Lucas","number":2,"position":"RB","team":"home","x":35,"y":15,"color":"blue"},{"id":3,"name":"Raph","number":4,"position":"CB","team":"home","x":50,"y":15,"color":"blue"},{"id":4,"name":"Dayot","number":5,"position":"CB","team":"home","x":65,"y":15,"color":"blue"},{"id":5,"name":"Theo","number":3,"position":"LB","team":"home","x":20,"y":33,"color":"blue"},{"id":6,"name":"Aurel","number":6,"position":"CDM","team":"home","x":35,"y":33,"color":"blue"}],"equipment":[]}

    await prisma.session.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: 'Test Animation - Conservation',
        type: 'training',
        format: 'training',
        teamId: u14Team.id,
        createdById: ymadoui.id,
        data: JSON.stringify(session2Data),
      },
    })
    console.log('✅ Session créée: Test Animation - Conservation')
  }
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
