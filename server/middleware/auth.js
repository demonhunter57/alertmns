const jwt = require("jsonwebtoken");
const { findUserById, publicUser } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "alertmns_dev_secret";

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function authenticateHTTP(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(payload.userId);
    if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
    req.user = publicUser(user);
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("AUTH_REQUIRED"));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(payload.userId);
    if (!user) return next(new Error("USER_NOT_FOUND"));
    socket.user = publicUser(user);
    next();
  } catch {
    next(new Error("INVALID_TOKEN"));
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }
  next();
}

module.exports = { generateToken, authenticateHTTP, authenticateSocket, requireAdmin };
