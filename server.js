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
// app.use(cors());
// app.use(helmet());
// app.use(hpp());

// set view engine
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

// --- SOCKET HANDLER ---
io.on("connection", (socket) => {
  console.log("New User connected: ", socket.id);

  // Welcome only that user
  socket.emit("message", { type: "system", text: "Welcome to the chat 🎉" });

  // Notify others
  socket.broadcast.emit("message", { type: "system", text: "A new user joined the chat 👋" });

  // When receiving a message
  socket.on("message", (msg) => {
    io.emit("message", { type: "user", id: socket.id, text: msg });
  });

  // When disconnecting
  socket.on("disconnect", () => {
    io.emit("message", { type: "system", text: "A user left the chat ❌" });
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
