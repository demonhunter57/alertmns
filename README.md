# AlertMNS — Messagerie interne

Application de messagerie temps réel pour organisations, développée dans le cadre du projet DEVWEB CDA 2025/2026 — Metz Numeric School.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Back-end API | Node.js + Express |
| Temps réel | Socket.io (WebSocket) |
| Authentification | JWT + bcrypt |
| Front-end | React 18 + Vite |
| Routing | React Router v6 |
| CSS | CSS Modules |
| Export | JSON, CSV, XML, PDF |

## Structure du projet

```
alertmns/
├── server/                  # API Node.js
│   ├── index.js             # Point d'entrée + Socket.io
│   ├── db.js                # Base en mémoire + seed
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── routes/
│   │   ├── auth.js          # Login, register, profil
│   │   ├── channels.js      # CRUD canaux
│   │   ├── messages.js      # CRUD messages + réactions
│   │   ├── users.js         # Gestion utilisateurs
│   │   └── export.js        # Exports JSON/CSV/XML/PDF
│   └── socket/
│       └── handler.js       # Tous les événements WebSocket
│
└── client/                  # Application React
    └── src/
        ├── App.jsx           # Routing principal
        ├── contexts/
        │   ├── AuthContext.jsx    # État d'authentification
        │   └── SocketContext.jsx  # Singleton WebSocket
        ├── hooks/
        │   ├── useMessages.js     # Messages + WS events
        │   └── useOnlineUsers.js  # Statuts en temps réel
        ├── pages/
        │   ├── LoginPage.jsx      # Connexion / inscription
        │   └── ChatPage.jsx       # Layout principal
        └── components/
            ├── Sidebar.jsx        # Canaux + DM + notifs
            ├── ChatArea.jsx       # Zone de messages
            ├── MessageItem.jsx    # Un message
            └── ExportMenu.jsx     # Menu d'export
```

## Démarrage rapide

```bash
# 1. Installer les dépendances
cd alertmns
npm run install:all

# 2. Configurer l'environnement
cp server/.env.example server/.env
# (optionnel) modifier JWT_SECRET

# 3. Lancer en développement
npm run dev
# Serveur :  http://localhost:4000
# Client  :  http://localhost:5173
```

## Comptes de démo

| Identifiant | Mot de passe | Rôle |
|-------------|-------------|------|
| `admin` | `admin123` | Administrateur |
| `sofia` | `user123` | Manager |
| `marc` | `user123` | Utilisateur |
| `lea` | `user123` | Utilisateur |

## Événements WebSocket

| Émis par le client | Description |
|--------------------|-------------|
| `message:send` | Envoyer un message |
| `message:edit` | Modifier un message |
| `message:delete` | Supprimer un message |
| `message:react` | Ajouter/retirer une réaction |
| `typing:start` | Commencer à écrire |
| `typing:stop` | Arrêter d'écrire |
| `dm:send` | Message direct |
| `status:set` | Changer son statut |

| Émis par le serveur | Description |
|---------------------|-------------|
| `message:new` | Nouveau message reçu |
| `message:edited` | Message modifié |
| `message:deleted` | Message supprimé |
| `message:reacted` | Réaction mise à jour |
| `typing:update` | Indicateur de frappe |
| `user:status` | Changement de statut |
| `notification` | Notification DM |

## API REST

```
POST   /api/auth/login           Connexion
POST   /api/auth/register        Inscription
GET    /api/auth/me              Profil courant
PATCH  /api/auth/me              Modifier profil / message d'absence

GET    /api/channels             Liste des canaux accessibles
POST   /api/channels             Créer un canal
GET    /api/channels/:id         Détails + membres
PATCH  /api/channels/:id/members Ajouter/retirer membres
DELETE /api/channels/:id         Supprimer (admin)

GET    /api/messages/:channelId  Historique (50 derniers)
PATCH  /api/messages/:id         Modifier un message
DELETE /api/messages/:id         Supprimer un message
POST   /api/messages/:id/react   Réagir
POST   /api/messages/:channelId/read  Marquer comme lu

GET    /api/users                Liste des utilisateurs
PATCH  /api/users/:id/role       Changer rôle (admin)

GET    /api/export/:channelId/json    Export JSON
GET    /api/export/:channelId/csv     Export CSV
GET    /api/export/:channelId/xml     Export XML
GET    /api/export/:channelId/pdf-data Données pour PDF
```

## Migration vers base de données

Le fichier `server/db.js` utilise un stockage en mémoire (données perdues au redémarrage). Pour la production, remplacer par **PostgreSQL** avec [Prisma](https://www.prisma.io/) ou **MongoDB** avec Mongoose :

```bash
# Exemple avec Prisma + PostgreSQL
cd server
npm install prisma @prisma/client
npx prisma init
# → modifier prisma/schema.prisma avec les modèles User, Channel, Message
# → remplacer les fonctions de db.js par les appels Prisma
```

## Conformité RGPD

- Mots de passe hashés bcrypt (cost 12)
- JWT expirant en 7 jours
- Canaux privés avec accès restreint
- Export des données personnelles disponible
- Pas de données tierces — hébergement auto-géré

## Roadmap

- [ ] Migration PostgreSQL avec Prisma
- [ ] Upload de fichiers (Multer + stockage S3)
- [ ] Notifications push (Web Push API)
- [ ] 2FA (TOTP)
- [ ] Recherche full-text dans les messages
- [ ] PWA (Service Worker + manifest)
- [ ] Tests unitaires (Jest) et e2e (Playwright)
