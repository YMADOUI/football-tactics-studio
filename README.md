# ⚽ Football Tactics Studio

Application web de gestion d'entraînements de football avec animations tactiques.

## 🎯 Fonctionnalités

- **Authentification** : Connexion sécurisée avec rôles (Entraîneur / Joueur)
- **Mode Match** : 11v11, 8v8, 5v5 avec formations
- **Mode Entraînement** : 
  - Joueurs de différentes couleurs (équipe, adversaires)
  - Équipement : ballons, cônes, coupelles, flèches
  - Animations fluides avec interpolation
  - Plusieurs exercices par séance
- **Responsive** : Fonctionne sur mobile et tablette
- **Base de données** : SQLite avec Prisma

## 🚀 Installation locale

```bash
# Cloner le repo
git clone <votre-repo>
cd football-manager-app

# Installer les dépendances
npm run postinstall

# Configurer la base de données
cd backend
npx prisma migrate deploy
npx prisma db seed
cd ..

# Lancer en développement
npm run dev
```

## 🔐 Comptes par défaut

| Rôle | Username | Mot de passe |
|------|----------|--------------|
| Entraîneur | YMADOUI | coach2024 |
| Joueur | ymadoui1 | youri2024 |

## 📦 Déploiement sur Railway

1. Créer un compte sur [railway.app](https://railway.app)
2. Connecter votre repo GitHub
3. Ajouter les variables d'environnement :
   - `JWT_SECRET` : une clé secrète aléatoire
   - `DATABASE_URL` : `file:./dev.db`
4. Railway déploie automatiquement !

## 🛠 Technologies

- **Frontend** : React 18 + Vite
- **Backend** : Node.js + Express
- **Base de données** : SQLite + Prisma
- **Auth** : JWT + bcrypt

## 📱 Captures d'écran

[À ajouter]

---

Développé avec ❤️ par YMADOUI
