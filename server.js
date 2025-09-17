import express from "express";
import path from "path";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(process.cwd(), "public")));
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

const users = {}; // { socketId: username }

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  // Wait for username before announcing
  socket.on("setUsername", (username) => {
    if (!username) return;
    users[socket.id] = username;

    // Welcome to the new user
    socket.emit("message", { type: "system", text: `Welcome ${username} 🎉` });

    // Notify others
    socket.broadcast.emit("message", { type: "system", text: `${username} joined the chat 👋` });
  });

  // Chat message from client (text)
  socket.on("message", (msg) => {
    const username = users[socket.id];
    if (!username) {
      socket.emit("message", { type: "system", text: "⚠️ You must set a username before chatting." });
      return;
    }

    io.emit("message", { type: "user", username, text: msg });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      io.emit("message", { type: "system", text: `${username} left the chat ❌` });
      delete users[socket.id];
    }
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
