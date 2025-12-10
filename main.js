import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// DOM elements
const modelSelect = document.getElementById("model-select");
const loadBtn = document.getElementById("load-btn");
const loadProgress = document.getElementById("load-progress");
const loadSection = document.getElementById("load-section");
const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const promptInput = document.getElementById("prompt");

let engine = null;
const conversationHistory = [];

// Append a message bubble to the chat log
function appendMessage(role, text) {
  const entry = document.createElement("div");
  entry.className = `chat-entry chat-entry--${role.toLowerCase()}`;
  entry.innerHTML = `<span class="chat-role">${role}</span><span class="chat-text">${escapeHtml(text)}</span>`;
  chatLog.appendChild(entry);
  chatLog.scrollTop = chatLog.scrollHeight;
  return entry;
}

// Update text in an existing message bubble (for streaming)
function updateMessage(entry, text) {
  entry.querySelector(".chat-text").textContent = text;
  chatLog.scrollTop = chatLog.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Progress callback during model load
function onInitProgress(report) {
  loadProgress.textContent = report.text;
}

// Load the selected model
async function loadModel() {
  const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
  loadBtn.disabled = true;
  loadBtn.textContent = "Loading…";
  loadProgress.textContent = "Initializing WebLLM engine…";

  try {
    engine = await webllm.CreateMLCEngine(selectedModel, {
      initProgressCallback: onInitProgress,
    });
    loadProgress.textContent = `✅ ${selectedModel} loaded successfully!`;
    loadSection.style.display = "none";
    chatForm.style.display = "block";
  } catch (err) {
    loadProgress.textContent = `❌ Failed to load model: ${err.message}`;
    loadBtn.disabled = false;
    loadBtn.textContent = "Load Model";
    console.error(err);
  }
}

// Send a message and stream the response
async function sendMessage(userMessage, temperature) {
  conversationHistory.push({ role: "user", content: userMessage });

  const messages = [
    { role: "system", content: "You are a helpful AI assistant." },
    ...conversationHistory,
  ];

  // Create placeholder for assistant response
  const assistantEntry = appendMessage("Assistant", "");
  let assistantReply = "";

  try {
    const chunks = await engine.chat.completions.create({
      messages,
      temperature,
      stream: true,
    });

    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content || "";
      assistantReply += delta;
      updateMessage(assistantEntry, assistantReply);
    }

    conversationHistory.push({ role: "assistant", content: assistantReply });
    status.textContent = "Ready";
  } catch (err) {
    updateMessage(assistantEntry, `Error: ${err.message}`);
    status.textContent = `Error: ${err.message}`;
    console.error(err);
  }
}
loadModel();

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || !engine) return;

  appendMessage("You", userMessage);
  promptInput.value = "";
  status.textContent = "Generating…";
  chatForm.querySelector("button").disabled = true;

  await sendMessage(userMessage, parseFloat(temperatureInput.value));

  chatForm.querySelector("button").disabled = false;
});

(async () => {
  if (!navigator.gpu) {
    loadProgress.textContent = "❌ WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+.";
    loadBtn.disabled = true;
    return;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    loadProgress.textContent = "❌ No WebGPU adapter found. Make sure your GPU drivers are up to date.";
    loadBtn.disabled = true;
    return;
  }
  loadProgress.textContent = "WebGPU available ✓ — select a model and click Load.";
})();
