const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { db, findUserByUsername, findUserById, publicUser } = require("../db");
const { generateToken, authenticateHTTP } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis" });
  }
  const user = findUserByUsername(username);
  if (!user) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });

  const token = generateToken(user.id);
  res.json({ token, user: publicUser(user) });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, email, displayName, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }
  if (db.users.find((u) => u.username === username)) {
    return res.status(409).json({ error: "Nom d'utilisateur déjà pris" });
  }
  if (db.users.find((u) => u.email === email)) {
    return res.status(409).json({ error: "Email déjà utilisé" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const colors = ["#818cf8","#4ade80","#fbbf24","#f87171","#34d399","#60a5fa","#e879f9"];
  const newUser = {
    id: `u${Date.now()}`,
    username,
    email,
    passwordHash,
    displayName: displayName || username,
    initials: (displayName || username).slice(0, 2).toUpperCase(),
    role: "user",
    status: "online",
    absentUntil: null,
    absentMessage: null,
    color: colors[db.users.length % colors.length],
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  // Ajouter au canal général automatiquement
  const general = db.channels.find((c) => c.name === "général");
  if (general) general.memberIds.push(newUser.id);

  const token = generateToken(newUser.id);
  res.status(201).json({ token, user: publicUser(newUser) });
});

// GET /api/auth/me — profil courant
router.get("/me", authenticateHTTP, (req, res) => {
  const user = findUserById(req.user.id);
  res.json(publicUser(user));
});

// PATCH /api/auth/me — mise à jour profil / message d'absence
router.patch("/me", authenticateHTTP, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  const allowed = ["displayName", "status", "absentUntil", "absentMessage", "color"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  res.json(publicUser(user));
});

module.exports = router;
