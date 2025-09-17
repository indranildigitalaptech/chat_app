const socket = io();
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("user-msg");

// Ask for username when joining
let username = prompt("Enter your name:") || "Anonymous";
socket.emit("setUsername", username);

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
    div.textContent = message.text;
  } else if (message.user === username) {
    div.classList.add("you");
    div.textContent = message.text; // don’t prefix "You:"
  } else {
    div.classList.add("other");
    div.textContent = `${message.user}: ${message.text}`;
  }

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
