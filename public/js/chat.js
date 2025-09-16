const socket = io();
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("user-msg");

// Store my socket id when received
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

// Listen for messages
socket.on("message", (message) => {
  addMessage(message);
});

// Add message to chat box
function addMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");

  if (message.type === "system") {
    div.classList.add("system");
  } else if (message.id === myId) {
    div.classList.add("you");
  } else {
    div.classList.add("other");
  }

  div.textContent = message.text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight; // auto scroll
}

// Handle form submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const chatMessage = chatInput.value.trim();

  if (chatMessage) {
    socket.emit("message", chatMessage);
    chatInput.value = "";
  }
});
