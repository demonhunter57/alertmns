# AlertMNS — Backlog des sprints

Généré à partir de l'audit complet du 2026-06-12 (5 agents : Frontend, Backend, Docker, Qualité globale, Documentation).

> **Légende :** 🔴 Critique · 🟠 Majeur · 🟡 Mineur

---

## Sprint 1 — Sécurité critique
*Objectif : éliminer toutes les vulnérabilités exploitables immédiatement.*

| # | Priorité | Fichier(s) | Tâche |
|---|----------|-----------|-------|
| S1-01 | 🔴 | `application.properties`, `application-prod.properties` | Externaliser les secrets JWT vers variable d'environnement `${APP_JWT_SECRET}` — changer le secret prod sur le serveur — nettoyer l'historique git si repo public |
| S1-02 | 🔴 | `login.component.html` | Supprimer les credentials démo (`admin/admin123`) du HTML public — conditionner avec `@if (!environment.production)` |
| S1-03 | 🔴 | `alertmns-backend/Dockerfile` | Ajouter `USER appuser` (utilisateur non-root) — créer le groupe et l'utilisateur système dans l'image |
| S1-04 | 🔴 | `alertmns-frontend/Dockerfile` | Migrer vers `nginxinc/nginx-unprivileged:alpine` — adapter le port de 80 à 8080 dans le docker-compose |
| S1-05 | 🔴 | `alertmns-frontend/nginx.conf` | Ajouter les headers de sécurité HTTP : `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`, `CSP`, `Permissions-Policy` |
| S1-06 | 🔴 | `application-prod.properties` | Changer `spring.jpa.hibernate.ddl-auto=create-drop` → `validate` (données perdues à chaque restart actuellement) |
| S1-07 | 🔴 | `MessageController.java` | Ajouter contrôle d'accès sur `GET /api/messages/{channelId}` — vérifier que l'utilisateur est membre du canal |
| S1-08 | 🔴 | `ExportController.java` | Ajouter contrôle d'accès sur tous les endpoints `GET /api/export/{channelId}/*` |
| S1-09 | 🔴 | `WebSocketConfig.java` | Rendre l'authentification STOMP obligatoire — rejeter les CONNECT sans token valide |
| S1-10 | 🔴 | `auth.service.ts` | Migrer le JWT de `localStorage` vers cookie `HttpOnly; Secure; SameSite=Strict` |
| S1-11 | 🔴 | `JwtTokenProvider.java` | Corriger le double-encodage Base64 de la clé JWT — utiliser `Keys.hmacShaKeyFor(secret.getBytes(UTF_8))` directement |
| S1-12 | 🔴 | `.gitignore` | Ajouter `application-prod.properties`, `application-docker.properties`, `.env`, `.env.*` — ajouter `alertmns-frontend/.angular/` |
| S1-13 | 🔴 | `docker-compose.yml` | Injecter `SPRING_PROFILES_ACTIVE` et `APP_JWT_SECRET` via `env_file: .env` |

---

## Sprint 2 — Stabilité backend & contrôles d'accès
*Objectif : corriger les failles de contrôle d'accès restantes et les NPE potentiels.*

| # | Priorité | Fichier(s) | Tâche |
|---|----------|-----------|-------|
| S2-01 | 🟠 | `WebSocketConfig.java` | Restreindre `allowedOriginPatterns` du WebSocket aux mêmes origines que l'API REST |
| S2-02 | 🟠 | `WebSocketController.java` | Ajouter contrôle d'accès sur `typingStart` / `typingStop` (vérifier membership canal privé) |
| S2-03 | 🟠 | `WebSocketController.java` | Sécuriser les DM : valider existence du destinataire, vérifier droits |
| S2-04 | 🟠 | `WebSocketController.java` | Protéger `extractUserId()` contre `principal == null` — lever `IllegalStateException` explicite |
| S2-05 | 🟠 | `WebSocketController.java` | Remplacer les `Map<String, Object>` payload par des records typés — valider la présence des champs |
| S2-06 | 🟠 | `WebSocketConfig.java` | Implémenter un `ChannelInterceptor` sur `SUBSCRIBE` pour bloquer les abonnements aux canaux privés sans membership |
| S2-07 | 🟠 | `SecurityConfig.java` | BCrypt cost 10 → 12 (recommandation OWASP 2026) |
| S2-08 | 🟠 | `SecurityConfig.java` | Restreindre `/h2-console/**` à `localhost` uniquement — cibler `frameOptions.sameOrigin()` au lieu de `disable()` global |
| S2-09 | 🟠 | `DataInitializer.java` | Conditionner `DataInitializer` au profil `dev` avec `@Profile("dev")` |
| S2-10 | 🟡 | `UpdateMembersRequest.java` | Remplacer `String action` par `enum Action { ADD, REMOVE }` avec `@NotNull` |
| S2-11 | 🟡 | `EditMessageRequest.java` + WS | Ajouter `@Size(max = 10000)` sur le contenu des messages |
| S2-12 | 🟡 | `ExportService.java` | Injecter `ObjectMapper` via constructeur au lieu d'en créer un par appel |

---

## Sprint 3 — Stabilité frontend & performance Angular
*Objectif : corriger les fuites mémoire, ajouter OnPush, convertir en patterns Angular 17 idiomatiques.*

| # | Priorité | Fichier(s) | Tâche |
|---|----------|-----------|-------|
| S3-01 | 🔴 | `chat.component.ts` | Rattacher les souscriptions `getChannels()` et `getAllUsers()` à `this.subs` (fuite mémoire) |
| S3-02 | 🟠 | Tous les composants (6) | Ajouter `changeDetection: ChangeDetectionStrategy.OnPush` — requis pour que les Signals soient utiles |
| S3-03 | 🟠 | `app.config.ts` | Corriger `APP_INITIALIZER` pour retourner `Promise<void>` — évite le flash d'UI non authentifiée |
| S3-04 | 🟠 | `chat.component.html` | Protéger `currentUser()!` par un guard template `@if (authService.currentUser())` |
| S3-05 | 🟠 | `chat-area.component.ts` | Convertir `getTypingUserNames()` en `computed()` — évite recalcul à chaque cycle CD |
| S3-06 | 🟠 | `chat-area.component.ts` | Rattacher la souscription `getHistory()` dans `loadChannel()` à `this.subs` |
| S3-07 | 🟠 | `export-menu.component.ts` | Ajouter gestion d'erreur et flag `isExporting` pour éviter les requêtes parallèles |
| S3-08 | 🟠 | `sidebar.component.ts` | Remplacer `window.confirm()` par une modale de confirmation Angular |
| S3-09 | 🟠 | Tous les composants | Migrer l'injection constructeur vers `inject()` (pattern Angular 17 standalone) |
| S3-10 | 🟠 | `chat.component.ts` | Déplacer `effect()` hors du constructeur — utiliser `afterNextRender` ou `toObservable().subscribe()` |
| S3-11 | 🟠 | `sidebar.component.ts` | Convertir les getters `publicChannels`, `privateChannels`, `onlineUsers` en `computed()` ou recalcul sur `ngOnChanges` |
| S3-12 | 🟡 | `chat.component.ts` | Protéger `localStorage.getItem('theme')` avec `isPlatformBrowser()` (compatibilité SSR/tests) |
| S3-13 | 🟡 | `websocket.service.ts` | Remplacer `as any` par `as unknown as WebSocket` |
| S3-14 | 🟡 | Divers | Supprimer les casts `as Message` / `as User` sur `unknown` — utiliser des type guards |
| S3-15 | 🟡 | `user.service.ts` | Typer `role` avec `'ADMIN'|'MANAGER'|'USER'` et `status` avec `'ONLINE'|'AWAY'|'OFFLINE'` |
| S3-16 | 🟡 | `user.service.ts`, `message.service.ts` | Supprimer ou documenter les méthodes mortes (`updateRole`, `deleteUser`, `editMessage`, `deleteMessage` REST) |

---

## Sprint 4 — Docker, infrastructure & déploiement
*Objectif : rendre la configuration Docker robuste et production-ready.*

| # | Priorité | Fichier(s) | Tâche |
|---|----------|-----------|-------|
| S4-01 | 🟠 | `docker-compose.yml` | Ajouter healthchecks backend (Spring Actuator) + `depends_on: condition: service_healthy` |
| S4-02 | 🟠 | `docker-compose.yml` | Ajouter limites de ressources : backend 512m / 1 CPU, frontend 64m / 0.25 CPU |
| S4-03 | 🟠 | `alertmns-backend/Dockerfile` | Remplacer le nom JAR hardcodé `1.0.0` par `target/*.jar` |
| S4-04 | 🟠 | `alertmns-backend/Dockerfile` | Ajouter flags JVM : `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom` |
| S4-05 | 🟠 | `alertmns-frontend/nginx.conf` | Ajouter `X-Forwarded-Proto`, `X-Forwarded-For`, limites de timeout et `client_max_body_size` |
| S4-06 | 🟠 | `application-prod.properties` | Remplacer H2 in-memory par PostgreSQL — ajouter service `db` dans docker-compose avec volume persistant |
| S4-07 | 🟡 | `Dockerfiles` | Épingler les images sur des tags de patch précis (ex. `nginx:1.27.3-alpine`) — éviter les tags flottants |
| S4-08 | 🟡 | `.dockerignore` backend | Ajouter `src/test/`, `.idea/`, `*.iml`, `.env`, `*.local` |
| S4-09 | 🟡 | `docker-compose.yml` | Ajouter un réseau `backend-net` interne pour isoler la future base de données |
| S4-10 | 🟡 | `application-prod.properties` | Corriger CORS prod : retirer les origines `http://` pour le domaine public (garder uniquement `https://`) |
| S4-11 | 🟡 | `deploy/deploy.sh` | Remplacer `curl | sudo bash` par vérification de hash SHA avant exécution |

---

## Sprint 5 — Tests
*Objectif : atteindre une couverture minimale sur les composants critiques.*

| # | Priorité | Fichier(s) | Tâche |
|---|----------|-----------|-------|
| S5-01 | 🟠 | `auth.service.spec.ts` (à créer) | Tests unitaires frontend : login, logout, `initFromStorage`, guard |
| S5-02 | 🟠 | `auth.interceptor.spec.ts` (à créer) | Tests de l'intercepteur JWT (token présent, absent, expiré) |
| S5-03 | 🟠 | `MessageService` (à créer) | Tests backend : réactions toggle, droits edit/delete auteur vs ADMIN |
| S5-04 | 🟠 | `WebSocketController` (à créer) | Tests backend : `principal == null`, payload invalide, canal privé |
| S5-05 | 🟠 | `ExportService` (à créer) | Tests backend : CSV injection, XML escape, accès canal privé |
| S5-06 | 🟡 | `JwtTokenProviderTest.java` | Compléter : token null, token malformé, UUID invalide dans le subject |
| S5-07 | 🟡 | `ChannelServiceTest.java` | Compléter : action invalide dans `updateMembers`, ajout membre canal public |
| S5-08 | 🟡 | — | Configurer `@angular-eslint` (`ng add @angular-eslint/schematics`) |

---

## Sprint 6 — Accessibilité, SCSS & documentation
*Objectif : améliorer l'accessibilité, finaliser le thème dark/light sur tous les composants, corriger la documentation.*

| # | Priorité | Fichier(s) | Tâche |
|---|----------|-----------|-------|
| S6-01 | 🟡 | `chat-area.component.html` | Ajouter `aria-label="Envoyer le message"` sur le bouton `➤` |
| S6-02 | 🟡 | `chat.component.html` | Ajouter `[attr.aria-label]` dynamique sur le bouton toggle thème |
| S6-03 | 🟡 | `sidebar.component.html` | `aria-label="Créer un canal"` sur `+` ; `aria-label="'Gérer ' + channel.name"` sur `⚙` |
| S6-04 | 🟡 | `sidebar.component.html` | Ajouter `role="dialog" aria-modal="true" aria-labelledby="modal-title"` sur les modales |
| S6-05 | 🟡 | `sidebar.component.html` | Ajouter `aria-label="Navigation des canaux"` sur `<aside class="sidebar">` |
| S6-06 | 🟡 | `styles.scss` | Ajouter les variables CSS manquantes : `--color-warning`, `--color-danger`, `--color-success`, `--color-teal` |
| S6-07 | 🟡 | `export-menu.component.ts` | Déplacer les styles inline vers `export-menu.component.scss` avec les variables CSS du thème |
| S6-08 | 🟡 | `sidebar.component.scss` | Remplacer `#f39c12`, `#e74c3c`, `#2ecc71` par les variables CSS |
| S6-09 | 🟡 | `sidebar.component.html` | Retirer `style="margin-top:1rem"` inline → classe CSS |
| S6-10 | 🟡 | `QUESTIONS_SOUTENANCE_CDA.md` | Corriger Q27 : `localhost:5173` → `localhost:4200` |
| S6-11 | 🟡 | `QUESTIONS_SOUTENANCE_CDA.md` | Corriger Q49 : "15 REST endpoints" → "20 REST endpoints" |
| S6-12 | 🟡 | `QUESTIONS_SOUTENANCE_CDA.md` | Corriger Q13/Q17 : PostgreSQL → H2 in-memory (WAL non applicable) |
| S6-13 | 🟡 | `CHOIX_ARCHITECTURE.md` | Corriger le titre : "PostgreSQL" → "H2 / PostgreSQL (cible v2.0)" |
| S6-14 | 🟡 | `README.md` | Ajouter note sur les profils Spring (`dev`, `docker`, `prod`) et leurs différences |
| S6-15 | 🟡 | `docker-compose.yml` | Ajouter `SPRING_PROFILES_ACTIVE: docker` dans `environment` (actuellement absent malgré la doc) |
| S6-16 | 🟡 | `server/` | Supprimer le dossier orphelin (vestige Node.js) |

---

## Synthèse

| Sprint | Focus | Tickets | Durée estimée |
|--------|-------|---------|---------------|
| Sprint 1 | Sécurité critique | 13 | 1 semaine |
| Sprint 2 | Stabilité backend & accès | 12 | 1 semaine |
| Sprint 3 | Stabilité frontend & performance | 16 | 1 semaine |
| Sprint 4 | Docker & infrastructure | 11 | 1 semaine |
| Sprint 5 | Tests | 8 | 1 semaine |
| Sprint 6 | Accessibilité, SCSS & documentation | 16 | 1 semaine |
| **Total** | | **76 tickets** | **6 semaines** |

---

*AlertMNS — Audit 2026-06-12 — demonhunter57*
