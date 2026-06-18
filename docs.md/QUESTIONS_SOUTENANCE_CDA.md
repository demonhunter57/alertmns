# 50 Questions — Soutenance Titre Professionnel
## Concepteur Développeur d'Applications (CDA — RNCP 37873)

> **Niveau** : Bac+3 / Niveau 6  
> **Durée de l'oral** : 2h15 (présentation + questions jury)  
> **Jury** : 2 à 3 professionnels du secteur  
> **Projet de référence** : AlertMNS — Messagerie interne sécurisée  
> Stack : Java 21 · Spring Boot 3 · Angular 17 · H2 in-memory (dev) · PostgreSQL (cible v2.0) · JWT · STOMP WebSocket

---

## TABLE DES MATIÈRES

- [BLOC 1 — Architecture & Conception (Q1 à Q12)](#bloc-1--architecture--conception)
- [BLOC 2 — Base de données & ACID (Q13 à Q20)](#bloc-2--base-de-données--acid)
- [BLOC 3 — Méthodes Agile (Q21 à Q28)](#bloc-3--méthodes-agile)
- [BLOC 4 — CRUD & API REST (Q29 à Q35)](#bloc-4--crud--api-rest)
- [BLOC 5 — Sécurité & Authentification (Q36 à Q41)](#bloc-5--sécurité--authentification)
- [BLOC 6 — Programmation Objet & Design Patterns (Q42 à Q46)](#bloc-6--programmation-objet--design-patterns)
- [BLOC 7 — Questions Projet AlertMNS (Q47 à Q48)](#bloc-7--questions-projet-alertmns)
- [BLOC 8 — Questions en Anglais (Q49 à Q50)](#bloc-8--questions-en-anglais)

---

## BLOC 1 — Architecture & Conception

---

### Q1. Qu'est-ce que le modèle MVC et pourquoi l'avez-vous utilisé dans votre projet ?

**MVC** (Model-View-Controller) est un patron d'architecture logicielle qui sépare une application en trois composants distincts ayant chacun une responsabilité unique.

- **Model** : représente les données et la logique métier. Dans AlertMNS, ce sont les entités JPA (`User`, `Channel`, `Message`) et les services (`AuthService`, `ChannelService`).
- **View** : représente l'interface utilisateur. Dans AlertMNS, c'est l'application Angular (composants HTML/SCSS).
- **Controller** : fait le lien entre le Model et la View, reçoit les requêtes et retourne les réponses. Dans AlertMNS, ce sont les classes `@RestController` Spring Boot.

**Pourquoi l'avoir utilisé ?**

- **Séparation des responsabilités** : chaque couche ne fait qu'une chose → code plus lisible et maintenable
- **Testabilité** : on peut tester le Model sans la View et inversement
- **Travail en équipe** : un développeur front peut travailler sur la View pendant qu'un développeur back travaille sur le Model, sans conflit
- **Évolutivité** : on peut changer le framework front (React → Angular) sans toucher au backend

Dans Spring Boot, le MVC est étendu en **MVC + Service + Repository**, qui est le standard de l'industrie :
```
Controller → Service → Repository → Base de données
```

---

### Q2. Expliquez la différence entre une architecture monolithique et une architecture microservices.

**Architecture Monolithique**

Toute l'application est un seul bloc déployé ensemble. C'est le choix d'AlertMNS.

```
┌──────────────────────────────────┐
│         Application Monolithe    │
│  Auth | Channels | Messages |    │
│  Users | Export | WebSocket      │
└──────────────────────────────────┘
         Un seul déploiement (JAR)
```

✅ **Avantages** : Simple à développer, déployer, déboguer. Moins de latence réseau entre les modules.  
❌ **Inconvénients** : Si un module plante, toute l'app plante. Scalabilité totale ou rien.

---

**Architecture Microservices**

Chaque fonctionnalité est un service indépendant avec sa propre base de données.

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Auth    │  │ Messages │  │  Users   │
│ Service  │  │ Service  │  │ Service  │
└──────────┘  └──────────┘  └──────────┘
   BDD Auth    BDD Messages   BDD Users
```

✅ **Avantages** : Scalabilité indépendante (scaler uniquement le service Messages), déploiement continu sans affecter les autres services, technologie différente par service.  
❌ **Inconvénients** : Complexité réseau, transactions distribuées difficiles à gérer, infrastructure lourde (Kubernetes, API Gateway, service discovery).

**Pourquoi AlertMNS est monolithique ?**  
C'est un projet d'école avec une équipe réduite. Les microservices auraient ajouté une complexité opérationnelle injustifiée pour la taille du projet. La règle est : on commence monolithique, on découpe en microservices quand la douleur est réelle, pas par anticipation.

---

### Q3. Qu'est-ce qu'une API REST ? Quels sont ses principes fondamentaux ?

**REST** (Representational State Transfer) est un style d'architecture pour les APIs web, défini par Roy Fielding en 2000. Ce n'est pas un protocole — c'est un ensemble de contraintes architecturales.

**Les 6 contraintes REST :**

**1. Stateless (Sans état)**
Chaque requête contient toutes les informations nécessaires. Le serveur ne garde aucun état de session entre les requêtes. Dans AlertMNS, c'est garanti par JWT : le token contient l'identité de l'utilisateur.

**2. Interface uniforme**
Les ressources sont identifiées par des URLs cohérentes :
```
GET    /api/channels          ← lire tous les canaux
POST   /api/channels          ← créer un canal
GET    /api/channels/{id}     ← lire un canal spécifique
PATCH  /api/channels/{id}     ← modifier partiellement
DELETE /api/channels/{id}     ← supprimer
```

**3. Client-Serveur**
Le client et le serveur sont indépendants. Angular peut être remplacé par React ou une app mobile sans changer l'API.

**4. Cacheable**
Les réponses peuvent être mises en cache. Le serveur indique si une réponse est cacheable via les headers HTTP (`Cache-Control`).

**5. Système en couches**
Le client ne sait pas s'il parle directement au serveur ou à un intermédiaire (load balancer, CDN, API Gateway).

**6. Code à la demande (optionnel)**
Le serveur peut envoyer du code exécutable au client (ex: JavaScript).

**Les codes HTTP standards :**
| Code | Signification |
|---|---|
| 200 OK | Succès lecture/modification |
| 201 Created | Ressource créée |
| 204 No Content | Suppression réussie |
| 400 Bad Request | Données invalides |
| 401 Unauthorized | Non authentifié |
| 403 Forbidden | Authentifié mais non autorisé |
| 404 Not Found | Ressource inexistante |
| 409 Conflict | Doublon (username déjà pris) |
| 500 Internal Server Error | Erreur serveur |

---

### Q4. Qu'est-ce que le principe SOLID ? Expliquez chaque lettre.

SOLID est un acronyme de 5 principes de conception orientée objet formulés par Robert C. Martin (Uncle Bob).

**S — Single Responsibility Principle (Responsabilité unique)**
Une classe ne doit avoir qu'une seule raison de changer.  
✅ Dans AlertMNS : `AuthService` gère uniquement l'authentification. `ChannelService` gère uniquement les canaux. Ils ne font pas les deux.

**O — Open/Closed Principle (Ouvert/Fermé)**
Une classe doit être ouverte à l'extension mais fermée à la modification.  
✅ On peut ajouter un nouveau type d'export (PDF) dans `ExportService` sans modifier le code existant des exports JSON/CSV/XML.

**L — Liskov Substitution Principle (Substitution de Liskov)**
Un objet d'une classe dérivée doit pouvoir remplacer un objet de la classe parente sans altérer le comportement.  
✅ `UserDetailsServiceImpl` implémente `UserDetailsService` de Spring Security — Spring peut utiliser notre implémentation exactement comme il utiliserait la sienne.

**I — Interface Segregation Principle (Ségrégation des interfaces)**
Mieux vaut plusieurs interfaces spécialisées qu'une seule interface générale.  
✅ `UserRepository` n'expose que les méthodes liées aux utilisateurs. `ChannelRepository` n'expose que les méthodes liées aux canaux.

**D — Dependency Inversion Principle (Inversion des dépendances)**
Les modules de haut niveau ne doivent pas dépendre des modules de bas niveau. Les deux doivent dépendre d'abstractions.  
✅ `AuthService` dépend de l'interface `UserRepository` (abstraction Spring Data), pas de l'implémentation SQL concrète. Si on change de base de données, `AuthService` ne change pas.

---

### Q5. Qu'est-ce que l'injection de dépendances ? Comment Spring Boot la gère-t-il ?

**L'injection de dépendances (DI)** est un pattern de conception où une classe reçoit ses dépendances de l'extérieur plutôt que de les créer elle-même.

**Sans injection de dépendances :**
```java
public class AuthService {
    private UserRepository userRepository;

    public AuthService() {
        this.userRepository = new UserRepository(); // ← couplage fort, non testable
    }
}
```

**Avec injection de dépendances (Spring Boot) :**
```java
@Service
@RequiredArgsConstructor // ← Lombok génère le constructeur avec les dépendances
public class AuthService {
    private final UserRepository userRepository; // ← injecté par Spring
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
}
```

**Comment Spring Boot gère la DI :**

Spring Boot utilise un **conteneur IoC (Inversion of Control)** qui :
1. Scanne les classes annotées `@Service`, `@Repository`, `@Controller`, `@Component`
2. Les instancie une seule fois (singleton par défaut)
3. Résout les dépendances automatiquement en regardant les types des paramètres
4. Injecte les dépendances via le constructeur (méthode recommandée)

**Pourquoi c'est important ?**
- **Testabilité** : on peut injecter des mocks en test pour simuler la base de données
- **Faible couplage** : `AuthService` ne sait pas quelle implémentation de `UserRepository` il utilise
- **Réutilisabilité** : le même service peut être injecté dans plusieurs controllers

---

### Q6. Quelle est la différence entre `@RestController` et `@Controller` dans Spring Boot ?

**`@Controller`** (Spring MVC classique)
Retourne le nom d'une **vue** (template HTML Thymeleaf, JSP). Utilisé pour les applications web avec rendu côté serveur.

```java
@Controller
public class PageController {
    @GetMapping("/accueil")
    public String accueil(Model model) {
        model.addAttribute("titre", "AlertMNS");
        return "accueil"; // ← nom du template HTML
    }
}
```

**`@RestController`** (API REST)
Retourne directement des **données** (JSON, XML) sérialisées par Jackson. C'est `@Controller` + `@ResponseBody` sur chaque méthode.

```java
@RestController
@RequestMapping("/api/channels")
public class ChannelController {
    @GetMapping
    public ResponseEntity<List<ChannelResponse>> getChannels() {
        return ResponseEntity.ok(service.getChannels()); // ← JSON automatique
    }
}
```

**Dans AlertMNS**, tout est `@RestController` car l'application est une **SPA** (Single Page Application) : Angular gère le rendu HTML, Spring Boot fournit uniquement les données via JSON.

---

### Q7. Qu'est-ce que la programmation orientée objet ? Expliquez ses 4 piliers.

La **POO (Programmation Orientée Objet)** est un paradigme de programmation qui organise le code autour d'**objets** qui combinent données (attributs) et comportements (méthodes).

**1. Encapsulation**
Cacher les détails internes d'un objet et n'exposer que ce qui est nécessaire via une interface publique.

```java
public class User {
    private String passwordHash; // ← privé : jamais accessible directement

    // Pas de getPasswordHash() dans UserResponse — le hash ne sort jamais de l'API
    public String getDisplayName() { return displayName; } // ← seul le nom est exposé
}
```

**2. Héritage**
Une classe peut hériter des attributs et méthodes d'une classe parente.

```java
// Spring Security — notre UserDetailsServiceImpl hérite du comportement
public class UserDetailsServiceImpl implements UserDetailsService {
    // On hérite du contrat d'interface et on fournit notre implémentation
}
```

**3. Polymorphisme**
Un même appel de méthode peut avoir des comportements différents selon le type réel de l'objet.

```java
// ExportService : même méthode appelée, comportement différent selon le format
exportService.export("json"); // → ObjectMapper Jackson
exportService.export("csv");  // → StringBuilder manuel
exportService.export("xml");  // → StringBuilder XML
```

**4. Abstraction**
Cacher la complexité d'implémentation et n'exposer que l'essentiel.

```java
// L'interface Repository cache toute la complexité SQL
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    // On appelle findByUsername() sans savoir qu'il y a du SQL derrière
}
```

---

### Q8. Qu'est-ce qu'un design pattern ? Citez-en 3 utilisés dans votre projet.

Un **design pattern** (patron de conception) est une solution éprouvée et réutilisable à un problème récurrent de conception logicielle. Ce ne sont pas du code, mais des **modèles de structure**.

Ils sont classifiés en 3 catégories par le livre "Gang of Four" (GoF, 1994) :
- **Créationnels** : comment créer des objets
- **Structuraux** : comment organiser les classes
- **Comportementaux** : comment les objets interagissent

**3 patterns utilisés dans AlertMNS :**

**1. Builder Pattern (Créationnel)**  
Construit un objet complexe étape par étape. Lombok `@Builder` l'implémente automatiquement.
```java
User user = User.builder()
    .username("admin")
    .email("admin@alertmns.fr")
    .role(UserRole.ADMIN)
    .status(UserStatus.OFFLINE)
    .build();
```
Évite un constructeur avec 10 paramètres qui serait illisible.

**2. Repository Pattern (Structurel)**  
Abstrait l'accès aux données derrière une interface. Spring Data JPA l'implémente.
```java
// Le service ne sait pas si c'est H2, PostgreSQL ou MongoDB derrière
userRepository.findByUsername("admin"); // ← appel simple
```

**3. DTO Pattern (Structurel)**  
Transfère uniquement les données nécessaires entre les couches, sans exposer les entités internes.
```java
// L'entité User a passwordHash — le DTO UserResponse ne l'a pas
UserResponse.from(user) // ← conversion sécurisée, passwordHash absent
```

---

### Q9. Quelle est la différence entre une interface et une classe abstraite en Java ?

| Critère | Interface | Classe Abstraite |
|---|---|---|
| **Héritage** | Une classe peut implémenter **plusieurs** interfaces | Une classe ne peut étendre qu'**une seule** classe abstraite |
| **État** | Pas d'attributs d'instance | Peut avoir des attributs |
| **Constructeur** | Non | Oui |
| **Méthodes** | Abstraites par défaut (+ `default` depuis Java 8) | Mixte : abstraites + concrètes |
| **Usage** | Définir un contrat comportemental | Partager du code entre classes liées |

**Dans AlertMNS :**
```java
// Interface : contrat que UserDetailsServiceImpl doit respecter
public interface UserDetailsService {
    UserDetails loadUserByUsername(String username);
}

// Notre implémentation respecte ce contrat
public class UserDetailsServiceImpl implements UserDetailsService {
    @Override
    public UserDetails loadUserByUsername(String userId) { ... }
}
```

**Règle de décision :**
- Tu définis un **comportement commun** à des classes non liées → **Interface**
- Tu partages du **code commun** entre des classes du même domaine → **Classe abstraite**

---

### Q10. Qu'est-ce que le WebSocket et en quoi diffère-t-il du HTTP classique ?

**HTTP classique — protocole requête/réponse**

```
Client ──→ "GET /messages"  ──→ Serveur
Client ←── "200 OK + data" ←── Serveur
         (connexion fermée)
```

Le client doit **toujours initier** la communication. Pour obtenir des mises à jour, il doit demander régulièrement (**polling**) : "y a-t-il de nouveaux messages ?" toutes les X secondes — inefficace.

**WebSocket — connexion persistante bidirectionnelle**

```
Client ──→ "Upgrade: websocket" ──→ Serveur  (handshake unique via HTTP)
                │
    Connexion TCP persistante établie
                │
Serveur ──→ "nouveau message !"  ──→ Client  (push temps réel)
Client  ──→ "j'envoie un message" ──→ Serveur
Serveur ──→ "quelqu'un tape..." ──→ Client
```

Une fois la connexion établie, **le serveur peut envoyer des données sans que le client ne les demande**.

**Comparaison :**

| Critère | HTTP | WebSocket |
|---|---|---|
| **Connexion** | Nouvelle à chaque requête | Persistante |
| **Direction** | Unidirectionnelle (client → serveur) | Bidirectionnelle |
| **Latence** | Haute (overhead TCP par requête) | Très basse (connexion déjà ouverte) |
| **Usage** | CRUD, lecture de données | Chat, notifications, jeux, trading |

**STOMP sur WebSocket (AlertMNS) :**  
STOMP est une couche de protocole de messagerie au-dessus de WebSocket. Il ajoute des concepts de topics, subscriptions et messages structurés, ce que WebSocket brut ne fournit pas.

---

### Q11. Qu'est-ce que le lazy loading et pourquoi l'utilisez-vous en Angular ?

Le **lazy loading** (chargement différé) consiste à ne charger le code JavaScript d'une page/module **que quand l'utilisateur en a besoin**, pas au démarrage de l'application.

**Sans lazy loading :**
```
Utilisateur ouvre l'app
→ Angular télécharge TOUT le JavaScript (login + chat + admin + export + ...)
→ Bundle initial : 2MB
→ Temps de chargement : 5 secondes
```

**Avec lazy loading (AlertMNS) :**
```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
                          .then(m => m.LoginComponent)
    // ↑ Le code de LoginComponent n'est téléchargé que si l'utilisateur
    //   navigue vers /login
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component')
                          .then(m => m.ChatComponent)
    // ↑ Idem pour /chat
  }
];
```

```
Utilisateur ouvre l'app
→ Angular télécharge seulement le core (routeur, services)
→ Bundle initial : 200KB
→ Temps de chargement : 0.5 secondes
→ Le code de /chat se télécharge uniquement quand l'utilisateur se connecte
```

**Avantages :**
- Chargement initial ultra-rapide
- Meilleur score Google PageSpeed
- Les utilisateurs qui ne vont jamais sur une page ne téléchargent pas son code

---

### Q12. Qu'est-ce que le principe DRY et comment l'appliquez-vous ?

**DRY = Don't Repeat Yourself** (Ne te répète pas).

Formulé par Andrew Hunt et David Thomas dans "The Pragmatic Programmer" (1999) :  
> *"Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."*

**Le problème de la répétition :**
```java
// ❌ Mauvais — même code de mapping dans chaque controller
UUID userId = UUID.fromString(userDetails.getUsername()); // répété 5 fois
```

**Application DRY dans AlertMNS :**
```java
// ✅ Bon — méthode privée réutilisable dans chaque controller
private UUID extractId(UserDetails userDetails) {
    return UUID.fromString(userDetails.getUsername());
}
```

**Autres applications DRY :**
- `UserResponse.from(User)` : la conversion entité → DTO est définie **une seule fois**
- `ErrorResponse.of(status, message)` : la création d'erreur est centralisée dans `GlobalExceptionHandler`
- Les styles SCSS communs (couleurs, boutons) sont définis dans `styles.scss` global

**DRY vs WET (Write Everything Twice) :**  
Un code WET est un code où la même logique est copiée-collée à plusieurs endroits. Si cette logique doit changer, tu dois modifier tous les endroits → risque d'oubli → bugs.

---

## BLOC 2 — Base de données & ACID

---

### Q13. Qu'est-ce que les propriétés ACID d'une transaction ? Expliquez chacune.

**ACID** est un acronyme qui définit les 4 propriétés garantissant la fiabilité des transactions dans une base de données relationnelle. PostgreSQL, MySQL et H2 implémentent toutes ACID.

---

**A — Atomicité (Atomicity)**

Une transaction est **tout ou rien**. Si une opération échoue au milieu d'une transaction, toutes les opérations précédentes sont annulées (rollback).

```
Exemple : transfert bancaire de 100€ de Alice vers Bob
  1. Débiter Alice de 100€  ✅
  2. Créditer Bob de 100€   ❌ (panne serveur)

SANS atomicité : Alice perd 100€, Bob ne reçoit rien → catastrophe
AVEC atomicité : la transaction entière est annulée → Alice garde ses 100€
```

Dans AlertMNS :
```java
@Transactional  // ← si une étape échoue, tout est annulé
public LoginResponse register(RegisterRequest request) {
    // 1. Vérifier unicité username
    // 2. Créer l'utilisateur
    // 3. Sauvegarder
    // Si l'étape 3 échoue, l'étape 2 est annulée → pas de demi-inscription
}
```

---

**C — Cohérence (Consistency)**

Une transaction amène la base de données d'un état **valide** à un autre état **valide**. Les contraintes définies (clés étrangères, NOT NULL, UNIQUE) sont toujours respectées.

```
Exemple AlertMNS :
  - La contrainte UNIQUE sur username est définie
  - Une transaction qui crée un username déjà existant sera REJETÉE
  - La base reste dans un état cohérent (pas de doublon)
```

---

**I — Isolation (Isolation)**

Les transactions concurrentes s'exécutent comme si elles étaient **séquentielles**. Une transaction en cours n'est pas visible des autres transactions tant qu'elle n'est pas terminée.

```
Scénario sans isolation :
  Transaction A lit le stock = 1
  Transaction B lit le stock = 1
  Transaction A commande → stock = 0
  Transaction B commande → stock = -1  ← IMPOSSIBLE normalement

Avec isolation : Transaction B attend que A finisse avant de lire le stock
```

Les niveaux d'isolation (du moins strict au plus strict) :
- `READ UNCOMMITTED` : lit les données non commitées (dirty read possible)
- `READ COMMITTED` : lit uniquement les données commitées (défaut PostgreSQL)
- `REPEATABLE READ` : la même lecture retourne toujours le même résultat
- `SERIALIZABLE` : isolation totale — transactions séquentielles

---

**D — Durabilité (Durability)**

Une fois une transaction **committée** (validée), les données sont **persistées définitivement**, même en cas de panne serveur ou de coupure de courant.

```
PostgreSQL utilise un WAL (Write-Ahead Log) :
→ Chaque opération est d'abord écrite dans un journal (log)
→ En cas de crash, PostgreSQL rejoue le journal pour récupérer les données
→ Une transaction committée ne sera jamais perdue
```

> ⚠️ **AlertMNS v1 utilise H2 in-memory** : H2 garantit l'ACID dans la session (atomicité, cohérence, isolation), mais les données sont perdues au redémarrage car tout est en RAM. La durabilité complète avec WAL s'appliquera lors de la migration PostgreSQL (v2.0).

---

### Q14. Quelle est la différence entre une clé primaire et une clé étrangère ?

**Clé Primaire (Primary Key)**

Identifiant **unique** et **non-null** qui identifie chaque ligne d'une table. Chaque table a exactement une clé primaire.

```sql
-- Table users : id est la clé primaire
CREATE TABLE users (
    id UUID PRIMARY KEY,  -- unique, non-null, identifie chaque user
    username VARCHAR(50) UNIQUE NOT NULL,
    ...
);
```

Dans AlertMNS, toutes les entités utilisent un **UUID** comme clé primaire (pas un entier auto-incrémenté) pour :
- Éviter les collisions lors de migrations de données
- Permettre la génération d'ID côté client si nécessaire
- Sécurité : les IDs numériques séquentiels permettent l'énumération (1, 2, 3...)

**Clé Étrangère (Foreign Key)**

Référence la clé primaire d'une **autre table**, créant une relation entre les deux tables.

```sql
-- Table messages : author_id référence users.id
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL,           -- pas de FK ici (design choisi)
    author_id UUID NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id)  -- ← clé étrangère
);
```

**Garantie apportée par la FK :** on ne peut pas insérer un message avec un `author_id` qui n'existe pas dans `users`. L'intégrité référentielle est garantie par la base de données.

---

### Q15. Qu'est-ce qu'une jointure SQL ? Expliquez les différents types.

Une **jointure (JOIN)** permet de combiner des données de plusieurs tables dans une seule requête.

**INNER JOIN** — Retourne uniquement les lignes qui ont une correspondance dans les deux tables.
```sql
SELECT m.content, u.display_name
FROM messages m
INNER JOIN users u ON m.author_id = u.id;
-- Retourne uniquement les messages dont l'auteur existe encore en base
```

**LEFT JOIN** — Retourne toutes les lignes de la table gauche, et les correspondances de la table droite (NULL si pas de correspondance).
```sql
-- Utilisé dans ChannelRepository pour les canaux accessibles
SELECT DISTINCT c.*
FROM channels c
LEFT JOIN channel_members cm ON c.id = cm.channel_id
LEFT JOIN users u ON cm.user_id = u.id
WHERE c.is_private = false OR u.id = 'uuid-utilisateur';
-- Retourne TOUS les canaux publics même si pas de membres,
-- + les canaux privés dont l'utilisateur est membre
```

**RIGHT JOIN** — Inverse du LEFT JOIN. Rarement utilisé (on réécrit généralement en LEFT JOIN).

**FULL OUTER JOIN** — Retourne toutes les lignes des deux tables, NULL si pas de correspondance.

**CROSS JOIN** — Produit cartésien : chaque ligne de A combinée avec chaque ligne de B.
```
3 users × 4 channels = 12 lignes (rarement utile)
```

**Dans AlertMNS — JOIN FETCH (Hibernate) :**
```java
// Charge les messages ET leurs auteurs en une seule requête SQL
// Évite le problème N+1 (1 requête par message pour charger l'auteur)
@Query("SELECT m FROM Message m JOIN FETCH m.author WHERE m.channelId = :channelId")
```

---

### Q16. Qu'est-ce qu'un index de base de données et quand l'utilisez-vous ?

Un **index** est une structure de données séparée (généralement un B-tree) qui accélère les requêtes de recherche au prix d'un espace disque supplémentaire et d'un ralentissement des insertions.

**Sans index :**
```sql
SELECT * FROM messages WHERE channel_id = 'uuid-canal';
-- PostgreSQL scanne TOUTE la table ligne par ligne → O(n)
-- Avec 1 million de messages : lent
```

**Avec index :**
```sql
CREATE INDEX idx_messages_channel ON messages(channel_id);
-- PostgreSQL utilise l'index B-tree → O(log n)
-- Avec 1 million de messages : quasi-instantané
```

**Dans AlertMNS (JPA) :**
```java
@Entity
@Table(name = "messages",
       indexes = @Index(columnList = "channel_id, created_at"))
// ↑ Index composite sur channel_id + created_at
// Optimise la requête : "tous les messages du canal X triés par date"
```

**Quand créer un index ?**
- Colonnes utilisées dans les clauses `WHERE` fréquentes
- Colonnes utilisées dans les `JOIN`
- Colonnes utilisées dans `ORDER BY` sur de grands datasets

**Quand NE PAS créer d'index ?**
- Petites tables (moins de 1000 lignes) → le scan séquentiel est plus rapide
- Colonnes avec peu de valeurs distinctes (ex: un booléen `is_active`)
- Tables avec beaucoup d'insertions/mises à jour fréquentes

---

### Q17. Quelle est la différence entre SQL et NoSQL ?

| Critère | SQL (Relationnel) | NoSQL (Non-Relationnel) |
|---|---|---|
| **Structure** | Tables avec colonnes fixes | Documents, clé-valeur, graphes |
| **Schéma** | Fixe (défini à l'avance) | Flexible (schéma dynamique) |
| **Relations** | Jointures (FOREIGN KEY) | Dénormalisation / référencement |
| **Transactions** | ACID garanti | Eventual consistency (souvent) |
| **Requêtes** | SQL standard | API spécifique (MongoDB, Redis...) |
| **Scalabilité** | Verticale (+ de RAM/CPU) | Horizontale (+ de serveurs) |
| **Exemples** | PostgreSQL, MySQL, H2 | MongoDB, Redis, Cassandra |

**Quand choisir SQL (PostgreSQL pour AlertMNS) ?**
- Données structurées avec des relations claires (User → Message → Channel)
- Besoin de transactions ACID (intégrité des données critique)
- Requêtes complexes avec jointures multiples
- Données financières, médicales, administratives

**Quand choisir NoSQL ?**
- Données non structurées (logs, événements)
- Scalabilité horizontale massive (réseaux sociaux, IoT)
- Schéma qui change fréquemment
- Cache et sessions (Redis)

---

### Q18. Qu'est-ce que la normalisation d'une base de données ?

La **normalisation** est le processus d'organisation d'une base de données pour réduire la **redondance des données** et améliorer l'**intégrité des données**.

Elle est définie en plusieurs **formes normales** (1NF, 2NF, 3NF, BCNF...).

**1ère Forme Normale (1NF)**
Chaque cellule contient une valeur atomique (pas de listes, pas de tableaux).

```
❌ Non normalisé :
users: id=1, username="admin", channels="général, annonces, dev-team"

✅ 1NF :
users: id=1, username="admin"
channel_members: user_id=1, channel_id="c1"
channel_members: user_id=1, channel_id="c2"
```

**2ème Forme Normale (2NF)**
Respecte 1NF + chaque colonne non-clé dépend de **toute** la clé primaire.

**3ème Forme Normale (3NF)**
Respecte 2NF + pas de dépendance transitive entre colonnes non-clés.

**Dans AlertMNS :**
```
❌ Non normalisé :
messages: id, content, author_id, author_name, author_email
         ↑ author_name et author_email dépendent de author_id, pas de messages.id

✅ Normalisé (3NF) :
messages: id, content, author_id  ← uniquement la FK
users:    id, username, email, display_name  ← données utilisateur séparées
→ JOIN pour récupérer les infos de l'auteur
```

**Dénormalisation (compromis performances) :**  
Parfois on accepte une redondance contrôlée pour éviter des jointures coûteuses sur des requêtes très fréquentes. C'est un choix conscient, pas une erreur.

---

### Q19. Qu'est-ce qu'une procédure stockée ? Dans quel cas l'utiliseriez-vous ?

Une **procédure stockée** est du code SQL pré-compilé et stocké directement dans la base de données, exécutable par nom.

```sql
-- Exemple de procédure stockée PostgreSQL
CREATE OR REPLACE PROCEDURE clean_old_messages(days_old INT)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM messages
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    COMMIT;
END;
$$;

-- Appel
CALL clean_old_messages(90); -- supprime les messages de plus de 90 jours
```

**Avantages :**
- Performance : compilée une seule fois, exécutée plusieurs fois
- Sécurité : les utilisateurs peuvent exécuter une procédure sans avoir accès direct aux tables
- Réduction du trafic réseau : logique complexe exécutée côté serveur DB

**Inconvénients :**
- Logique métier dispersée entre l'application et la base de données
- Difficile à tester et à versionner (contrairement au code Java)
- Couplage fort avec le SGBD (migration PostgreSQL → MySQL complexifiée)

**Dans AlertMNS**, nous n'utilisons pas de procédures stockées. Toute la logique métier est dans les services Java (`@Service`), ce qui est plus testable, versionnable avec Git, et portable.

**Cas où on les utiliserait :**
- Migrations de données massives (des millions de lignes)
- Opérations de maintenance planifiées (archivage, nettoyage)
- Contraintes de performance extrêmes

---

### Q20. Qu'est-ce que l'ORM ? Quels sont ses avantages et inconvénients ?

**ORM (Object-Relational Mapping)** est une technique qui fait correspondre les objets Java (ou autre langage) aux tables d'une base de données relationnelle, sans écrire de SQL manuellement.

**Sans ORM :**
```java
PreparedStatement stmt = conn.prepareStatement(
    "SELECT id, username, email FROM users WHERE username = ?"
);
stmt.setString(1, username);
ResultSet rs = stmt.executeQuery();
User user = new User();
user.setId(UUID.fromString(rs.getString("id")));
user.setUsername(rs.getString("username"));
user.setEmail(rs.getString("email")); // ... 10 lignes pour un simple findByUsername
```

**Avec ORM (Hibernate via Spring Data JPA) :**
```java
Optional<User> user = userRepository.findByUsername(username);
// ← 1 ligne. Hibernate génère le SQL, mappe les colonnes, gère les types.
```

**Avantages de l'ORM :**
- Productivité : moins de code répétitif
- Sécurité : protection contre les injections SQL (paramètres bindés automatiquement)
- Portabilité : changer de PostgreSQL à MySQL = changer le driver
- Cohérence : le modèle objet et le schéma BD sont synchronisés

**Inconvénients de l'ORM :**
- Courbe d'apprentissage (Hibernate est complexe)
- Requêtes générées parfois inefficaces (problème N+1)
- Perte de contrôle sur le SQL exact
- Peut masquer des problèmes de performance

**Le problème N+1 et comment y remédier :**
```java
// ❌ N+1 : 1 requête pour les messages + N requêtes pour les auteurs
List<Message> messages = messageRepository.findByChannelId(channelId);
// Hibernate charge chaque auteur séparément → 51 requêtes pour 50 messages

// ✅ JOIN FETCH : 1 seule requête avec JOIN
@Query("SELECT m FROM Message m JOIN FETCH m.author WHERE m.channelId = :id")
```

---

## BLOC 3 — Méthodes Agile

---

### Q21. Qu'est-ce que la méthode Agile ? Quels sont ses 4 valeurs fondamentales ?

**Agile** est un ensemble de valeurs et de principes pour le développement logiciel, formalisé dans le **Manifeste Agile** signé en 2001 par 17 experts du développement. C'est une réponse aux méthodes traditionnelles (cascade/Waterfall) jugées trop rigides.

**Les 4 valeurs du Manifeste Agile :**

**1. Les individus et leurs interactions** > les processus et les outils
→ La communication directe entre développeurs et avec le client a plus de valeur que de suivre rigidement des processus documentés.

**2. Un logiciel fonctionnel** > une documentation exhaustive
→ Livrer une application qui tourne est plus important que d'avoir 200 pages de spécifications. La doc doit être utile, pas exhaustive.

**3. La collaboration avec le client** > la négociation contractuelle
→ Le client est impliqué tout au long du projet, pas seulement au début (spécifications) et à la fin (recette).

**4. L'adaptation au changement** > le suivi d'un plan
→ Les besoins évoluent. Un projet Agile s'adapte plutôt que de suivre un plan figé défini 6 mois à l'avance.

**Agile vs Waterfall :**

| Critère | Waterfall (Cascade) | Agile |
|---|---|---|
| **Planification** | Tout planifié à l'avance | Itérative (sprint par sprint) |
| **Livraison** | Une seule à la fin | Continue (chaque sprint) |
| **Changements** | Difficiles et coûteux | Intégrés naturellement |
| **Client** | Impliqué début + fin | Impliqué en continu |
| **Risque** | Élevé (problème découvert tard) | Faible (problèmes découverts tôt) |

---

### Q22. Qu'est-ce que Scrum ? Expliquez ses rôles, cérémonies et artefacts.

**Scrum** est le framework Agile le plus utilisé au monde. Il organise le développement en **Sprints** (itérations courtes de 1 à 4 semaines).

---

**LES 3 RÔLES SCRUM**

**Product Owner (PO)**
- Représente le client et les parties prenantes
- Définit et priorise le **Product Backlog** (liste des fonctionnalités)
- Décide ce qui entre dans chaque Sprint
- Valide que ce qui est livré correspond au besoin

**Scrum Master**
- Garant du processus Scrum
- Facilite les cérémonies (réunions)
- Protège l'équipe des interruptions extérieures
- Résout les obstacles (impediments)
- N'est PAS un chef de projet

**Development Team**
- Auto-organisée (décide comment faire le travail)
- Cross-fonctionnelle (devs, designers, testeurs)
- Généralement 3 à 9 personnes
- Collectivement responsable de la livraison

---

**LES 5 CÉRÉMONIES SCRUM**

**1. Sprint Planning** (début du sprint — 2h max pour un sprint de 2 semaines)
- L'équipe sélectionne les items du Product Backlog à réaliser
- Définit l'objectif du sprint (Sprint Goal)
- Décompose les items en tâches → Sprint Backlog

**2. Daily Scrum / Stand-up** (tous les jours — 15 minutes max)
- 3 questions : Qu'ai-je fait hier ? Que vais-je faire aujourd'hui ? Ai-je des obstacles ?
- Synchronisation rapide de l'équipe

**3. Sprint Review** (fin du sprint — 2h max)
- L'équipe présente les fonctionnalités terminées au Product Owner
- Démo du logiciel fonctionnel
- Le PO valide ou rejette les items

**4. Sprint Retrospective** (après la review — 1h30 max)
- L'équipe réfléchit à son processus : Qu'est-ce qui a bien marché ? Qu'améliorer ?
- Actions concrètes pour le prochain sprint

**5. Backlog Refinement** (en cours de sprint — continu)
- Affiner les user stories futures (estimation, détail)

---

**LES 3 ARTEFACTS SCRUM**

**Product Backlog**
Liste ordonnée par priorité de tout ce qui doit être fait sur le produit. Géré par le PO. Toujours en évolution.
```
Priorité 1 : Authentification des utilisateurs
Priorité 2 : Création de canaux
Priorité 3 : Envoi de messages
Priorité 4 : Réactions emoji
...
```

**Sprint Backlog**
Sous-ensemble du Product Backlog sélectionné pour le sprint en cours + les tâches associées.

**Incrément**
Le produit fonctionnel livrable à la fin de chaque sprint. Il doit respecter la **Definition of Done**.

---

### Q23. Qu'est-ce qu'une User Story ? Comment la rédiger correctement ?

Une **User Story** est une description courte d'une fonctionnalité vue du point de vue de l'utilisateur final. Elle se concentre sur le **qui, quoi et pourquoi**, pas sur le **comment**.

**Format standard :**
```
En tant que [persona/rôle utilisateur],
Je veux [action/fonctionnalité],
Afin de [bénéfice/valeur métier].
```

**Exemples pour AlertMNS :**

```
En tant qu'utilisateur,
Je veux pouvoir me connecter avec mon username et mot de passe,
Afin d'accéder à mes conversations sécurisées.

En tant qu'administrateur,
Je veux pouvoir créer des canaux privés,
Afin de restreindre les discussions sensibles à certains membres.

En tant qu'utilisateur,
Je veux voir en temps réel quand quelqu'un tape un message,
Afin de savoir qu'une réponse arrive et éviter les doublons.
```

**Les critères INVEST pour une bonne User Story :**
- **I**ndependent : réalisable indépendamment des autres
- **N**egotiable : les détails peuvent être discutés
- **V**aluable : apporte de la valeur à l'utilisateur
- **E**stimable : l'équipe peut estimer l'effort
- **S**mall : réalisable en un sprint
- **T**estable : on peut définir des critères d'acceptation

**Critères d'acceptation (Definition of Done de la story) :**
```
Story : Se connecter avec username/password
Critères d'acceptation :
  ✅ Si username/password corrects → JWT retourné + redirection vers /chat
  ✅ Si username inexistant → message "Identifiants invalides" (pas "username incorrect" pour sécurité)
  ✅ Si password incorrect → même message "Identifiants invalides"
  ✅ Le JWT expire après 7 jours
  ✅ Fonctionne sur Chrome, Firefox, Edge
```

---

### Q24. Qu'est-ce que le backlog et comment le prioriser ?

Le **Product Backlog** est la liste unique et ordonnée de tout ce qui doit être fait pour le produit. C'est la source unique de vérité sur les besoins.

**Il contient :**
- User Stories (fonctionnalités)
- Technical Stories (refactoring, migrations, dette technique)
- Bugs
- Spikes (exploration/recherche technique)

**Techniques de priorisation :**

**1. MoSCoW**
Classement des items en 4 catégories :
- **M**ust Have : indispensable (sans ça, le produit ne fonctionne pas)
- **S**hould Have : important mais pas critique
- **C**ould Have : utile si le temps le permet
- **W**on't Have (this time) : hors scope pour cette version

```
AlertMNS v1.0 :
Must Have   : Authentification, Canaux, Envoi de messages, Temps réel
Should Have : Réactions emoji, Statut utilisateur, Messages privés
Could Have  : Export des messages, Indicateur de frappe
Won't Have  : Appels vidéo, Intégration Slack
```

**2. Valeur vs Effort (matrice 2×2)**
```
         Effort faible   Effort fort
Valeur   ┌─────────────┬─────────────┐
haute    │  QUICK WIN  │  BIG BET    │
         │  Faire d'abord│ Planifier  │
Valeur   ├─────────────┼─────────────┤
basse    │  FILL IN    │  THANKLESS  │
         │ Si temps restant│ Éviter  │
         └─────────────┴─────────────┘
```

---

### Q25. Qu'est-ce que la vélocité en Scrum et comment la mesure-t-on ?

La **vélocité** est la quantité de travail qu'une équipe Scrum accomplit en un sprint, mesurée en **points de story** (Story Points).

**Les Story Points :**
Unité relative d'estimation qui prend en compte la complexité, le risque et l'effort, pas uniquement le temps. On utilise souvent la suite de Fibonacci : 1, 2, 3, 5, 8, 13, 21.

```
Estimation de la story "Se connecter" :
→ Complexité : faible (on a déjà fait des auth avant)
→ Risque : faible
→ Effort : modéré (JWT + Spring Security)
→ 5 points

Estimation de "Chat temps réel avec WebSocket" :
→ Complexité : élevée (STOMP, subscriptions, événements)
→ Risque : moyen (nouveau pour l'équipe)
→ Effort : important
→ 13 points
```

**Calcul de la vélocité :**
```
Sprint 1 : 34 points planifiés, 28 points terminés → vélocité = 28
Sprint 2 : 30 points planifiés, 32 points terminés → vélocité = 32
Sprint 3 : 35 points planifiés, 30 points terminés → vélocité = 30

Vélocité moyenne = (28 + 32 + 30) / 3 = 30 points/sprint
```

**Utilité de la vélocité :**
- **Planification** : si le backlog fait 150 points et la vélocité est 30, il faut 5 sprints
- **Prédictibilité** : le PO peut estimer les dates de livraison
- **Comparaison** : une vélocité qui baisse peut indiquer de la dette technique ou des problèmes d'équipe

⚠️ La vélocité ne se compare **jamais** entre deux équipes différentes (les points n'ont pas de valeur absolue).

---

### Q26. Qu'est-ce que la dette technique ?

La **dette technique** est la conséquence de décisions de développement prises pour aller vite à court terme, qui créent un surcoût de travail à long terme.

**Analogie financière :**
Comme une dette bancaire, la dette technique accumule des "intérêts" : plus on tarde à la rembourser, plus elle coûte cher à corriger.

**Exemples de dette technique :**

```java
// ❌ Dette technique — code copié-collé (violation DRY)
// Si la logique change, on doit modifier 5 endroits
public class ChannelController {
    UUID userId = UUID.fromString(userDetails.getUsername()); // copié
}
public class MessageController {
    UUID userId = UUID.fromString(userDetails.getUsername()); // copié
}

// ✅ Remboursement de la dette — méthode extractée
private UUID extractId(UserDetails ud) {
    return UUID.fromString(ud.getUsername()); // défini une fois
}
```

**Types de dette technique :**
- **Délibérée** : on choisit consciemment une solution rapide (prototype → prod)
- **Involontaire** : on ne savait pas mieux faire à l'époque
- **Progressée** : la dette accumulée rend chaque nouvelle fonctionnalité plus difficile

**Comment la gérer ?**
- La rendre visible dans le backlog (Technical Stories)
- Allouer ~20% du temps de chaque sprint à son remboursement
- Ne pas l'ignorer : une dette non remboursée peut stopper un projet

---

### Q27. Quelle est la différence entre les tests unitaires, d'intégration et end-to-end ?

**Tests Unitaires**
Testent une seule unité de code (méthode, classe) de façon **isolée** des autres composants. Les dépendances sont remplacées par des **mocks**.

```java
@Test
void login_withValidCredentials_shouldReturnToken() {
    // Given
    when(userRepository.findByUsername("admin"))
        .thenReturn(Optional.of(adminUser)); // ← mock du repository
    when(passwordEncoder.matches("admin123", adminUser.getPasswordHash()))
        .thenReturn(true); // ← mock du passwordEncoder

    // When
    LoginResponse response = authService.login(new LoginRequest("admin", "admin123"));

    // Then
    assertNotNull(response.token());
    assertEquals("admin", response.user().username());
}
```

**Tests d'intégration**
Testent l'**interaction entre plusieurs composants** réels (pas de mocks). En Spring Boot, on utilise `@SpringBootTest` avec une base H2 en mémoire.

```java
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {
    @Test
    void postLogin_shouldReturn200AndToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
```

**Tests End-to-End (E2E)**
Testent l'application **entière** du point de vue de l'utilisateur, en simulant un navigateur réel. Playwright ou Selenium.

```typescript
// Playwright — test E2E AlertMNS
test('login puis envoi de message', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    await page.fill('[name=username]', 'admin');
    await page.fill('[name=password]', 'admin123');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/chat');
    await page.fill('.message-input', 'Bonjour !');
    await page.press('.message-input', 'Enter');
    await expect(page.locator('.message-content')).toContainText('Bonjour !');
});
```

**La pyramide des tests :**
```
         /E2E\         ← peu nombreux, lents, coûteux
        /──────\
       /  Intég. \     ← quantité modérée
      /────────────\
     /  Unitaires   \  ← nombreux, rapides, peu coûteux
    /────────────────\
```

---

### Q28. Qu'est-ce que CI/CD ? Comment le mettre en place ?

**CI/CD** est l'acronyme de **Continuous Integration / Continuous Delivery** (ou Deployment).

---

**CI — Intégration Continue**
Chaque fois qu'un développeur pousse du code, un pipeline automatique :
1. Récupère le code
2. Compile
3. Lance les tests unitaires et d'intégration
4. Analyse la qualité du code (SonarQube)
5. Notifie l'équipe si quelque chose casse

```
Développeur → git push → GitHub Actions déclenché automatiquement
→ mvn test → mvn build → analyse qualité → notification Slack
```

**CD — Livraison Continue (Continuous Delivery)**
Si les tests passent, le code est automatiquement déployé sur un environnement de **staging** (pré-production) prêt à être validé par le PO.

**CD — Déploiement Continu (Continuous Deployment)**
Si les tests passent ET les critères de qualité sont atteints, le code est automatiquement déployé en **production** sans intervention humaine.

**Exemple de pipeline GitHub Actions pour AlertMNS :**

```yaml
name: CI/CD AlertMNS
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21' }
      - run: cd alertmns-backend && mvn test
      - run: cd alertmns-backend && mvn package -DskipTests

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd alertmns-frontend && npm ci && npm run build
```

**Bénéfices :**
- Détection immédiate des régressions
- Livraisons fréquentes et fiables
- Moins de stress lors des mises en production
- Feedback rapide pour les développeurs

---

## BLOC 4 — CRUD & API REST

---

### Q29. Qu'est-ce que CRUD ? Donnez des exemples concrets dans votre projet.

**CRUD** est l'acronyme des 4 opérations fondamentales de persistance des données :

| Lettre | Opération | SQL | HTTP | Spring Boot |
|---|---|---|---|---|
| **C** | Create (Créer) | `INSERT` | `POST` | `@PostMapping` |
| **R** | Read (Lire) | `SELECT` | `GET` | `@GetMapping` |
| **U** | Update (Mettre à jour) | `UPDATE` | `PUT` / `PATCH` | `@PutMapping` / `@PatchMapping` |
| **D** | Delete (Supprimer) | `DELETE` | `DELETE` | `@DeleteMapping` |

**Exemples CRUD complets dans AlertMNS — ressource "Channel" :**

```
CREATE  → POST   /api/channels            → Créer un canal
READ    → GET    /api/channels            → Lire tous les canaux accessibles
READ    → GET    /api/channels/{id}       → Lire un canal spécifique
UPDATE  → PATCH  /api/channels/{id}/members → Modifier les membres
DELETE  → DELETE /api/channels/{id}       → Supprimer un canal
```

**Différence PUT vs PATCH :**
- `PUT` : remplacement total de la ressource (tous les champs doivent être fournis)
- `PATCH` : modification partielle (seuls les champs fournis sont modifiés)

```java
// AlertMNS utilise PATCH pour le profil — on peut mettre à jour uniquement le displayName
@PatchMapping("/me")
public ResponseEntity<UserResponse> updateMe(@RequestBody UpdateProfileRequest request) {
    // Si request.displayName() = null → champ non modifié
    // Seuls les champs non-null sont mis à jour
}
```

---

### Q30. Quelle est la différence entre `PUT` et `PATCH` dans une API REST ?

**`PUT` — Remplacement total**

Le client envoie la **représentation complète** de la ressource. Tous les champs non fournis sont remis à leur valeur par défaut ou null.

```http
PUT /api/users/123
{
  "username": "sofia",
  "email": "sofia@alertmns.fr",
  "displayName": "Sofia Martin",
  "role": "MANAGER",
  "status": "ONLINE"
  // Tous les champs obligatoires doivent être présents
}
```

**`PATCH` — Modification partielle**

Le client envoie **uniquement les champs à modifier**. Les champs non fournis restent inchangés.

```http
PATCH /api/auth/me
{
  "status": "AWAY",
  "absentMessage": "En formation"
  // displayName, email, etc. restent inchangés
}
```

**Exemple dans AlertMNS :**

```java
// PATCH /api/auth/me — mise à jour partielle
public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
    User user = findUser(userId);

    // On vérifie null avant chaque mise à jour
    if (request.displayName() != null) {
        user.setDisplayName(request.displayName());
    }
    if (request.status() != null) {
        user.setStatus(request.status());
    }
    // Les champs null dans le request ne modifient pas l'entité
    return UserResponse.from(userRepository.save(user));
}
```

**Idempotence :**
- `PUT` est **idempotent** : appeler PUT 5 fois avec les mêmes données donne le même résultat qu'une fois
- `PATCH` peut ne pas être idempotent (dépend de l'implémentation)
- `POST` n'est **pas idempotent** : appeler POST 5 fois crée 5 ressources

---

### Q31. Comment sécurisez-vous une API REST contre les injections SQL ?

Une **injection SQL** est une attaque où un attaquant insère du code SQL malveillant dans les paramètres d'une requête pour manipuler la base de données.

**Attaque classique :**
```sql
-- URL : /api/users?username=admin'--
-- Si le code fait : "SELECT * FROM users WHERE username = '" + username + "'"
-- Résultat : SELECT * FROM users WHERE username = 'admin'--'
-- Le -- commente le reste → authentification bypassée
```

**Protection avec JPA (AlertMNS) :**

JPA utilise des **requêtes paramétrées** (Prepared Statements) qui séparent le code SQL des données. L'input utilisateur ne peut jamais devenir du code SQL.

```java
// ✅ Sécurisé — paramètre bindé (:username)
@Query("SELECT u FROM User u WHERE u.username = :username")
Optional<User> findByUsername(@Param("username") String username);

// Hibernate génère : SELECT * FROM users WHERE username = ?
// La valeur 'admin'-- est passée comme donnée, jamais interprétée comme SQL
```

**Spring Data Derived Queries :**
```java
// Encore plus simple — Spring génère le SQL paramétré automatiquement
Optional<User> findByUsername(String username);
// → SELECT * FROM users WHERE username = ? (paramétré automatiquement)
```

**Autres protections appliquées :**
- **Validation des entrées** (`@NotBlank`, `@Size`) — rejette les données malformées avant la requête
- **Principes du moindre privilège** — l'utilisateur DB de l'app a uniquement les droits SELECT/INSERT/UPDATE/DELETE nécessaires, pas DROP TABLE
- **Pas d'exposition des erreurs SQL** — `GlobalExceptionHandler` retourne des messages génériques

---

### Q32. Comment paginez-vous les résultats dans une API REST ?

La **pagination** évite de retourner des milliers d'éléments d'un seul coup, ce qui consommerait trop de mémoire et serait lent.

**Deux stratégies principales :**

**1. Pagination par offset (classique)**
```http
GET /api/messages?page=0&size=50
GET /api/messages?page=1&size=50

Réponse :
{
  "content": [...50 messages...],
  "totalElements": 1250,
  "totalPages": 25,
  "currentPage": 0,
  "size": 50
}
```

**2. Pagination par curseur (pour les chats — AlertMNS)**
```http
GET /api/messages?channelId=c1&before=2026-06-09T10:00:00Z&limit=50
```

Meilleures performances pour les flux temps réel car pas de calcul `OFFSET` qui devient lent avec un grand nombre de lignes.

**Dans AlertMNS — Spring Data Pageable :**

```java
@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    @Query("SELECT m FROM Message m JOIN FETCH m.author
            WHERE m.channelId = :channelId ORDER BY m.createdAt ASC")
    List<Message> findByChannelIdOrderByCreatedAtAsc(
            @Param("channelId") UUID channelId,
            Pageable pageable);  // ← paramètre de pagination
}

// Dans le service
List<Message> history = messageRepository.findByChannelIdOrderByCreatedAtAsc(
    channelId,
    PageRequest.of(0, 50)  // ← page 0, 50 éléments max
);
```

---

### Q33. Qu'est-ce que CORS et pourquoi est-ce nécessaire ?

**CORS** (Cross-Origin Resource Sharing) est un mécanisme de sécurité des navigateurs qui bloque par défaut les requêtes HTTP entre deux **origines différentes**.

**Une origine = protocole + domaine + port :**
```
http://localhost:4200   ← Angular (frontend)
http://localhost:4000   ← Spring Boot (backend)
                ↑
         Origines différentes !
```

Sans configuration CORS, le navigateur bloque toutes les requêtes d'Angular vers Spring Boot avec l'erreur :
```
Access to fetch at 'http://localhost:4000/api/auth/login' from origin 
'http://localhost:4200' has been blocked by CORS policy
```

**Configuration CORS dans AlertMNS :**

```java
// SecurityConfig.java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:4200")); // origins autorisées
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));    // tous les headers (dont Authorization)
    config.setAllowCredentials(true);           // autoriser les cookies/auth

    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**Fonctionnement :**
1. Le navigateur envoie d'abord une requête **OPTIONS** (preflight)
2. Spring répond avec les headers CORS (`Access-Control-Allow-Origin`, etc.)
3. Si l'origine est autorisée, le navigateur envoie la vraie requête

**En production**, on remplace `localhost:4200` par le vrai domaine du frontend.

---

### Q34. Qu'est-ce que la validation des données et comment la gérez-vous ?

La **validation des données** vérifie que les données reçues respectent les contraintes définies avant de les traiter. Elle se fait **aux frontières du système** (entrées utilisateur, APIs externes).

**Dans AlertMNS — Bean Validation (Jakarta) :**

```java
// DTO avec contraintes de validation
public record RegisterRequest(
    @NotBlank           // ← non null, non vide
    @Size(min = 3, max = 50)  // ← entre 3 et 50 caractères
    String username,

    @NotBlank
    @Email              // ← format email valide
    String email,

    @NotBlank
    @Size(min = 6)      // ← minimum 6 caractères
    String password,

    @NotBlank
    @Size(min = 1, max = 100)
    String displayName
) {}
```

**Activation avec `@Valid` dans le Controller :**
```java
@PostMapping("/register")
public ResponseEntity<LoginResponse> register(
        @Valid @RequestBody RegisterRequest request) {
    // Si une contrainte est violée → MethodArgumentNotValidException
    // → GlobalExceptionHandler → HTTP 400 avec message d'erreur
    return ResponseEntity.status(201).body(authService.register(request));
}
```

**Réponse automatique en cas d'erreur :**
```json
{
  "status": 400,
  "message": "password: size must be between 6 and 2147483647; email: must be a well-formed email address",
  "timestamp": "2026-06-09T10:30:00Z"
}
```

**Niveaux de validation :**
1. **Front-end** : validation immédiate pour l'UX (champ rouge si invalide)
2. **API (DTO)** : validation des données entrantes — première ligne de défense backend
3. **Service** : règles métier (username déjà pris → 409 Conflict)
4. **Base de données** : contraintes SQL (UNIQUE, NOT NULL) — dernier filet de sécurité

---

### Q35. Comment gérez-vous la gestion des erreurs dans votre API ?

La gestion des erreurs dans AlertMNS est centralisée dans **`GlobalExceptionHandler`** (`@RestControllerAdvice`).

**Sans gestion centralisée :**
```java
// ❌ Chaque controller gère ses erreurs différemment → code répété
@GetMapping("/{id}")
public Channel getChannel(@PathVariable UUID id) {
    try {
        return channelService.getChannel(id);
    } catch (NotFoundException e) {
        return ResponseEntity.status(404).body(e.getMessage()); // répété partout
    }
}
```

**Avec `@RestControllerAdvice` :**
```java
// ✅ Un seul endroit gère toutes les erreurs
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
            .body(ErrorResponse.of(ex.getStatusCode().value(), ex.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining("; "));
        return ResponseEntity.status(400).body(ErrorResponse.of(400, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        // Ne pas exposer les détails techniques en production
        return ResponseEntity.status(500).body(ErrorResponse.of(500, "Internal server error"));
    }
}
```

**Format d'erreur standardisé :**
```json
{
  "status": 404,
  "message": "Channel not found",
  "timestamp": "2026-06-09T10:30:00Z"
}
```

---

## BLOC 5 — Sécurité & Authentification

---

### Q36. Qu'est-ce que JWT ? Comment fonctionne-t-il ?

**JWT (JSON Web Token)** est un standard ouvert (RFC 7519) pour transmettre des informations de façon sécurisée entre parties sous forme de token signé.

**Structure d'un JWT :**
Un JWT est composé de 3 parties séparées par des points `.` :

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1dWlkLXVzZXIifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
     HEADER                    PAYLOAD                        SIGNATURE
```

**1. Header** (encodé Base64)
```json
{
  "alg": "HS256",   // algorithme de signature : HMAC-SHA256
  "typ": "JWT"
}
```

**2. Payload** (encodé Base64)
```json
{
  "sub": "uuid-de-l-utilisateur",  // subject
  "iat": 1717930800,               // issued at (timestamp)
  "exp": 1718535600                // expiration (7 jours plus tard)
}
```

**3. Signature**
```
HMACSHA256(
  base64(header) + "." + base64(payload),
  secret_key
)
```

La signature garantit que le token n'a pas été modifié. Si un attaquant change le payload (ex: met un autre userId), la signature devient invalide.

**Flux complet AlertMNS :**
```
1. Login → serveur génère JWT signé
2. Client stocke JWT dans localStorage
3. Chaque requête → header: "Authorization: Bearer {jwt}"
4. Serveur vérifie la signature → extrait userId → identifie l'utilisateur
```

⚠️ Le payload est **encodé** (Base64), pas **chiffré**. Ne jamais mettre d'informations sensibles dans un JWT (mot de passe, numéro de carte).

---

### Q37. Quelle est la différence entre authentification et autorisation ?

**Authentification** : *Qui es-tu ?*
Vérifier l'identité d'un utilisateur. Il s'agit de confirmer que l'utilisateur est bien celui qu'il prétend être.

```
Processus dans AlertMNS :
1. L'utilisateur envoie username + password
2. Le serveur vérifie le password avec bcrypt
3. Si valide → génère un JWT → "je te reconnais, tu es admin"
```

**Autorisation** : *Qu'as-tu le droit de faire ?*
Vérifier les permissions d'un utilisateur authentifié. Que peut-il faire dans le système ?

```
Processus dans AlertMNS :
1. L'utilisateur envoie son JWT (authentifié = on sait qui il est)
2. DELETE /api/channels/123
3. Le serveur vérifie son rôle : "es-tu ADMIN ?"
4. Si non ADMIN → 403 Forbidden
```

**Résumé :**
```
Authentification = "login réussi → voici ton token"
Autorisation     = "tu es connecté, mais as-tu le droit de supprimer ce canal ?"
```

**Dans Spring Security :**
```java
// Authentification : géré par JwtAuthenticationFilter
// Autorisation : géré par les vérifications de rôle dans les services

public void deleteChannel(UUID channelId, UUID requesterId) {
    User requester = findUser(requesterId); // ← on sait qui il est (auth)
    if (requester.getRole() != UserRole.ADMIN) { // ← vérifie ses droits (authz)
        throw new ResponseStatusException(403, "Only admins can delete channels");
    }
}
```

---

### Q38. Qu'est-ce que le hachage de mot de passe et pourquoi utiliser BCrypt ?

**Le hachage** transforme un mot de passe en une chaîne de caractères irréversible. Même si la base de données est compromise, les mots de passe en clair ne sont pas exposés.

**Hachage simple (SHA-256) — INSUFFISANT pour les mots de passe :**
```
"admin123" → SHA256 → "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
```

Problème : **Rainbow tables** — des attaquants ont précalculé les hashes SHA-256 de millions de mots de passe communs. Si deux utilisateurs ont le même mot de passe, ils ont le même hash → attaque de masse.

**BCrypt — Hachage adaptatif avec sel :**

```java
// Dans AlertMNS
PasswordEncoder encoder = new BCryptPasswordEncoder(10); // cost factor = 10

String hash = encoder.encode("admin123");
// → "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
//     ↑   ↑  ↑       ↑
//  version cost sel   hash
```

BCrypt ajoute automatiquement un **sel aléatoire** unique pour chaque utilisateur. Même si deux utilisateurs ont le même mot de passe, leurs hashes sont différents.

**Cost factor (10) :**
Contrôle le temps de calcul. À cost=10, bcrypt prend ~100ms par hash. Pour un attaquant qui teste des millions de mots de passe :
```
1 000 000 mots de passe × 100ms = 100 000 secondes ≈ 27 heures
(contre 0.001ms pour SHA-256 = 1 seconde pour 1 million)
```

**Vérification :**
```java
// Le sel est intégré dans le hash stocké → pas besoin de le stocker séparément
boolean valid = encoder.matches("admin123", storedHash);
// BCrypt extrait le sel du hash, recalcule, compare → true ou false
```

---

### Q39. Qu'est-ce que HTTPS et pourquoi est-il indispensable ?

**HTTPS** (HTTP Secure) est HTTP avec une couche de chiffrement **TLS (Transport Layer Security)**. Toutes les communications entre le client et le serveur sont chiffrées.

**Sans HTTPS (HTTP) :**
```
Réseau :  Client ──── "admin123" ──── Internet ──── Serveur
                         ↑
               Un attaquant sur le réseau Wi-Fi peut lire le mot de passe en clair
               (attaque "Man in the Middle")
```

**Avec HTTPS (TLS) :**
```
Réseau :  Client ──── "X5k$9#mQpR..." ──── Internet ──── Serveur
                              ↑
               Chiffré — illisible pour un observateur extérieur
```

**Certificat TLS :**
Émis par une **Autorité de Certification (CA)** (Let's Encrypt, DigiCert...). Prouve que le serveur est bien celui qu'il prétend être.

**Impact sur AlertMNS :**
- Les JWT envoyés dans les headers seraient lisibles en HTTP → vol de session
- Les mots de passe à la connexion seraient exposés
- Les messages privés seraient interceptables

**En production AlertMNS :**
```
Client Angular ──HTTPS──→ Nginx (reverse proxy + TLS) ──HTTP──→ Spring Boot
```
Spring Boot tourne en HTTP en interne (réseau privé sécurisé), Nginx gère le TLS vers l'extérieur.

---

### Q40. Quelles sont les principales failles de sécurité OWASP et comment les évitez-vous ?

**OWASP Top 10** est la liste des 10 risques de sécurité les plus critiques pour les applications web, publiée par l'Open Web Application Security Project.

**Les 3 plus importantes avec mesures dans AlertMNS :**

**1. Injection (SQL, NoSQL, LDAP)**
```java
// ✅ Protection : JPA avec paramètres bindés
// Impossible d'injecter du SQL car la valeur est passée comme paramètre typé
findByUsername(username); // username est un paramètre, jamais du SQL
```

**2. Broken Authentication**
```java
// ✅ Protections :
// - BCrypt avec cost=10 → brute force très lent
// - JWT expirant en 7 jours → token volé a une durée de vie limitée
// - Message d'erreur générique → "Identifiants invalides" (pas "username incorrect")
//   → évite l'énumération des comptes existants
```

**3. Sensitive Data Exposure**
```java
// ✅ Protections :
// - UserResponse ne contient pas passwordHash
// - Toutes les erreurs 500 retournent "Internal server error" (pas la stack trace)
// - HTTPS en production (chiffrement en transit)
// - JWT dans localStorage (meilleur que Cookie avec XSS si CSP configurée)
```

**Autres protections :**
- **CORS strict** : seul le front Angular peut appeler l'API
- **Validation** : `@Valid` + Bean Validation bloque les données malformées
- **Principes du moindre privilège** : un USER ne peut pas supprimer les canaux

---

### Q41. Qu'est-ce que XSS et CSRF ? Comment s'en protéger ?

**XSS (Cross-Site Scripting)**

Un attaquant injecte du JavaScript malveillant dans une page web, exécuté dans le navigateur d'autres utilisateurs.

```
Attaque :
1. L'attaquant envoie un message : "<script>document.cookie → attacker.com</script>"
2. Si l'app affiche le message sans l'échapper, ce script s'exécute
3. Les cookies/tokens de tous les visiteurs sont volés
```

**Protection dans AlertMNS :**
```typescript
// Angular échappe automatiquement le contenu dans les templates
// {{ message.content }} → Angular encode les caractères HTML spéciaux
// "<script>" → "&lt;script&gt;" (affiché comme texte, non exécuté)
```

**CSRF (Cross-Site Request Forgery)**

Un attaquant piège un utilisateur connecté pour qu'il effectue des actions à son insu.

```
Attaque :
1. Utilisateur connecté à AlertMNS (cookie de session)
2. Il visite un site malveillant
3. Ce site envoie une requête vers AlertMNS : "DELETE /api/channels/1"
4. Le navigateur joint automatiquement le cookie → requête authentifiée !
```

**Protection : AlertMNS est immunisé par nature car STATELESS avec JWT**
```
Le JWT est dans le header "Authorization", pas dans un cookie.
Un site tiers ne peut pas accéder aux headers d'une autre origine.
→ Il ne peut pas joindre le JWT à sa requête forgée.
→ CSRF impossible.
```

Spring Boot : `csrf(AbstractHttpConfigurer::disable)` car pas de cookies de session.

---

## BLOC 6 — Programmation Objet & Design Patterns

---

### Q42. Qu'est-ce qu'un singleton et comment Spring Boot l'implémente-t-il ?

Le **Singleton** est un design pattern créationnel qui garantit qu'une classe n'a **qu'une seule instance** dans toute l'application et fournit un point d'accès global à cette instance.

**Implémentation classique en Java :**
```java
public class JwtTokenProvider {
    private static JwtTokenProvider instance;

    private JwtTokenProvider() {} // constructeur privé

    public static synchronized JwtTokenProvider getInstance() {
        if (instance == null) {
            instance = new JwtTokenProvider();
        }
        return instance;
    }
}
```

**Spring Boot gère les singletons automatiquement :**

Par défaut, tous les beans Spring (`@Service`, `@Repository`, `@Controller`, `@Component`) sont des **singletons** — Spring crée une seule instance de chaque classe et la réutilise partout.

```java
@Service  // ← Spring crée UNE SEULE instance de AuthService
public class AuthService {
    // Cette même instance est injectée dans tous les controllers qui en ont besoin
}
```

**Pourquoi c'est important ?**
- **Performance** : pas de création d'objet à chaque requête
- **Cohérence** : tout le monde partage le même état (caches, connexions DB)
- **Mémoire** : une seule instance, pas N

⚠️ **Attention aux états mutables dans un singleton** : si `AuthService` avait un attribut `List<User> loggedUsers`, il serait partagé entre toutes les requêtes concurrentes → bugs de concurrence. C'est pourquoi les beans Spring ne doivent pas avoir d'état mutable (ils sont **stateless**).

---

### Q43. Qu'est-ce que le pattern Observer et où l'utilisez-vous ?

Le **pattern Observer** (aussi appelé Event/Listener) définit une relation **1 → N** entre objets : quand un objet (le **Subject**) change d'état, tous ses **Observateurs** sont notifiés automatiquement.

**Cas d'usage dans AlertMNS — WebSocket temps réel :**

```
Subject : WebSocketController reçoit un message
Observateurs : tous les clients abonnés à /topic/channel.c1

Quand quelqu'un envoie un message :
1. WebSocketController reçoit l'événement
2. Il notifie TOUS les abonnés du canal
3. Chaque client Angular affiche le nouveau message
```

```java
// Spring STOMP : le broker est l'implémentation du pattern Observer
messagingTemplate.convertAndSend(
    "/topic/channel." + channelId,  // ← topic = subject
    Map.of("type", "message:new", "data", saved)  // ← notification aux observateurs
);
```

**Côté Angular :**
```typescript
// Chaque composant ChatArea s'abonne (devient observateur)
this.wsService.watchChannel(channelId).subscribe(event => {
    // Reçoit la notification et met à jour l'UI
    this.messages.update(list => [...list, event.data as Message]);
});
```

**RxJS Observable = implémentation moderne du pattern Observer :**
```typescript
// Observable = Subject
// subscribe() = s'inscrire comme Observateur
// next() = notification
const messages$ = new Observable(observer => {
    stompClient.subscribe(topic, msg => observer.next(JSON.parse(msg.body)));
});
```

---

### Q44. Expliquez la différence entre le pattern Factory et le pattern Builder.

**Factory Pattern (Usine)**
Délègue la **création d'objets** à une classe spécialisée. L'appelant ne sait pas quelle classe concrète est instanciée.

```java
// Factory — crée le bon type d'export selon le format demandé
public Exporter createExporter(String format) {
    return switch (format) {
        case "json" -> new JsonExporter();
        case "csv"  -> new CsvExporter();
        case "xml"  -> new XmlExporter();
        default     -> throw new IllegalArgumentException("Format inconnu");
    };
}
// L'appelant : Exporter e = factory.createExporter("json");
// Il ne sait pas que c'est un JsonExporter
```

**Builder Pattern (Constructeur)**
Construit un **objet complexe** étape par étape avec une API fluente. Idéal quand un objet a beaucoup de paramètres optionnels.

```java
// Builder — utilisé partout dans AlertMNS (Lombok @Builder)
User user = User.builder()
    .username("admin")
    .email("admin@alertmns.fr")
    .passwordHash(encoder.encode("admin123"))
    .displayName("Admin MNS")
    .initials("AM")
    .role(UserRole.ADMIN)
    .status(UserStatus.OFFLINE)
    .color("#e74c3c")
    .build();

// Sans Builder, le constructeur serait :
User user = new User(null, "admin", "admin@alertmns.fr", hash, "Admin MNS",
                     "AM", UserRole.ADMIN, UserStatus.OFFLINE, null, null, "#e74c3c", Instant.now());
// ← illisible, ordre des paramètres impossible à mémoriser
```

**Résumé :**
| Pattern | Question | Usage |
|---|---|---|
| Factory | **Quel objet** créer ? | Polymorphisme, famille d'objets |
| Builder | **Comment** construire un objet complexe ? | Objets avec nombreux paramètres optionnels |

---

### Q45. Qu'est-ce que la généricité en Java ? Donnez des exemples.

La **généricité** (Generics) permet d'écrire du code qui fonctionne avec **n'importe quel type**, tout en gardant la sécurité du typage à la compilation.

**Sans généricité (Java avant 1.5) :**
```java
List list = new ArrayList();
list.add("hello");
list.add(42); // ← on peut ajouter n'importe quoi
String s = (String) list.get(0); // ← cast obligatoire, risque de ClassCastException
```

**Avec généricité :**
```java
List<String> list = new ArrayList<>();
list.add("hello");
// list.add(42); ← ERREUR DE COMPILATION → type sûr
String s = list.get(0); // ← pas de cast, type garanti
```

**Dans AlertMNS :**
```java
// ResponseEntity<T> : retourne n'importe quel type T en corps de réponse HTTP
ResponseEntity<LoginResponse>          // corps = LoginResponse
ResponseEntity<List<ChannelResponse>>  // corps = liste de ChannelResponse
ResponseEntity<Void>                   // pas de corps (suppression)

// Optional<T> : valeur qui peut être présente ou absente
Optional<User> findByUsername(String username); // peut retourner un User ou vide

// Spring Data JpaRepository<T, ID> : repository générique pour n'importe quelle entité
public interface UserRepository extends JpaRepository<User, UUID>
public interface ChannelRepository extends JpaRepository<Channel, UUID>
// La même interface générique fonctionne pour User avec clé UUID
// et pour Channel avec clé UUID
```

---

### Q46. Qu'est-ce que la gestion des exceptions en Java ?

Java distingue deux types d'exceptions :

**Exceptions vérifiées (Checked Exceptions)**
Le compilateur oblige à les gérer (try/catch) ou les déclarer dans la signature de méthode.
```java
// IOException est une checked exception
try {
    Files.readAllBytes(Path.of("config.json"));
} catch (IOException e) {
    // Obligatoire — le compilateur refuse sinon
}
```

**Exceptions non vérifiées (Unchecked / Runtime Exceptions)**
Pas obligatoire de les gérer. Se produisent à l'exécution.
```java
// NullPointerException, IllegalArgumentException, etc.
UUID.fromString(null); // → NullPointerException à l'exécution
```

**Dans AlertMNS — `ResponseStatusException` :**

Spring Boot fournit `ResponseStatusException` qui est une RuntimeException avec un code HTTP associé.

```java
// Dans le service — lance l'exception avec code HTTP explicite
throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Channel not found");
throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");

// GlobalExceptionHandler l'attrape et retourne la réponse JSON appropriée
@ExceptionHandler(ResponseStatusException.class)
public ResponseEntity<ErrorResponse> handle(ResponseStatusException ex) {
    return ResponseEntity.status(ex.getStatusCode())
        .body(ErrorResponse.of(ex.getStatusCode().value(), ex.getReason()));
}
```

**Bonne pratique — ne pas swallower les exceptions :**
```java
// ❌ Exception avalée silencieusement → bug difficile à debugger
try {
    riskyOperation();
} catch (Exception e) {
    // vide → l'erreur est perdue
}

// ✅ Log + relance ou gestion appropriée
try {
    riskyOperation();
} catch (Exception e) {
    log.error("Operation failed: {}", e.getMessage());
    throw new ResponseStatusException(500, "Operation failed");
}
```

---

## BLOC 7 — Questions Projet AlertMNS

---

### Q47. Présentez votre projet AlertMNS : contexte, fonctionnalités et choix techniques.

**Contexte**

AlertMNS est une **messagerie interne sécurisée** développée pour Metz Numeric School. L'objectif est de remplacer les outils de communication non sécurisés (WhatsApp, emails non chiffrés) utilisés en interne par une solution maîtrisée hébergée par l'organisation.

**Fonctionnalités principales**

| Fonctionnalité | Implémentation |
|---|---|
| Authentification sécurisée | Spring Security + BCrypt + JWT |
| Canaux publics et privés | Contrôle d'accès par rôle + liste de membres |
| Messages temps réel | STOMP WebSocket |
| Indicateurs de frappe | Événements WebSocket (typing:start/stop) |
| Réactions emoji | Toggle Map<emoji, List<userId>> persisté en JSON |
| Statuts de présence | ONLINE / AWAY / OFFLINE avec message d'absence |
| Messages privés (DM) | DirectConversation + notifications personnelles |
| Export des conversations | JSON, CSV, XML |
| Gestion des rôles | ADMIN / MANAGER / USER |
| **Thème dark / light** | CSS Custom Properties + Signal Angular 17 + localStorage |

**Architecture technique**

```
Frontend : Angular 17 Standalone + Signals + @stomp/rx-stomp
Backend  : Spring Boot 3.3 + Spring Security 6 + Spring WebSocket STOMP
Base de données : H2 in-memory (dev) → PostgreSQL (production)
Authentification : JWT HMAC-SHA256 (7 jours)
Transport temps réel : STOMP over WebSocket (SockJS fallback)
```

**Sécurité renforcée (audit)**

Un audit de sécurité a conduit aux corrections suivantes :
- CORS : whitelist d'origines stricte (plus de wildcard `*` avec credentials)
- WebSocket : contrôle d'accès aux canaux privés dans `WebSocketController`
- Erreurs 500 : messages génériques (jamais la stack trace)
- Nginx : console H2 retirée, HTTPS forcé sur port 80

**Tests unitaires**


17 tests JUnit 5 / Mockito répartis sur 3 classes :
- `JwtTokenProviderTest` : génération, validation, expiration, falsification
- `AuthServiceTest` : login valide, mot de passe incorrect, username inconnu, inscription
- `ChannelServiceTest` : accès canal public/privé, création, suppression (droits)

**Ce que j'ai appris**

- Concevoir une architecture REST complète avec gestion des rôles
- Implémenter la sécurité JWT de bout en bout (génération → validation → injection Spring Security)
- Gérer les communications temps réel avec STOMP (WebSocket bidirectionnel)
- Utiliser Angular 17 avec les nouvelles APIs (Standalone Components, Signals, Control Flow)
- Structurer un projet Java en couches respectant les principes SOLID
- Implémenter un système de thèmes dark/light avec CSS Custom Properties
- Auditer et corriger des vulnérabilités de sécurité (OWASP) sur une application en production

---

### Q48. Quelles sont les améliorations que vous apporteriez à AlertMNS en v2.0 ?

**1. Migration PostgreSQL + Flyway**
```
Remplacer H2 in-memory par PostgreSQL avec migrations versionnées (Flyway).
Chaque modification de schéma est un script SQL versionné :
V1__initial_schema.sql → V2__add_read_receipts.sql → V3__add_reactions_table.sql
```

**2. Refresh Token**
```
JWT actuel expire en 7 jours → si volé, l'attaquant a 7 jours d'accès.
Solution : Access Token (15 min) + Refresh Token (30 jours) stocké en base.
→ Si l'access token expire, le refresh token génère un nouveau sans reconnexion.
```

**3. Upload de fichiers (pièces jointes)**
```
Intégration S3 (AWS) ou MinIO (auto-hébergé) pour les pièces jointes.
Les fichiers ne sont pas stockés en base mais dans un object storage.
→ Scalable, économique, sécurisé (URLs pré-signées)
```

**4. Tests automatisés** *(déjà partiellement implémentés en v1.1)*
```
En place (v1.1) :
- 17 tests unitaires : JwtTokenProvider, AuthService, ChannelService (Mockito)

À ajouter (v2.0) :
- Tests d'intégration : @SpringBootTest + MockMvc (controller → service → H2)
- Tests E2E : Playwright sur le frontend Angular
- Objectif : couverture > 80%
```

**5. Notifications push**
```
Web Push API + Service Workers Angular pour les notifications
même quand l'onglet est fermé.
```

**6. Chiffrement de bout en bout (E2E)**
```
Les messages sont chiffrés côté client avant envoi.
Le serveur stocke des données chiffrées → même un admin serveur ne peut pas lire les messages.
Protocol : Signal Protocol (utilisé par WhatsApp, Signal)
```

---

## BLOC 8 — Questions en Anglais

*Le CDA requiert 2 questions en anglais (questions et réponses en anglais)*

---

### Q49. (EN) Can you explain what a RESTful API is and why you chose it for AlertMNS?

**Answer:**

A RESTful API (Representational State Transfer) is an architectural style for building web services. It uses standard HTTP methods and follows six key constraints.

**The key principles I applied in AlertMNS:**

**1. Stateless** — Each request contains all the information needed. The server doesn't store any session. In AlertMNS, every request includes a JWT token in the Authorization header, so the server can identify the user without maintaining a session.

**2. Uniform Interface** — Resources are accessed through consistent URLs:
```
GET    /api/channels        → retrieve all channels
POST   /api/channels        → create a channel
DELETE /api/channels/{id}   → delete a specific channel
```

**3. Client-Server Separation** — The Angular frontend and Spring Boot backend are completely independent. We could replace Angular with a React app or a mobile app without changing a single line of the backend.

**Why REST over alternatives?**

- **GraphQL** would be overkill for this project size and adds complexity
- **gRPC** is faster but requires binary protocol and is harder to debug
- **REST** is the industry standard, well-understood by any developer, easily testable with tools like Postman or curl

**The result**: AlertMNS has 20 REST endpoints covering full CRUD for channels (5), messages (4), users (4), authentication (4), plus dedicated export endpoints for JSON, CSV, and XML formats (3).

---

### Q50. (EN) How did you implement real-time features in AlertMNS? What challenges did you face?

**Answer:**

Real-time communication in AlertMNS is powered by **WebSocket with the STOMP protocol**, replacing the original Socket.io implementation.

**Why WebSocket instead of HTTP polling?**

HTTP polling would mean Angular asks "any new messages?" every 2 seconds. With 100 users, that's 50 requests/second of pure overhead. WebSocket keeps a persistent connection open — the server pushes data when something happens.

**Why STOMP instead of raw WebSocket?**

STOMP (Simple Text Oriented Messaging Protocol) adds a subscription system on top of WebSocket. This is crucial for AlertMNS because:
- Users subscribe to `/topic/channel.{id}` to receive messages only for their active channel
- The server can push personal notifications to `/user/queue/notifications` for DMs
- Spring Boot supports STOMP natively with full Spring Security integration

**Implementation:**

```java
// Server-side: when a message is sent via WebSocket
@MessageMapping("/chat.send")
public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
    MessageResponse saved = messageService.saveMessage(channelId, authorId, content);
    // Broadcast to ALL subscribers of this channel
    messagingTemplate.convertAndSend("/topic/channel." + channelId, 
        Map.of("type", "message:new", "data", saved));
}
```

```typescript
// Client-side Angular: subscribe and react to events
this.wsService.watchChannel(channelId).subscribe(event => {
    if (event.type === 'message:new') {
        this.messages.update(list => [...list, event.data as Message]);
    }
});
```

**Challenges I faced:**

**1. Authentication over WebSocket** — HTTP headers don't work the same way in WebSocket handshake. I solved this by extracting the JWT from the STOMP `CONNECT` frame headers using a `ChannelInterceptor` in Spring.

**2. Memory leaks in Angular** — WebSocket subscriptions don't auto-unsubscribe. If the user switches channels, old subscriptions would pile up. I solved this by storing all subscriptions in a `Subscription` object and calling `subs.unsubscribe()` in `ngOnDestroy()`.

**3. Reconnection handling** — `@stomp/rx-stomp` handles automatic reconnection with `reconnectDelay: 5000ms`, so if the connection drops, it reconnects transparently without user intervention.

---

## RÉSUMÉ RAPIDE — À retenir pour le jury

| Sujet | Réponse express |
|---|---|
| **ACID** | Atomicité + Cohérence + Isolation + Durabilité → garantit les transactions |
| **Agile** | Livraisons itératives, feedback continu, adaptation au changement |
| **Scrum** | Framework Agile : Sprints + PO + Scrum Master + Daily + Rétro |
| **CRUD** | Create (POST) + Read (GET) + Update (PATCH) + Delete (DELETE) |
| **REST** | Stateless, interface uniforme, client-serveur, cacheable |
| **JWT** | Token signé stateless : header.payload.signature |
| **MVC** | Model (données) + View (UI) + Controller (liaison) |
| **SOLID** | 5 principes OOP : responsabilité unique, ouvert/fermé, Liskov, ségrégation, inversion |
| **DRY** | Don't Repeat Yourself — un code, un seul endroit |
| **STOMP** | Protocole messagerie sur WebSocket : topics + subscriptions |
| **BCrypt** | Hachage adaptatif avec sel — protège les mots de passe |
| **CI/CD** | Intégration et déploiement continus — automatisation du pipeline |

---

*Bonne soutenance ! 💪*  
*Metz Numeric School — CDA RNCP 37873 — 2026*

---

Sources :
- [Réussir son CDA (RNCP 37873)](https://concepteurdeveloppeurdapplications.fr/)
- [Titre RNCP — France Compétences](https://www.francecompetences.fr/recherche/rncp/37873/)
- [Jury CDA — NK Informatique](https://nkinformatique.com/nos-services/formation/jury-cda-concepteur-developpeur-dapplications/)
