import express from "express";
import path from "path";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";

// apply configuration
dotenv.config();

const app = express();
const server = http.createServer(app);

// create socket.io server
const io = new Server(server, {
  cors: { origin: "*" },
});

// serve static files
app.use(express.static(path.join(process.cwd(), "public")));
app.use(cors());
app.use(helmet());
app.use(hpp());

// set view engine
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

// Store connected users { socket.id: username }
const users = {};

// --- SOCKET HANDLER ---
io.on("connection", (socket) => {
  console.log("New User connected:", socket.id);

  // Send welcome only to that user
  socket.emit("message", { type: "system", text: "Welcome to the chat 🎉" });

  // Handle setting username
  socket.on("setUsername", (username) => {
    users[socket.id] = username || "Anonymous";

    // Notify others
    socket.broadcast.emit("message", {
      type: "system",
      text: `${users[socket.id]} joined the chat 👋`,
    });
  });

  // When receiving a message
  socket.on("message", (msg) => {
    if (!users[socket.id]) return; // ignore until username is set

    io.emit("message", {
      type: "user",
      user: users[socket.id],
      text: msg,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const username = users[socket.id] || "A user";
    delete users[socket.id];

    io.emit("message", {
      type: "system",
      text: `${username} left the chat ❌`,
    });
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(process.env.PORT || 4200, () => {
  console.log(`✅ Server is running on port ${process.env.PORT || 4200}`);
});
