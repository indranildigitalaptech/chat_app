const socket = io();
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const usernameModal = document.getElementById("username-modal");
const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");

// Load username from localStorage if exists
let myUsername = localStorage.getItem("username") || "";

if (myUsername) {
  usernameModal.style.display = "none";
  chatForm.style.display = "flex";
  socket.emit("setUsername", myUsername);
} else {
  usernameModal.style.display = "flex";
  chatForm.style.display = "none";
}

// HTML escape helper to avoid XSS
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

// Handle username submission
usernameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return;
  myUsername = name;
  localStorage.setItem("username", myUsername);
  usernameModal.style.display = "none";
  chatForm.style.display = "flex";
  socket.emit("setUsername", myUsername);
});

// Receive messages from server
socket.on("message", (message) => {
  addMessage(message);
});

// Add message to chat box
function addMessage(message) {
  const el = document.createElement("div");
  el.classList.add("message");

  if (message.type === "system") {
    el.classList.add("message-system");
    el.textContent = message.text;
  } else if (message.username === myUsername) {
    el.classList.add("message-you");
    el.textContent = message.text;
  } else {
    el.classList.add("message-other");
    el.innerHTML = `<strong>${escapeHtml(message.username)}</strong>: ${escapeHtml(message.text)}`;
  }

  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send chat messages
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  if (!myUsername) {
    alert("⚠️ You must set a username before chatting.");
    return;
  }
  socket.emit("message", text);
  chatInput.value = "";
});
