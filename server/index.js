require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const channelRoutes = require("./routes/channels");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const exportRoutes = require("./routes/export");
const { authenticateSocket } = require("./middleware/auth");
const socketHandler = require("./socket/handler");
const { db } = require("./db");

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes REST
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/export", exportRoutes);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", uptime: process.uptime() }));

// WebSocket middleware — vérification JWT
io.use(authenticateSocket);

// WebSocket events
io.on("connection", (socket) => socketHandler(io, socket));

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 AlertMNS server running on http://localhost:${PORT}`);
  console.log(`   WebSocket ready`);
  console.log(`   Seed data: ${db.users.length} users, ${db.channels.length} channels\n`);
});

module.exports = { io };
