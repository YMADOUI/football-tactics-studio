const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'football-tactics-secret-2024';

app.use(cors());
app.use(bodyParser.json());

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requis' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ============ AUTH ============

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ 
      where: { username },
      include: { memberships: { include: { team: true } } }
    });
    if (!user) return res.status(401).json({ error: 'Utilisateur non trouvé' });
    if (!user.password) return res.status(401).json({ error: 'Mot de passe non défini' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName, memberships: user.memberships } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: { memberships: { include: { team: true } } }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ id: user.id, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName, memberships: user.memberships });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ USERS (protégé - entraineurs seulement) ============

// Liste des users
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, firstName: true, lastName: true, email: true, createdAt: true },
      orderBy: { username: 'asc' }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Créer un user (entraineur seulement)
app.post('/api/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ENTRAINEUR') return res.status(403).json({ error: 'Accès refusé' });
    const { username, password, role, firstName, lastName, email } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'joueur2024', 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role: role || 'JOUEUR', firstName, lastName, email }
    });
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Modifier mot de passe
app.put('/api/users/:id/password', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.id !== id && req.user.role !== 'ENTRAINEUR') return res.status(403).json({ error: 'Accès refusé' });
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ TEAMS ============

// Liste des équipes
app.get('/api/teams', authMiddleware, async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: { memberships: { include: { user: { select: { id: true, username: true, firstName: true, lastName: true, role: true } } } } },
      orderBy: { name: 'asc' }
    });
    res.json(teams);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Détail d'une équipe
app.get('/api/teams/:id', authMiddleware, async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { memberships: { include: { user: { select: { id: true, username: true, firstName: true, lastName: true, role: true } } } } }
    });
    if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
    res.json(team);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ajouter un joueur à une équipe
app.post('/api/teams/:id/members', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ENTRAINEUR') return res.status(403).json({ error: 'Accès refusé' });
    const teamId = parseInt(req.params.id);
    const { userId, role, number, position } = req.body;
    const membership = await prisma.membership.create({
      data: { userId, teamId, role: role || 'JOUEUR', number, position }
    });
    res.status(201).json(membership);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ SESSIONS ============

// Liste des sessions d'une équipe
app.get('/api/teams/:id/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { teamId: parseInt(req.params.id) },
      include: { createdBy: { select: { username: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Créer une session
app.post('/api/sessions', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, format, teamId, data } = req.body;
    const session = await prisma.session.create({
      data: { title, description, type, format, teamId, createdById: req.user.id, data: JSON.stringify(data) }
    });
    res.status(201).json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Récupérer une session
app.get('/api/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { team: true, createdBy: { select: { username: true } } }
    });
    if (!session) return res.status(404).json({ error: 'Session non trouvée' });
    res.json({ ...session, data: session.data ? JSON.parse(session.data) : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mettre à jour une session
app.put('/api/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, format, data } = req.body;
    const session = await prisma.session.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description, type, format, data: JSON.stringify(data) }
    });
    res.json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ PING ============
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// ============ STATIC ============
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend not found. Build the frontend or open /api/ping');
    }
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend listening on http://localhost:${PORT}`));
