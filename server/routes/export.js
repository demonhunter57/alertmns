const router = require("express").Router();
const { db, findChannel, getChannelMessages, publicUser } = require("../db");
const { authenticateHTTP } = require("../middleware/auth");

function buildMessages(channelId) {
  return getChannelMessages(channelId, 1000).map((m) => {
    const author = db.users.find((u) => u.id === m.authorId);
    return {
      id: m.id,
      author: author?.displayName || "Inconnu",
      content: m.content,
      createdAt: m.createdAt,
      editedAt: m.editedAt,
      reactions: m.reactions,
    };
  });
}

function checkAccess(channel, userId) {
  return !channel.isPrivate || channel.memberIds.includes(userId);
}

// GET /api/export/:channelId/json
router.get("/:channelId/json", authenticateHTTP, (req, res) => {
  const channel = findChannel(req.params.channelId);
  if (!channel) return res.status(404).json({ error: "Channel introuvable" });
  if (!checkAccess(channel, req.user.id)) return res.status(403).json({ error: "Accès refusé" });

  const messages = buildMessages(req.params.channelId);
  const payload = { channel: channel.name, exportedAt: new Date().toISOString(), messages };
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="alertmns-${channel.name}.json"`);
  res.json(payload);
});

// GET /api/export/:channelId/csv
router.get("/:channelId/csv", authenticateHTTP, (req, res) => {
  const channel = findChannel(req.params.channelId);
  if (!channel) return res.status(404).json({ error: "Channel introuvable" });
  if (!checkAccess(channel, req.user.id)) return res.status(403).json({ error: "Accès refusé" });

  const messages = buildMessages(req.params.channelId);
  const header = "id,auteur,contenu,date,modifié_le\n";
  const rows = messages
    .map((m) => [
      m.id,
      `"${m.author}"`,
      `"${m.content.replace(/"/g, '""')}"`,
      m.createdAt,
      m.editedAt || "",
    ].join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="alertmns-${channel.name}.csv"`);
  res.send("\uFEFF" + header + rows); // BOM pour Excel
});

// GET /api/export/:channelId/xml
router.get("/:channelId/xml", authenticateHTTP, (req, res) => {
  const channel = findChannel(req.params.channelId);
  if (!channel) return res.status(404).json({ error: "Channel introuvable" });
  if (!checkAccess(channel, req.user.id)) return res.status(403).json({ error: "Accès refusé" });

  const messages = buildMessages(req.params.channelId);
  const escape = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<conversation channel="${escape(channel.name)}" exportedAt="${new Date().toISOString()}">`,
    ...messages.map((m) => `  <message id="${m.id}" author="${escape(m.author)}" createdAt="${m.createdAt}"${m.editedAt ? ` editedAt="${m.editedAt}"` : ""}>
    <content>${escape(m.content)}</content>
  </message>`),
    "</conversation>",
  ].join("\n");

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Content-Disposition", `attachment; filename="alertmns-${channel.name}.xml"`);
  res.send(xml);
});

// GET /api/export/:channelId/pdf-data — données pour génération PDF côté client
router.get("/:channelId/pdf-data", authenticateHTTP, (req, res) => {
  const channel = findChannel(req.params.channelId);
  if (!channel) return res.status(404).json({ error: "Channel introuvable" });
  if (!checkAccess(channel, req.user.id)) return res.status(403).json({ error: "Accès refusé" });

  const messages = buildMessages(req.params.channelId);
  res.json({
    channel: { name: channel.name, description: channel.description },
    exportedAt: new Date().toISOString(),
    exportedBy: req.user.displayName,
    messages,
  });
});

module.exports = router;
