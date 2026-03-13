const XLSX = require('xlsx');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fonction pour générer un login unique
function generateLogin(nom, prenom, existingLogins) {
  // Nettoyer et normaliser
  const cleanNom = nom.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-z]/g, '');
  const cleanPrenom = prenom.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
  
  // Format: première lettre prénom + nom (ex: ymadoui)
  let login = cleanPrenom.charAt(0) + cleanNom;
  
  // Si existe déjà, ajouter un numéro
  let finalLogin = login;
  let counter = 1;
  while (existingLogins.has(finalLogin)) {
    finalLogin = login + counter;
    counter++;
  }
  
  existingLogins.add(finalLogin);
  return finalLogin;
}

// Fonction pour générer un mot de passe simple
function generatePassword(prenom) {
  const cleanPrenom = prenom.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
  // Format: prenom + année (ex: yassine2024)
  return cleanPrenom + '2024';
}

// Mapping des équipes
function parseTeams(equipesStr) {
  if (!equipesStr) return [];
  const teams = [];
  const parts = equipesStr.split(',').map(s => s.trim());
  
  parts.forEach(part => {
    // Format: "U10/U11: Joueur" ou "U7: Coach"
    const match = part.match(/^([^:]+):\s*(Joueur|Coach|Manager)/i);
    if (match) {
      const teamName = match[1].trim();
      const role = match[2].toLowerCase() === 'coach' ? 'ENTRAINEUR' : 'JOUEUR';
      teams.push({ teamName, role });
    }
  });
  
  return teams;
}

async function importUsers() {
  console.log('🚀 Démarrage de l\'import...\n');
  
  // Lire le fichier Excel
  const filePath = path.join(__dirname, '..', 'SportEasy_co-la-riviere.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  // Récupérer ou créer les équipes
  const teamNames = ['U7', 'U8', 'U9', 'U10/U11', 'U12', 'U13', 'U14', 'U15', 'Senior 1', 'Senior 2'];
  const teamsMap = {};
  
  for (const name of teamNames) {
    let team = await prisma.team.findFirst({ where: { name } });
    if (!team) {
      const category = name.startsWith('Senior') ? 'Senior' : name.replace('/', '-');
      team = await prisma.team.create({ data: { name, category } });
      console.log(`✅ Équipe créée: ${name}`);
    }
    teamsMap[name] = team;
  }
  
  // Résultats
  const results = [];
  const existingLogins = new Set();
  
  // Récupérer les logins existants
  const existingUsers = await prisma.user.findMany({ select: { username: true } });
  existingUsers.forEach(u => existingLogins.add(u.username));
  
  let created = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const nom = row['Nom']?.toString().trim();
    const prenom = row['Prénom']?.toString().trim();
    const equipesStr = row['Equipe(s)'];
    const email = row['Email']?.toString().trim() || null;
    const role = row['Rôle']?.toString().trim();
    
    if (!nom || !prenom) continue;
    
    // Générer login et mot de passe
    const login = generateLogin(nom, prenom, existingLogins);
    const password = generatePassword(prenom);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Déterminer si c'est un entraineur
    const teams = parseTeams(equipesStr);
    const isCoach = teams.some(t => t.role === 'ENTRAINEUR');
    const userRole = isCoach ? 'ENTRAINEUR' : 'JOUEUR';
    
    // Vérifier si l'utilisateur existe déjà (par email ou nom+prénom)
    let existingUser = null;
    if (email) {
      existingUser = await prisma.user.findFirst({ where: { email } });
    }
    if (!existingUser) {
      existingUser = await prisma.user.findFirst({ 
        where: { firstName: prenom, lastName: nom } 
      });
    }
    
    if (existingUser) {
      skipped++;
      console.log(`⏭️  Ignoré (existe déjà): ${prenom} ${nom}`);
      continue;
    }
    
    // Créer l'utilisateur
    try {
      const user = await prisma.user.create({
        data: {
          username: login,
          password: hashedPassword,
          firstName: prenom,
          lastName: nom,
          email: email,
          role: userRole
        }
      });
      
      // Créer les memberships pour chaque équipe
      for (const { teamName, role: memberRole } of teams) {
        // Trouver l'équipe correspondante
        let team = teamsMap[teamName];
        if (!team) {
          // Chercher une équipe qui contient ce nom
          const matchingTeam = Object.entries(teamsMap).find(([name]) => 
            teamName.includes(name) || name.includes(teamName)
          );
          if (matchingTeam) team = matchingTeam[1];
        }
        
        if (team) {
          await prisma.membership.create({
            data: {
              userId: user.id,
              teamId: team.id,
              role: memberRole
            }
          });
        }
      }
      
      results.push({
        nom,
        prenom,
        login,
        password,
        email: email || '-',
        role: userRole,
        equipes: teams.map(t => t.teamName).join(', ') || '-'
      });
      
      created++;
      console.log(`✅ Créé: ${prenom} ${nom} → ${login} / ${password}`);
    } catch (err) {
      console.error(`❌ Erreur pour ${prenom} ${nom}: ${err.message}`);
    }
  }
  
  console.log('\n========================================');
  console.log(`📊 Résumé: ${created} créés, ${skipped} ignorés`);
  console.log('========================================\n');
  
  // Générer un fichier avec les identifiants
  if (results.length > 0) {
    // Créer un nouveau workbook avec les résultats
    const wsData = [
      ['Nom', 'Prénom', 'Login', 'Mot de passe', 'Email', 'Rôle', 'Équipes']
    ];
    results.forEach(r => {
      wsData.push([r.nom, r.prenom, r.login, r.password, r.email, r.role, r.equipes]);
    });
    
    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(newWb, newWs, 'Identifiants');
    
    const outputPath = path.join(__dirname, '..', 'identifiants_users.xlsx');
    XLSX.writeFile(newWb, outputPath);
    console.log(`📁 Fichier des identifiants créé: ${outputPath}`);
  }
  
  await prisma.$disconnect();
}

importUsers().catch(console.error);
