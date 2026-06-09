const { v4: uuidv4 } = require("uuid");
const { db, findChannel, publicUser } = require("../db");

// Map socketId → userId pour gérer les statuts
const onlineUsers = new Map();

module.exports = function socketHandler(io, socket) {
  const user = socket.user;
  console.log(`[WS] connecté: ${user.displayName} (${socket.id})`);

  // Enregistrer comme en ligne
  onlineUsers.set(socket.id, user.id);
  updateUserStatus(user.id, "online");
  io.emit("user:status", { userId: user.id, status: "online" });

  // Rejoindre automatiquement tous ses channels
  const myChannels = db.channels.filter((c) => c.memberIds.includes(user.id));
  myChannels.forEach((c) => socket.join(`channel:${c.id}`));
  socket.emit("channels:joined", myChannels.map((c) => c.id));

  // ── MESSAGES ────────────────────────────────────────────

  socket.on("message:send", (data, ack) => {
    const { channelId, content } = data;
    if (!content?.trim()) return ack?.({ error: "Contenu vide" });

    const channel = findChannel(channelId);
    if (!channel) return ack?.({ error: "Channel introuvable" });
    if (!channel.memberIds.includes(user.id)) return ack?.({ error: "Accès refusé" });

    const message = {
      id: uuidv4(),
      channelId,
      authorId: user.id,
      content: content.trim(),
      type: "text",
      attachments: data.attachments || [],
      reactions: {},
      readBy: [user.id],
      createdAt: new Date().toISOString(),
      editedAt: null,
    };
    db.messages.push(message);

    const enriched = { ...message, author: publicUser(db.users.find((u) => u.id === user.id)) };

    // Diffuser à tous les membres du channel
    io.to(`channel:${channelId}`).emit("message:new", enriched);
    ack?.({ ok: true, message: enriched });
  });

  socket.on("message:edit", (data, ack) => {
    const { messageId, content } = data;
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return ack?.({ error: "Message introuvable" });
    if (msg.authorId !== user.id && user.role !== "admin") return ack?.({ error: "Accès refusé" });

    msg.content = content.trim();
    msg.editedAt = new Date().toISOString();
    io.to(`channel:${msg.channelId}`).emit("message:edited", msg);
    ack?.({ ok: true });
  });

  socket.on("message:delete", (data, ack) => {
    const { messageId } = data;
    const idx = db.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return ack?.({ error: "Message introuvable" });
    const msg = db.messages[idx];
    if (msg.authorId !== user.id && user.role !== "admin") return ack?.({ error: "Accès refusé" });

    const channelId = msg.channelId;
    db.messages.splice(idx, 1);
    io.to(`channel:${channelId}`).emit("message:deleted", { messageId, channelId });
    ack?.({ ok: true });
  });

  socket.on("message:react", (data, ack) => {
    const { messageId, emoji } = data;
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return ack?.({ error: "Message introuvable" });

    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(user.id);
    if (idx === -1) msg.reactions[emoji].push(user.id);
    else {
      msg.reactions[emoji].splice(idx, 1);
      if (!msg.reactions[emoji].length) delete msg.reactions[emoji];
    }
    io.to(`channel:${msg.channelId}`).emit("message:reacted", { messageId, reactions: msg.reactions });
    ack?.({ ok: true });
  });

  // ── TYPING INDICATOR ────────────────────────────────────

  socket.on("typing:start", ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit("typing:update", {
      channelId,
      userId: user.id,
      displayName: user.displayName,
      typing: true,
    });
  });

  socket.on("typing:stop", ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit("typing:update", {
      channelId,
      userId: user.id,
      displayName: user.displayName,
      typing: false,
    });
  });

  // ── CHANNELS ─────────────────────────────────────────────

  socket.on("channel:join", ({ channelId }, ack) => {
    const channel = findChannel(channelId);
    if (!channel) return ack?.({ error: "Channel introuvable" });
    if (channel.isPrivate && !channel.memberIds.includes(user.id)) {
      return ack?.({ error: "Accès refusé" });
    }
    socket.join(`channel:${channelId}`);
    ack?.({ ok: true });
  });

  socket.on("channel:leave", ({ channelId }) => {
    socket.leave(`channel:${channelId}`);
  });

  // ── MESSAGES DIRECTS ─────────────────────────────────────

  socket.on("dm:send", (data, ack) => {
    const { toUserId, content } = data;
    const recipient = db.users.find((u) => u.id === toUserId);
    if (!recipient) return ack?.({ error: "Destinataire introuvable" });

    // Trouver ou créer la conversation DM
    let dm = db.directMessages.find(
      (d) => d.participants.includes(user.id) && d.participants.includes(toUserId)
    );
    if (!dm) {
      dm = { id: `dm${uuidv4().slice(0, 8)}`, participants: [user.id, toUserId], messages: [] };
      db.directMessages.push(dm);
    }
    const message = {
      id: uuidv4(),
      authorId: user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      readBy: [user.id],
    };
    dm.messages.push(message);

    const enriched = { ...message, author: publicUser(db.users.find((u) => u.id === user.id)) };

    // Envoyer à la room DM
    const dmRoom = `dm:${[user.id, toUserId].sort().join("-")}`;
    io.to(dmRoom).emit("dm:new", { dmId: dm.id, message: enriched });

    // Notifier le destinataire même s'il n'est pas dans la room
    io.to(`user:${toUserId}`).emit("notification", {
      type: "dm",
      from: publicUser(db.users.find((u) => u.id === user.id)),
      content: content.slice(0, 60),
      createdAt: message.createdAt,
    });
    ack?.({ ok: true, dmId: dm.id });
  });

  // ── STATUT ───────────────────────────────────────────────

  socket.on("status:set", ({ status, absentUntil, absentMessage }) => {
    updateUserStatus(user.id, status, absentUntil, absentMessage);
    io.emit("user:status", { userId: user.id, status, absentUntil, absentMessage });
  });

  // ── ROOM PERSONNELLE (pour notifs DM) ────────────────────
  socket.join(`user:${user.id}`);

  // ── DÉCONNEXION ──────────────────────────────────────────

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    // Vérifier si l'utilisateur a d'autres sockets ouvertes
    const stillOnline = [...onlineUsers.values()].includes(user.id);
    if (!stillOnline) {
      updateUserStatus(user.id, "offline");
      io.emit("user:status", { userId: user.id, status: "offline" });
    }
    console.log(`[WS] déconnecté: ${user.displayName}`);
  });
};

function updateUserStatus(userId, status, absentUntil, absentMessage) {
  const u = db.users.find((u) => u.id === userId);
  if (!u) return;
  u.status = status;
  if (absentUntil !== undefined) u.absentUntil = absentUntil;
  if (absentMessage !== undefined) u.absentMessage = absentMessage;
}
