const router = require("express").Router();
const { db, publicUser } = require("../db");
const { authenticateHTTP, requireAdmin } = require("../middleware/auth");

// GET /api/users — liste tous les utilisateurs (sans mots de passe)
router.get("/", authenticateHTTP, (req, res) => {
  res.json(db.users.map(publicUser));
});

// GET /api/users/:id
router.get("/:id", authenticateHTTP, (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json(publicUser(user));
});

// PATCH /api/users/:id/role — changer le rôle (admin seulement)
router.patch("/:id/role", authenticateHTTP, requireAdmin, (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  const { role } = req.body;
  if (!["admin", "manager", "user"].includes(role)) {
    return res.status(400).json({ error: "Rôle invalide" });
  }
  user.role = role;
  res.json(publicUser(user));
});

// DELETE /api/users/:id (admin seulement)
router.delete("/:id", authenticateHTTP, requireAdmin, (req, res) => {
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Utilisateur introuvable" });
  if (db.users[idx].id === req.user.id) {
    return res.status(400).json({ error: "Impossible de supprimer son propre compte" });
  }
  db.users.splice(idx, 1);
  res.json({ ok: true });
});

module.exports = router;
