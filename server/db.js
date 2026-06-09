const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// Base de données en mémoire (remplacer par PostgreSQL/MongoDB en production)
// Structure conçue pour migration facile vers un vrai ORM

const HASH_ADMIN = bcrypt.hashSync("admin123", 10);
const HASH_USER = bcrypt.hashSync("user123", 10);

const db = {
  users: [
    {
      id: "u1",
      username: "admin",
      email: "admin@mns.fr",
      passwordHash: HASH_ADMIN,
      displayName: "Admin MNS",
      initials: "AM",
      role: "admin",       // admin | manager | user
      status: "online",    // online | away | offline
      absentUntil: null,
      absentMessage: null,
      color: "#6366f1",
      createdAt: new Date("2026-01-01").toISOString(),
    },
    {
      id: "u2",
      username: "sofia",
      email: "sofia@mns.fr",
      passwordHash: HASH_USER,
      displayName: "Sofia Alvarez",
      initials: "SA",
      role: "manager",
      status: "online",
      absentUntil: null,
      absentMessage: null,
      color: "#818cf8",
      createdAt: new Date("2026-01-02").toISOString(),
    },
    {
      id: "u3",
      username: "marc",
      email: "marc@mns.fr",
      passwordHash: HASH_USER,
      displayName: "Marc Kessler",
      initials: "MK",
      role: "user",
      status: "online",
      absentUntil: null,
      absentMessage: null,
      color: "#4ade80",
      createdAt: new Date("2026-01-03").toISOString(),
    },
    {
      id: "u4",
      username: "lea",
      email: "lea@mns.fr",
      passwordHash: HASH_USER,
      displayName: "Léa Petit",
      initials: "LP",
      role: "user",
      status: "away",
      absentUntil: "2026-06-16",
      absentMessage: "En formation à Paris 🗓️",
      color: "#fbbf24",
      createdAt: new Date("2026-01-04").toISOString(),
    },
  ],

  channels: [
    {
      id: "c1",
      name: "général",
      description: "Discussions générales de l'équipe",
      isPrivate: false,
      memberIds: ["u1", "u2", "u3", "u4"],
      createdBy: "u1",
      createdAt: new Date("2026-01-01").toISOString(),
    },
    {
      id: "c2",
      name: "dev-web",
      description: "Projet AlertMNS — CDA 2025/2026",
      isPrivate: false,
      memberIds: ["u1", "u2", "u3"],
      createdBy: "u1",
      createdAt: new Date("2026-01-05").toISOString(),
    },
    {
      id: "c3",
      name: "design",
      description: "UI/UX & charte graphique",
      isPrivate: false,
      memberIds: ["u1", "u2", "u4"],
      createdBy: "u2",
      createdAt: new Date("2026-01-06").toISOString(),
    },
    {
      id: "c4",
      name: "direction",
      description: "Accès restreint — Direction uniquement",
      isPrivate: true,
      memberIds: ["u1"],
      createdBy: "u1",
      createdAt: new Date("2026-01-01").toISOString(),
    },
  ],

  // { id, channelId, authorId, content, type, attachments[], reactions{}, readBy[], createdAt, editedAt }
  messages: [
    {
      id: uuidv4(),
      channelId: "c2",
      authorId: "u2",
      content: "Bonjour l'équipe ! J'ai poussé la branche `feat/auth-websocket`. Pensez à faire un `git pull` avant de commencer 🙂",
      type: "text",
      attachments: [],
      reactions: { "👍": ["u3", "u1"], "🚀": ["u3"] },
      readBy: ["u1", "u2", "u3"],
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      editedAt: null,
    },
    {
      id: uuidv4(),
      channelId: "c2",
      authorId: "u3",
      content: "Merci @Sofia ! Question : pour les channels privés, tu as prévu un chiffrement des messages côté serveur ou on gère ça en base avec des clés par channel ?",
      type: "text",
      attachments: [],
      reactions: {},
      readBy: ["u2", "u3"],
      createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
      editedAt: null,
    },
    {
      id: uuidv4(),
      channelId: "c1",
      authorId: "u1",
      content: "Bienvenue sur AlertMNS ! Ce canal est le point de rencontre de toute l'organisation.",
      type: "text",
      attachments: [],
      reactions: { "🎉": ["u2", "u3", "u4"] },
      readBy: ["u1", "u2", "u3", "u4"],
      createdAt: new Date("2026-01-01T09:00:00").toISOString(),
      editedAt: null,
    },
  ],

  // Messages directs: { id, participants[userId], messages[] }
  directMessages: [],

  // Rendez-vous: { id, title, scheduledAt, channelId, createdBy, participants[] }
  appointments: [],
};

// Helpers
function findUserById(id) {
  return db.users.find((u) => u.id === id) || null;
}

function findUserByUsername(username) {
  return db.users.find((u) => u.username === username) || null;
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function findChannel(id) {
  return db.channels.find((c) => c.id === id) || null;
}

function getChannelMessages(channelId, limit = 50) {
  return db.messages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-limit);
}

module.exports = { db, findUserById, findUserByUsername, publicUser, findChannel, getChannelMessages };
