# Choix Architecturaux — AlertMNS
## Pourquoi Java Spring Boot + Angular + PostgreSQL ?

> **Projet** : AlertMNS — Messagerie interne sécurisée  
> **Migration** : Node.js + React → Java 21 + Spring Boot 3 + Angular 17 + PostgreSQL  
> **Date** : 2026-06-12 (mis à jour)

---

## TABLE DES MATIÈRES

1. [Pourquoi Java (Spring Boot) et pas rester en Node.js ?](#1-pourquoi-java-spring-boot-et-pas-rester-en-nodejs-)
2. [Pourquoi Angular et pas rester en React ?](#2-pourquoi-angular-et-pas-rester-en-react-)
3. [Pourquoi PostgreSQL et pas garder l'in-memory ?](#3-pourquoi-postgresql-et-pas-garder-lin-memory-)
4. [Pourquoi cette structure en couches ?](#4-pourquoi-cette-structure-en-couches-)
5. [Pourquoi JWT et pas des sessions ?](#5-pourquoi-jwt-et-pas-des-sessions-)
6. [Pourquoi STOMP et pas Socket.io ?](#6-pourquoi-stomp-et-pas-socketio-)
7. [Résumé en une phrase par choix](#7-résumé-en-une-phrase-par-choix)

---

## 1. Pourquoi Java (Spring Boot) et pas rester en Node.js ?

### Le problème de Node.js en entreprise

Node.js est excellent pour les prototypes et les applications légères. Mais AlertMNS est une **messagerie interne d'organisation** — c'est un outil critique de production. Voici les limites concrètes de Node.js qui ont justifié la migration :

| Problème Node.js | Solution Java |
|---|---|
| **Single-threaded** : une opération lourde (export de 10 000 messages) bloque toute l'application | Java est **multi-threaded natif** — chaque requête tourne dans son propre thread |
| **Typage dynamique** : une variable peut changer de type silencieusement → bugs en production | Java est **statiquement typé** — les erreurs sont détectées à la compilation, pas chez l'utilisateur |
| **Pas de standard de sécurité** : tu construis tout à la main (middleware JWT, autorisation) | **Spring Security** est un standard industriel éprouvé avec des filtres, des guards, et RBAC intégré |
| **Base in-memory** (le `db.js` original) : toutes les données disparaissent au redémarrage | **JPA/Hibernate** + PostgreSQL : persistance réelle, transactions ACID garanties |
| **Gestion d'erreurs manuelle** : chaque route gère ses erreurs différemment | `@RestControllerAdvice` : un seul endroit gère toutes les erreurs de façon uniforme |
| **Aucune validation des données** : un attaquant peut envoyer n'importe quoi | `@Valid` + Bean Validation : validation automatique avec messages d'erreur standardisés |

### Pourquoi Spring Boot spécifiquement ?

Spring Boot, c'est Java **sans la douleur traditionnelle de Java**. Avant Spring Boot, configurer un projet Java Web nécessitait des dizaines de fichiers XML et un serveur d'application externe (Tomcat, JBoss). Spring Boot change tout ça :

- **Convention over configuration** : zéro XML, zéro boilerplate — l'application démarre en 1 fichier
- **Écosystème cohérent** : Spring Security, Spring Data, Spring WebSocket sont tous intégrés et fonctionnent ensemble sans friction
- **Déployable partout** : un seul fichier `.jar` autonome avec Tomcat embarqué — pas besoin d'installer de serveur
- **Auto-configuration** : Spring Boot détecte ce que tu as dans le classpath et configure automatiquement (H2 détecté → configure la source de données)

```
# Démarrer toute l'application en une commande
mvn spring-boot:run
```

---

## 2. Pourquoi Angular et pas rester en React ?

### React est une librairie. Angular est un framework.

C'est la différence fondamentale. **React te donne des composants — c'est tout.** Tu dois choisir et assembler toi-même chaque brique :

```
React seul = composants uniquement
+ React Router         → routing (librairie externe)
+ Axios                → HTTP (librairie externe)
+ React Hook Form      → formulaires (librairie externe)
+ Zustand / Redux      → état global (librairie externe)
+ Jest + Testing Library → tests (librairies externes)
```

**Angular te donne tout ça d'origine**, dans un standard cohérent :

| Besoin | React | Angular |
|---|---|---|
| Routing | React Router (externe) | `@angular/router` (natif) |
| HTTP + intercepteurs | Axios (externe) | `HttpClient` + `HttpInterceptorFn` (natif) |
| Formulaires | React Hook Form (externe) | `FormsModule` / `ReactiveFormsModule` (natif) |
| Injection de dépendances | Manuel / Context | DI natif (`@Injectable`) |
| Guards de navigation | Custom | `CanActivateFn` natif |
| TypeScript | **Optionnel** | **Obligatoire** (tout est typé) |
| Tests | Jest (externe) | Jasmine + Karma (intégré) |

### Pourquoi c'est important pour un projet professionnel ?

Quand tu présentes ton code à un recruteur ou un jury, **Angular montre que tu maîtrises une architecture structurée**. Le code React avec `useState` partout, des hooks personnalisés et un Context global est plus difficile à lire pour quelqu'un qui n'a pas travaillé sur le projet. Angular impose une convention unique : **tous les projets Angular se ressemblent structurellement**, ce qui facilite la maintenance en équipe.

### Angular 17 Standalone spécifiquement

Angular 17 introduit les **Standalone Components** — la direction moderne du framework :

- Plus de `NgModule` complexes qui alourdissaient la compréhension
- Chaque composant déclare ses propres dépendances directement
- Les **Signals** (nouveauté Angular 17) remplacent `useState` React de façon plus performante et plus lisible
- Le **lazy-loading** par route réduit le bundle initial et accélère le chargement

```typescript
// Angular 17 Standalone — moderne, propre, auto-suffisant
@Component({
  selector: 'app-chat',
  standalone: true,              // ← pas besoin de NgModule
  imports: [CommonModule],       // ← dépendances déclarées ici directement
  templateUrl: './chat.component.html'
})
export class ChatComponent {
  messages = signal<Message[]>([]); // ← Signal = state réactif moderne
}
```

---

## 3. Pourquoi PostgreSQL et pas garder l'in-memory ?

### Le problème de la base in-memory (db.js original)

```javascript
// db.js — données Node.js originales
const users = [
  { id: 'u1', username: 'admin', ... }
];
const messages = [];  // tout en RAM JavaScript
```

**Ce que ça signifie concrètement en production :**

- Tu redémarres le serveur → **toutes les conversations sont perdues**
- Deux instances du serveur (scalabilité) → **deux bases de données différentes**
- 10 000 messages accumulés → tout est **en RAM** → le serveur finit par crasher
- Recherche dans les messages → `array.filter()` qui parcourt tout → lent

### PostgreSQL résout tout ça

| Critère | In-Memory (db.js) | PostgreSQL |
|---|---|---|
| **Persistance** | Perdu au redémarrage | Permanent sur disque |
| **Concurrence** | Race conditions possibles | Transactions ACID garanties |
| **Scalabilité** | Limité à la RAM du serveur | Billions de lignes |
| **Recherche** | `array.filter()` — O(n) | Index B-tree — O(log n) |
| **Relations** | Jointures manuelles en JS | `JOIN` SQL natif optimisé |
| **Backup** | Impossible | `pg_dump` automatisable |
| **Multi-serveur** | Impossible | Connexion partagée entre serveurs |
| **Intégrité** | Aucune contrainte | `UNIQUE`, `NOT NULL`, `FOREIGN KEY` |

### Pourquoi PostgreSQL plutôt que MySQL ou MongoDB ?

**Pourquoi pas MySQL ?**
PostgreSQL est plus conforme au standard SQL, supporte mieux les types de données complexes (JSON natif pour les réactions), et offre des transactions plus robustes. C'est aussi le choix dominant en entreprise française et en cloud (AWS RDS, Supabase, Render).

**Pourquoi pas MongoDB ?**
MongoDB est une base **document** (NoSQL). Elle est adaptée quand les données n'ont pas de structure fixe. Mais AlertMNS a des données **relationnelles par nature** :

```
Un message APPARTIENT À un channel
Un message EST ÉCRIT PAR un user
Un channel A DES membres (users)
```

Ces relations s'expriment naturellement en SQL avec des `JOIN`. Les forcer dans MongoDB reviendrait à recréer SQL manuellement, en moins performant.

### Migration H2 → PostgreSQL : zéro changement de code

L'application utilise actuellement **H2 in-memory** (fidèle à l'original) mais passer à PostgreSQL ne nécessite que 3 lignes dans `application.properties` :

```properties
# Avant (H2)
spring.datasource.url=jdbc:h2:mem:alertmns
spring.datasource.driver-class-name=org.h2.Driver

# Après (PostgreSQL) — même entités JPA, même repositories, même services
spring.datasource.url=jdbc:postgresql://localhost:5432/alertmns
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=alertmns_user
spring.datasource.password=motdepasse
```

C'est la puissance de l'abstraction JPA : **le code métier ne connaît pas la base de données**.

---

## 4. Pourquoi cette structure en couches ?

```
Requête HTTP / WebSocket
        │
        ▼
┌───────────────────┐
│   CONTROLLER      │  ← Mapping HTTP uniquement (pas de logique)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│    SERVICE        │  ← Toute la logique métier (transactions, règles)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   REPOSITORY      │  ← Accès données uniquement (queries SQL)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│    BASE DE        │
│    DONNÉES        │
└───────────────────┘
```

C'est le pattern **MVC étendu**, le standard de l'industrie depuis 20 ans. Voici pourquoi chaque couche existe séparément :

### Le Controller — *uniquement le mapping HTTP*

```java
@PostMapping("/channels")
public ResponseEntity<ChannelResponse> createChannel(
        @AuthenticationPrincipal UserDetails userDetails,
        @Valid @RequestBody CreateChannelRequest request) {
    // Reçoit → valide → appelle le service → retourne la réponse
    return ResponseEntity.status(201).body(
        channelService.createChannel(request, extractId(userDetails)));
}
```

Si le controller contenait de la logique (comme dans `routes/channels.js` Node.js qui vérifiait les permissions directement), tu ne pourrais pas **réutiliser** cette logique dans un WebSocket, un job planifié, ou une commande CLI.

### Le Service — *toute la logique métier*

```java
@Service
@Transactional  // ← Si quelque chose échoue au milieu, tout est annulé
public class ChannelService {
    public ChannelResponse createChannel(CreateChannelRequest request, UUID creatorId) {
        // Vérification unicité du nom
        // Création du canal
        // Ajout automatique du créateur aux membres si privé
        // etc.
    }
}
```

### Le Repository — *uniquement l'accès aux données*

```java
@Repository
public interface ChannelRepository extends JpaRepository<Channel, UUID> {
    // Spring génère automatiquement le SQL à partir de la signature
    @Query("SELECT DISTINCT c FROM Channel c LEFT JOIN c.members m
            WHERE c.isPrivate = false OR m.id = :userId")
    List<Channel> findAccessibleChannels(UUID userId);
}
```

### Pourquoi cette séparation concrètement ?

```
Scénario 1 — On ajoute une API mobile (REST différent) ?
  → Nouveau Controller, MÊME Service → zéro réécriture de la logique

Scénario 2 — On migre de H2 vers PostgreSQL ?
  → Nouveau driver, MÊME Repository → zéro réécriture des requêtes

Scénario 3 — On veut tester la logique métier automatiquement ?
  → On mock le Repository, on teste le Service → tests rapides et fiables

Scénario 4 — Un développeur junior reprend le projet ?
  → Structure identique à 99% des projets Spring Boot → courbe d'apprentissage minimale
```

---

## 5. Pourquoi JWT et pas des sessions ?

### Sessions traditionnelles — le problème

```
Client ──→ Serveur A : "connecte-moi"
Serveur A : crée session_42 en mémoire → renvoie cookie session_id=42

Requête suivante :
Client ──→ Serveur B (load balancer) : cookie session_id=42
Serveur B : "je ne connais pas la session 42" → DÉCONNECTÉ
```

Les sessions nécessitent que **toutes les requêtes arrivent sur le même serveur**, ou un stockage partagé (Redis) — c'est de la complexité supplémentaire.

### JWT — notre choix

```
Client ──→ Serveur : "login avec admin/admin123"
Serveur : génère token signé → "eyJhbGciOiJIUzI1NiJ9..."

Requête suivante :
Client ──→ N'IMPORTE QUEL serveur : header "Authorization: Bearer eyJ..."
Serveur : vérifie la signature mathématique → valide → accès accordé
          (pas besoin de base de données pour vérifier)
```

| Critère | Sessions | JWT |
|---|---|---|
| **Stockage serveur** | Oui (mémoire ou Redis) | Non (stateless) |
| **Scalabilité** | Problématique (sticky sessions) | Parfaite (n'importe quel serveur) |
| **WebSocket** | Cookie non transmis | Token transmis dans le header STOMP |
| **Mobile/API** | Cookie navigateur uniquement | Header Authorization universel |
| **Expiration** | Gérée manuellement | Intégrée dans le token (`exp`) |

**Le même JWT authentifie les deux canaux de communication** :
- Requêtes HTTP REST → `Authorization: Bearer {token}` (header HTTP)
- Connexion WebSocket STOMP → `Authorization: Bearer {token}` (header STOMP CONNECT)

---

## 6. Pourquoi STOMP et pas Socket.io ?

### Le problème de Socket.io avec Java

Socket.io est une bibliothèque **JavaScript propriétaire**. Elle n'a pas d'équivalent natif en Java. Pour l'utiliser avec Spring Boot, il faudrait une librairie tierce non officielle, pas maintenue, et incompatible avec Spring Security.

### STOMP — le protocole standard

**STOMP** (Simple Text Oriented Messaging Protocol) est un protocole de messagerie standard qui fonctionne sur WebSocket. Spring Boot le supporte nativement.

```
Socket.io (Node.js uniquement) :
  socket.emit('message:new', data)           // API propriétaire JavaScript
  socket.on('message:new', callback)

STOMP (standard, Java + Angular + tout) :
  stompClient.publish('/app/chat.send', ...) // standard industriel
  stompClient.subscribe('/topic/channel.1')  // fonctionne partout
```

### Avantages concrets de STOMP

**1. Intégration Spring Security**
```java
// Le Principal (utilisateur authentifié) est injecté automatiquement
@MessageMapping("/chat.send")
public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
    UUID authorId = UUID.fromString(principal.getName()); // UUID depuis JWT
    // ...
}
```

Avec Socket.io + Node.js, cette vérification était manuelle dans chaque handler.

**2. Topics structurés**
```
/topic/channel.{id}           → tous les abonnés du canal reçoivent le message
/topic/users                  → broadcast des statuts (tous les utilisateurs)
/user/queue/notifications     → message privé (uniquement le destinataire)
```

**3. Scalabilité vers RabbitMQ/Kafka**

En production avec des milliers d'utilisateurs simultanés, changer le broker est trivial :

```properties
# Développement : broker simple intégré (notre cas actuel)
# Aucune config supplémentaire

# Production avec RabbitMQ (1 million de connexions) :
spring.rabbitmq.host=rabbitmq.production.fr
# → Zéro changement dans WebSocketController.java
```

---

## 7. Résumé en une phrase par choix

| Technologie | Pourquoi |
|---|---|
| **Java** | Fiabilité, performance, typage fort, sécurité industrielle |
| **Spring Boot** | Convention over configuration, écosystème cohérent, déploiement en un JAR |
| **Angular** | Framework complet natif (pas d'assemblage de librairies), TypeScript strict, standard en entreprise |
| **PostgreSQL** | Persistance réelle, transactions ACID, scalable, le plus utilisé en France |
| **JWT** | Stateless, scalable horizontalement, fonctionne HTTP et WebSocket avec le même token |
| **STOMP** | Protocole standard Java-natif, intégration Spring Security, évolutif vers Kafka/RabbitMQ |
| **Architecture en couches** | Testabilité, réutilisabilité, maintenabilité à long terme, standard universel |
| **DTO / Records Java** | Isolation totale entre l'API et la base de données, le `passwordHash` ne sort jamais |
| **Signals Angular 17** | État réactif plus performant que `useState`, détection de changements granulaire |
| **CSS Custom Properties** | Variables CSS pour le thème dark/light, basculement sans rechargement, persistance localStorage |

---

## En conclusion

Cette stack n'a pas été choisie pour être complexe. Elle a été choisie parce que **chaque élément résout un problème réel** que l'application Node.js/React originale avait ou aurait rencontré en production :

- Les données disparaissaient → **PostgreSQL**
- La sécurité était manuelle → **Spring Security + JWT**
- Le typage était absent → **Java + TypeScript strict**
- Le temps réel n'était pas scalable → **STOMP + Spring WebSocket**
- L'architecture n'était pas maintenable → **Couches Controller/Service/Repository**

C'est la différence entre un projet scolaire et une application prête pour l'entreprise.

---

*AlertMNS — Metz Numeric School — 2026*
