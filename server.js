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
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});


// Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

// View engine
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

// Store users: socketId -> { username, timeoutId }
const users = {};

io.on("connection", (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  // Handle setting username
  socket.on("setUsername", (username) => {
    if (!username || typeof username !== "string") return;
    username = username.trim();
    if (!username) return;

    users[socket.id] = { username, timeoutId: null };

    // Broadcast join message
    socket.broadcast.emit("message", {
      type: "system",
      text: `${username} joined the chat 👋`,
    });

    // Welcome user
    socket.emit("message", { type: "system", text: `Welcome ${username} 🎉` });

    // Start inactivity auto-logout timer
    resetInactivityTimer(socket.id);
  });

  // Handle incoming messages
  socket.on("message", (msg) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit("message", { type: "system", text: "⚠️ You must set a username first." });
      return;
    }

    if (!msg || typeof msg !== "string") return;

    // Broadcast message to everyone
    io.emit("message", { type: "user", username: user.username, text: msg });

    // Reset inactivity timer
    resetInactivityTimer(socket.id);
  });

  // Handle logout from client
  socket.on("logout", () => {
    logoutUser(socket.id);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    logoutUser(socket.id);
  });
});

// Auto-logout helper
function resetInactivityTimer(socketId) {
  const user = users[socketId];
  if (!user) return;

  if (user.timeoutId) clearTimeout(user.timeoutId);

  // Auto logout after 10 minutes
  user.timeoutId = setTimeout(() => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("forceLogout");
      logoutUser(socketId);
    }
  }, 10 * 60 * 1000);
}

// Logout user helper
function logoutUser(socketId) {
  const user = users[socketId];
  if (!user) return;

  io.emit("message", { type: "system", text: `${user.username} left the chat ❌` });

  if (user.timeoutId) clearTimeout(user.timeoutId);
  delete users[socketId];
}

app.get("/", (req, res) => {
  res.render("index");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
