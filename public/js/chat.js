// Use backend URL from env (change in production)
const socket = io("https://team-spd-chat.vercel.app", {
  transports: ["websocket", "polling"], // fallback to polling
});

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const usernameModal = document.getElementById("username-modal");
const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");

let myUsername = localStorage.getItem("username") || "";

// Logout button
const logoutBtn = document.createElement("button");
logoutBtn.textContent = "Logout";
logoutBtn.className = "btn btn-danger ms-2";
logoutBtn.addEventListener("click", () => doLogout());
document.querySelector("nav").appendChild(logoutBtn);

function showChat() {
  usernameModal.style.display = "none";
  chatForm.style.display = "flex";
  logoutBtn.style.display = "inline-block";
}

function hideChat() {
  chatForm.style.display = "none";
  logoutBtn.style.display = "none";
  usernameModal.style.display = "flex";
}

// Login flow
if (myUsername) {
  showChat();
  socket.emit("setUsername", myUsername);
} else {
  hideChat();
}

// HTML escape
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"'`=\/]/g, (s) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;",
    }[s])
  );
}

// Username submit
usernameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return;
  myUsername = name;
  localStorage.setItem("username", myUsername);
  showChat();
  socket.emit("setUsername", myUsername);
});

// Receive messages
socket.on("message", addMessage);

// Forced logout
socket.on("forceLogout", () => doLogout(true));

// Add message
function addMessage(msg) {
  const el = document.createElement("div");
  el.classList.add("message");

  if (msg.type === "system") {
    el.classList.add("message-system");
    el.textContent = msg.text;
  } else if (msg.username === myUsername) {
    el.classList.add("message-you");
    el.textContent = msg.text;
  } else {
    el.classList.add("message-other");
    el.innerHTML = `<strong>${escapeHtml(msg.username)}</strong>: ${escapeHtml(msg.text)}`;
  }

  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  socket.emit("message", text);
  chatInput.value = "";
});

// Logout
function doLogout(forced = false) {
  socket.emit("logout");
  localStorage.removeItem("username");
  myUsername = "";
  hideChat();
  if (forced) alert("You have been logged out due to inactivity.");
}
