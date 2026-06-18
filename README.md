# AlertMNS — Messagerie interne sécurisée

Application de messagerie temps réel pour organisations, développée dans le cadre du projet DEVWEB CDA 2025/2026 — Metz Numeric School.

> **GitHub** : [demonhunter57/alertmns](https://github.com/demonhunter57/alertmns)  
> **Accès public** : via Cloudflare Tunnel (voir section Déploiement)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Back-end API | Java 21 + Spring Boot 3.3 |
| Temps réel | STOMP WebSocket (SockJS fallback) |
| Authentification | Spring Security 6 + JWT HMAC-SHA256 |
| Base de données | H2 in-memory (dev) → PostgreSQL (prod) |
| ORM | Hibernate / Spring Data JPA |
| Front-end | Angular 17 Standalone + Signals |
| Styling | SCSS + CSS Custom Properties (thème dark/light) |
| Reverse proxy | Nginx (SSL termination) |
| Tunnel public | Cloudflare Tunnel (cloudflared) |

---

## Structure du projet

```
alertmns/
├── alertmns-backend/               ← Projet Maven Spring Boot
│   └── src/main/java/com/alertmns/
│       ├── config/                 ← Security, WebSocket, Jackson
│       ├── model/                  ← Entités JPA (User, Channel, Message…)
│       ├── dto/                    ← Records Java (request/response)
│       ├── repository/             ← Interfaces Spring Data JPA
│       ├── service/                ← Logique métier transactionnelle
│       ├── controller/             ← Endpoints REST + GlobalExceptionHandler
│       ├── websocket/              ← Handlers STOMP temps réel
│       └── security/               ← JwtTokenProvider + JwtAuthFilter
│
├── alertmns-frontend/              ← Projet Angular 17 Standalone
│   └── src/app/
│       ├── core/                   ← Services, models, guards, interceptors
│       └── features/
│           ├── auth/login/         ← LoginComponent
│           └── chat/               ← ChatComponent + Sidebar + ChatArea + MessageItem
│
├── deploy/
│   └── nginx-alertmns.conf         ← Configuration Nginx (SSL, proxy)
│
├── docker-compose.yml              ← Orchestration des deux conteneurs
├── docs.md/
│   ├── DOCUMENTATION.md            ← Documentation technique complète
│   ├── CHOIX_ARCHITECTURE.md       ← Justification des choix techniques
│   ├── QUESTIONS_SOUTENANCE_CDA.md ← 50 Q/R pour la soutenance CDA
│   └── SPRINTS.md                  ← Backlog organisé en 6 sprints
```

---

## Démarrage rapide

### Backend (Java 21 + Maven)

```bash
cd alertmns-backend
mvn spring-boot:run
# Serveur sur http://localhost:4000
# Console H2 : http://localhost:4000/h2-console
#   JDBC URL: jdbc:h2:mem:alertmns | user: sa | password: (vide)
```

### Frontend (Node.js 20 + Angular 17)

```bash
cd alertmns-frontend
npm install
npm start
# Application sur http://localhost:4200
# Proxy automatique vers localhost:4000
```

---

## Comptes de démonstration

| Username | Mot de passe | Rôle |
|----------|-------------|------|
| `admin` | `admin123` | ADMIN — accès complet |
| `sofia` | `user123` | MANAGER |
| `marc` | `user123` | USER |
| `lea` | `user123` | USER — absente (statut AWAY) |

---

## API REST

**Base URL** : `/api` — Auth : `Authorization: Bearer {token}`

```
POST   /api/auth/login                  Connexion → JWT
POST   /api/auth/register               Inscription → JWT
GET    /api/auth/me                     Profil courant
PATCH  /api/auth/me                     Modifier profil / statut

GET    /api/channels                    Canaux accessibles
POST   /api/channels                    Créer un canal
GET    /api/channels/{id}               Détails + membres
PATCH  /api/channels/{id}/members       Gérer les membres (add/remove)
DELETE /api/channels/{id}               Supprimer (ADMIN)

GET    /api/messages/{channelId}        Historique (50 derniers)
PATCH  /api/messages/{id}              Modifier un message (auteur)
DELETE /api/messages/{id}              Supprimer (auteur/ADMIN)
POST   /api/messages/{id}/react        Réaction emoji (toggle)

GET    /api/users                       Liste des utilisateurs
GET    /api/users/{id}                  Profil utilisateur
PATCH  /api/users/{id}/role             Changer rôle (ADMIN)
DELETE /api/users/{id}                  Supprimer (ADMIN)

GET    /api/export/{channelId}/json     Export JSON
GET    /api/export/{channelId}/csv      Export CSV
GET    /api/export/{channelId}/xml      Export XML
```

---

## WebSocket STOMP

**Endpoint** : `/ws` (SockJS fallback)  
**Auth** : header STOMP `Authorization: Bearer {token}`

```
Abonnements (serveur → client) :
  /topic/channel.{id}           Messages d'un canal
  /topic/channel.{id}.typing    Indicateurs de frappe
  /topic/users                  Statuts utilisateurs
  /user/queue/notifications     Notifications DM personnelles

Envois (client → serveur, préfixe /app) :
  /app/chat.send    { channelId, content }
  /app/chat.edit    { messageId, content }
  /app/chat.delete  { messageId, channelId }
  /app/chat.react   { messageId, emoji }
  /app/typing.start { channelId }
  /app/typing.stop  { channelId }
  /app/dm.send      { recipientId, content }
  /app/status.set   { status, absentUntil?, absentMessage? }
```

---

## Docker

### Démarrage avec Docker Compose

```bash
docker compose up --build
# Frontend : http://localhost
# Le frontend Nginx proxifie /api/ et /ws vers le backend
```

Les deux conteneurs partagent un réseau bridge `alertmns-net`. Le conteneur frontend expose uniquement le port 80 ; le backend n'est pas exposé à l'hôte.

| Conteneur | Image de base | Port interne |
|-----------|---------------|--------------|
| `alertmns-backend` | `eclipse-temurin:21-jre-alpine` | 4000 |
| `alertmns-frontend` | `nginx:alpine` | 80 (exposé) |

> Pour activer le profil Spring `docker` (H2 console désactivée, CORS `http://localhost`), ajouter dans `docker-compose.yml` sous le service `alertmns-backend` :
> ```yaml
> environment:
>   - SPRING_PROFILES_ACTIVE=docker
> ```

---

## Déploiement

### Prérequis VM

- Ubuntu / Debian, Java 21, Maven, Node.js 20, Nginx, cloudflared

### Build de production

```bash
# Backend
cd alertmns-backend
mvn clean package -DskipTests
# → target/alertmns-backend-1.0.0.jar

# Frontend
cd alertmns-frontend
npm run build:prod
# → dist/alertmns-frontend/browser/ (à copier dans /var/www/alertmns/)
```

### Services systemd

```
alertmns.service          ← Spring Boot (port 4000)
nginx                     ← Reverse proxy SSL (ports 80/443)
cloudflared-alertmns      ← Tunnel public Cloudflare (URL auto-générée)
```

Pour obtenir l'URL Cloudflare après redémarrage :
```bash
grep -o 'https://[^ ]*trycloudflare.com' /var/log/cloudflared-alertmns.log | tail -1
```

---

## Fonctionnalités

- Authentification JWT + inscription
- Canaux publics et privés avec gestion des membres
- Messagerie temps réel (STOMP WebSocket)
- Indicateurs de frappe
- Réactions emoji (toggle)
- Statuts de présence (ONLINE / AWAY / OFFLINE + message d'absence)
- Messages privés (DM) avec notifications
- Édition et suppression de messages
- **Thème dark / light** — bouton flottant ☀️/🌙, persisté en localStorage
- Export des conversations (JSON, CSV, XML)
- Gestion des rôles (ADMIN / MANAGER / USER)

---

## Sécurité

- Mots de passe hashés bcrypt (cost 10)
- JWT HMAC-SHA256, expiration 7 jours
- CORS strict : whitelist d'origines configurée
- Canaux privés : contrôle d'accès serveur + WebSocket
- Erreurs 500 : messages génériques (pas de stack trace exposée)
- Nginx : HTTPS TLS 1.2/1.3, redirection HTTP → HTTPS
- H2 console désactivée en production

---

## Tests unitaires

```
alertmns-backend/src/test/java/com/alertmns/
├── security/JwtTokenProviderTest.java   ← 6 tests JWT
├── service/AuthServiceTest.java         ← 6 tests Mockito (login, register)
└── service/ChannelServiceTest.java      ← 5 tests (accès, création, suppression)
```

```bash
cd alertmns-backend
mvn test
```

---

## Roadmap v2.0

- [ ] Migration PostgreSQL + Flyway (migrations versionnées)
- [ ] Refresh Token (access 15min + refresh 30j)
- [ ] Upload de fichiers (MinIO / S3)
- [ ] Notifications push (Web Push API + Service Worker)
- [ ] Tests d'intégration `@SpringBootTest` + MockMvc
- [ ] Tests E2E Angular (Playwright)
- [ ] 2FA (TOTP)
- [ ] Recherche full-text dans les messages
- [ ] Chiffrement de bout en bout (Signal Protocol)

---

*AlertMNS — Metz Numeric School — CDA 2025/2026*
