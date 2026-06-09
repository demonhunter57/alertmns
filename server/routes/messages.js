const router = require("express").Router();
const { db, findChannel, getChannelMessages, publicUser } = require("../db");
const { authenticateHTTP } = require("../middleware/auth");

// GET /api/messages/:channelId — historique (50 derniers)
router.get("/:channelId", authenticateHTTP, (req, res) => {
  const channel = findChannel(req.params.channelId);
  if (!channel) return res.status(404).json({ error: "Channel introuvable" });
  if (channel.isPrivate && !channel.memberIds.includes(req.user.id)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  const limit = parseInt(req.query.limit) || 50;
  const messages = getChannelMessages(req.params.channelId, limit);
  // Enrichir avec les infos auteur
  const enriched = messages.map((m) => {
    const author = db.users.find((u) => u.id === m.authorId);
    return { ...m, author: author ? publicUser(author) : null };
  });
  res.json(enriched);
});

// PATCH /api/messages/:id — éditer un message
router.patch("/:id", authenticateHTTP, (req, res) => {
  const msg = db.messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: "Message introuvable" });
  if (msg.authorId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès refusé" });
  }
  if (req.body.content) {
    msg.content = req.body.content;
    msg.editedAt = new Date().toISOString();
  }
  res.json(msg);
});

// DELETE /api/messages/:id
router.delete("/:id", authenticateHTTP, (req, res) => {
  const idx = db.messages.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Message introuvable" });
  const msg = db.messages[idx];
  if (msg.authorId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès refusé" });
  }
  db.messages.splice(idx, 1);
  res.json({ ok: true });
});

// POST /api/messages/:id/react — ajouter / retirer une réaction
router.post("/:id/react", authenticateHTTP, (req, res) => {
  const msg = db.messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: "Message introuvable" });
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: "Emoji requis" });
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
  const idx = msg.reactions[emoji].indexOf(req.user.id);
  if (idx === -1) {
    msg.reactions[emoji].push(req.user.id);
  } else {
    msg.reactions[emoji].splice(idx, 1);
    if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
  }
  res.json(msg);
});

// POST /api/messages/:channelId/read — marquer comme lu
router.post("/:channelId/read", authenticateHTTP, (req, res) => {
  db.messages
    .filter((m) => m.channelId === req.params.channelId)
    .forEach((m) => {
      if (!m.readBy.includes(req.user.id)) m.readBy.push(req.user.id);
    });
  res.json({ ok: true });
});

module.exports = router;
