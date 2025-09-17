import express from "express";
import path from "path";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

// EJS setup
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

// User storage: socketId -> { username, timeoutId }
const users = {};

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  // Set username
  socket.on("setUsername", (username) => {
    if (!username || typeof username !== "string") return;
    username = username.trim();
    if (!username) return;

    users[socket.id] = { username, timeoutId: null };

    // Welcome user
    socket.emit("message", { type: "system", text: `Welcome ${username} 🎉` });

    // Notify others
    socket.broadcast.emit("message", { type: "system", text: `${username} joined the chat 👋` });

    // Start inactivity timer
    resetInactivity(socket.id);
  });

  // Handle chat messages
  socket.on("message", (msg) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit("message", { type: "system", text: "⚠️ You must set a username first." });
      return;
    }
    if (!msg || typeof msg !== "string") return;

    io.emit("message", { type: "user", username: user.username, text: msg });

    // Reset inactivity timer
    resetInactivity(socket.id);
  });

  // Handle logout
  socket.on("logout", () => logoutUser(socket.id));

  // Handle disconnect
  socket.on("disconnect", () => logoutUser(socket.id));
});

// Auto logout helper
function resetInactivity(socketId) {
  const user = users[socketId];
  if (!user) return;

  if (user.timeoutId) clearTimeout(user.timeoutId);

  // Logout after 10 min inactivity
  user.timeoutId = setTimeout(() => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("forceLogout");
      logoutUser(socketId);
    }
  }, 10 * 60 * 1000);
}

// Logout helper
function logoutUser(socketId) {
  const user = users[socketId];
  if (!user) return;

  io.emit("message", { type: "system", text: `${user.username} left the chat ❌` });

  if (user.timeoutId) clearTimeout(user.timeoutId);
  delete users[socketId];
}

// Render EJS
app.get("/", (req, res) => res.render("index"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
