import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const loading = document.getElementById("loading");
const loadProgress = document.getElementById("load-progress");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("send-btn");

let engine = null;
const conversationHistory = [];

// Auto-resize textarea
promptInput.addEventListener("input", () => {
  promptInput.style.height = "auto";
  promptInput.style.height = Math.min(promptInput.scrollHeight, 200) + "px";
});

// Submit on Enter (Shift+Enter for newline)
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled && promptInput.value.trim()) {
      chatForm.requestSubmit();
    }
  }
});

function createMessage(role, content = "") {
  const isUser = role === "user";
  const div = document.createElement("div");
  div.className = `message message--${isUser ? "user" : "ai"}`;
  div.innerHTML = `
    <div class="avatar">${isUser ? "Y" : "AI"}</div>
    <div class="bubble">${content || '<div class="typing"><span></span><span></span><span></span></div>'}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function updateMessage(el, text) {
  el.querySelector(".bubble").textContent = text;
  messages.scrollTop = messages.scrollHeight;
}

function onInitProgress(report) {
  loadProgress.textContent = report.text;
}

async function loadModel() {
  loadProgress.textContent = "Checking WebGPU support…";

  if (!navigator.gpu) {
    loadProgress.innerHTML = `
      <strong>WebGPU not supported</strong><br><br>
      <span style="font-size: 0.8rem; opacity: 0.8">
        <b>Desktop:</b> Chrome 113+, Edge 113+<br>
        iPhone 15/15 Plus, iPhone 14 are NOT supported
      </span>
    `;
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    loadProgress.textContent = "No WebGPU adapter found. Your GPU may not be supported.";
    return;
  }

  loadProgress.textContent = "Loading model…";

  try {
    engine = await webllm.CreateMLCEngine("Llama-3.2-1B-Instruct-q4f16_1-MLC", {
      initProgressCallback: onInitProgress,
    });
    loading.classList.add("hidden");
    sendBtn.disabled = false;
    promptInput.focus();
  } catch (err) {
    loadProgress.textContent = `Failed: ${err.message}`;
    console.error(err);
  }
}

async function sendMessage(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  const aiMessage = createMessage("ai");

  try {
    const chunks = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        ...conversationHistory,
      ],
      temperature: 0.7,
      stream: true,
    });

    let reply = "";
    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content || "";
      reply += delta;
      updateMessage(aiMessage, reply);
    }

    conversationHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    updateMessage(aiMessage, `Error: ${err.message}`);
    console.error(err);
  }
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = promptInput.value.trim();
  if (!text || !engine) return;

  createMessage("user", text);
  promptInput.value = "";
  promptInput.style.height = "auto";
  sendBtn.disabled = true;

  await sendMessage(text);

  sendBtn.disabled = false;
  promptInput.focus();
});

loadModel();
