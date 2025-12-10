# Web UI (build)

A minimal web interface that runs the Llama 3.2 1B model **entirely in your browser** using [WebLLM](https://github.com/mlc-ai/web-llm) and WebGPU. No server required — all inference happens client-side.

## Requirements

- **Browser**: Chrome 113+, Edge 113+, or any browser with WebGPU support
- **GPU**: A WebGPU-compatible GPU (most modern GPUs work)
- **RAM**: ~4GB available for the 1B model

## Quick Start

1. Serve the `build/` folder with any static file server:

```bash
# Using Python
cd build && python -m http.server 8000

# Using Node.js (npx)
npx serve build

# Using PHP
cd build && php -S localhost:8000
```

2. Open `http://localhost:8000` in Chrome/Edge

3. Select a model and click **Load Model**

4. Start chatting!

## Available Models

| Model | Size | Notes |
| ----- | ---- | ----- |
| Llama 3.2 1B (q4f16) | ~600MB | Default, good balance |
| Llama 3.2 1B (q4f32) | ~1.2GB | Higher precision |
| Llama 3.2 3B (q4f16) | ~1.8GB | More capable, slower |
| Phi-3.5 Mini | ~2GB | Microsoft's small model |
| Qwen 2.5 1.5B | ~900MB | Alibaba's model |

Models are downloaded once and cached in the browser's IndexedDB.

## How It Works

1. **WebLLM** loads the model weights and WASM runtime into your browser
2. **WebGPU** accelerates inference using your GPU
3. Everything runs locally — no data leaves your machine

## Files

- `index.html` — Main page with model selector and chat UI
- `main.js` — WebLLM integration (imports from CDN)
- `styles.css` — Dark theme styling

## Troubleshooting

**"WebGPU is not supported"**
- Make sure you're using Chrome 113+ or Edge 113+
- On Linux, you may need to enable `chrome://flags/#enable-unsafe-webgpu`

**Model loading is slow**
- First load downloads the model (~600MB for 1B). Subsequent loads use the cached version.

**Out of memory**
- Close other GPU-intensive applications
- Try a smaller model (1B instead of 3B)

## Using a Custom/Fine-tuned Model

To use your own fine-tuned model with WebLLM, you need to compile it to MLC format. See the [MLC LLM documentation](https://llm.mlc.ai/docs/deploy/webllm.html) for instructions on:

1. Converting your model to MLC format
2. Hosting the model artifacts
3. Adding a custom model config to the WebLLM engine

## Resources

- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)
- [WebLLM Documentation](https://webllm.mlc.ai/)
- [MLC LLM (for custom models)](https://llm.mlc.ai/)
