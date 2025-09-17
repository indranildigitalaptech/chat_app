// public/js/chat.js
const socket = io();

let myUsername = null;

const usernameModal = document.getElementById("username-modal");
const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");

// simple html-escape to avoid XSS when injecting text
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"'`=\/]/g, function(s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    })[s];
  });
}

// show modal by default (overlay CSS ensures it's visible)
usernameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return;
  myUsername = name;

  // Tell server about username (must match server event)
  socket.emit("setUsername", myUsername);

  // Hide modal and show chat input
  usernameModal.style.display = "none";
  chatForm.style.display = "flex";
});

// receive messages
socket.on("message", (message) => {
  addMessage(message);
});

function addMessage(message) {
  const el = document.createElement("div");
  el.classList.add("message");

  if (message.type === "system") {
    el.classList.add("message-system");
    el.textContent = message.text;
  } else if (message.type === "user") {
    // own message
    if (message.username === myUsername) {
      el.classList.add("message-you");
      // show text only for own messages
      el.textContent = message.text;
    } else {
      el.classList.add("message-other");
      el.innerHTML = `<strong>${escapeHtml(message.username)}</strong>: ${escapeHtml(message.text)}`;
    }
  } else {
    // fallback
    el.textContent = message.text || "";
  }

  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// send chat
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  if (!myUsername) {
    // safety: don't allow sending before username is set
    socket.emit("message", text); // server will reject if no username
    return;
  }
  socket.emit("message", text);
  chatInput.value = "";
});
