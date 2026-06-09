const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { db, findChannel, publicUser } = require("../db");
const { authenticateHTTP, requireAdmin } = require("../middleware/auth");

// GET /api/channels — liste des channels accessibles
router.get("/", authenticateHTTP, (req, res) => {
  const accessible = db.channels.filter(
    (c) => !c.isPrivate || c.memberIds.includes(req.user.id)
  );
  res.json(accessible);
});

// POST /api/channels — créer un channel (manager+)
router.post("/", authenticateHTTP, (req, res) => {
  const { name, description, isPrivate, memberIds } = req.body;
  if (!name) return res.status(400).json({ error: "Nom du channel requis" });
  if (db.channels.find((c) => c.name === name)) {
    return res.status(409).json({ error: "Ce channel existe déjà" });
  }
  const channel = {
    id: `c${uuidv4().slice(0, 8)}`,
    name: name.toLowerCase().replace(/\s+/g, "-"),
    description: description || "",
    isPrivate: !!isPrivate,
    memberIds: [req.user.id, ...(memberIds || [])].filter(
      (id, i, arr) => arr.indexOf(id) === i
    ),
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  db.channels.push(channel);
  res.status(201).json(channel);
});

// GET /api/channels/:id — détails + membres
router.get("/:id", authenticateHTTP, (req, res) => {
  const channel = findChannel(req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel introuvable" });
  if (channel.isPrivate && !channel.memberIds.includes(req.user.id)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  const members = channel.memberIds
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
    .map(publicUser);
  res.json({ ...channel, members });
});

// PATCH /api/channels/:id/members — ajouter/retirer un membre
router.patch("/:id/members", authenticateHTTP, (req, res) => {
  const channel = findChannel(req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel introuvable" });
  if (req.user.role === "user" && channel.createdBy !== req.user.id) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  const { add, remove } = req.body;
  if (add) channel.memberIds = [...new Set([...channel.memberIds, ...add])];
  if (remove) channel.memberIds = channel.memberIds.filter((id) => !remove.includes(id));
  res.json(channel);
});

// DELETE /api/channels/:id — supprimer (admin seulement)
router.delete("/:id", authenticateHTTP, requireAdmin, (req, res) => {
  const idx = db.channels.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Channel introuvable" });
  db.channels.splice(idx, 1);
  db.messages = db.messages.filter((m) => m.channelId !== req.params.id);
  res.json({ ok: true });
});

module.exports = router;
