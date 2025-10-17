# WebLLM AI Assistant Component

## Overview

The WebLLM AI Assistant component enables in-browser Large Language Model (LLM) inference using Web LLM technology. It allows users to configure and run AI models directly in their browser on GPU or CPU hardware with auto-detection capabilities.

## Features

### 🎯 Core Capabilities

- **Hardware Auto-Detection**: Automatically detects available GPU (WebGPU) or CPU
- **Multiple AI Models**: Supports 7+ open-source models with varying sizes and capabilities
- **Model Management**: Load/unload models with progress tracking
- **Test Scenarios**: 4 pre-built test scenarios to verify model functionality
- **Streaming Responses**: Real-time streaming of model-generated text
- **Memory Management**: Check available system memory before loading models

### 🤖 Available Models

| Model | Size | Min RAM | Speed | Recommended |
|-------|------|---------|-------|-------------|
| TinyLlama 1.1B | 0.6 GB | 1 GB | ⚡ Fast | ✅ Yes |
| Phi 2.7B | 1.5 GB | 2 GB | ⚡ Very Fast | ✅ Yes |
| Llama 2 7B | 3.9 GB | 4 GB | ⚡ Fast | - |
| Llama 2 13B | 7.3 GB | 8 GB | ⏱ Moderate | - |
| Mistral 7B | 3.9 GB | 4 GB | ⚡ Fast | - |
| Neural Chat 3B | 1.7 GB | 2 GB | ⚡ Very Fast | - |
| Orca 2 7B | 3.9 GB | 4 GB | ⚡ Fast | - |

### 🧪 Test Scenarios

1. **Quick Test**: Quick response to verify model is working
2. **Schema Explanation**: Tests model knowledge of JSON schemas
3. **Code Generation**: Tests code generation capabilities
4. **Schema Mapping Help**: Tests reasoning for mapping tasks

## File Structure

```
components/
└── ai/
    ├── webllm-config.js       # Configuration and model management
    ├── webllm-ui.js           # User interface component
    └── README.md              # This file
```

## Installation & Setup

### 1. Add WebLLM Library to HTML

Add the WebLLM script to your `index.html` `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest"></script>
```

### 2. Include Component Scripts

The scripts are already included in `index.html`:

```html
<script src="components/ai/webllm-config.js"></script>
<script src="components/ai/webllm-ui.js"></script>
```

### 3. Access via UI

Click **"AI Assistant"** → **"Configure WebLLM"** in the top navigation menu.

## Usage

### Basic Usage Flow

1. **Open Modal**: Click "AI Assistant" → "Configure WebLLM"
2. **Check Hardware**: Review detected CPU/GPU and available memory
3. **Select Model**: Choose from available models based on your hardware
4. **Load Model**: Click "Load Model" and wait for download/initialization
5. **Test**: Run a test scenario to verify the model works
6. **Use**: Integrate with your mapping tool or queries

### Programmatic Usage

```javascript
// Create configuration
const webllmConfig = new WebLLMConfig();

// Check hardware
console.log(webllmConfig.hardwareInfo);
// Output: { gpu: { available: true, type: 'nvidia' }, memoryMB: 8000, device: 'gpu' }

// Get recommended models for this hardware
const recommended = webllmConfig.getRecommendedModels();
console.log(recommended.map(m => m.name));

// Initialize a model
await webllmConfig.initializeModel('Phi-2-q4f16_1-MLC', (progress) => {
    console.log(`Loading: ${progress * 100}%`);
});

// Run inference
const result = await webllmConfig.runTestScenario(
    'Explain JSON schema in one sentence',
    (chunk) => console.log(chunk)
);
console.log(result.response);

// Stop generation
await webllmConfig.stopGeneration();

// Unload model
await webllmConfig.unloadModel();
```

## API Reference

### WebLLMConfig Class

#### Constructor
```javascript
const config = new WebLLMConfig();
```

#### Methods

##### `detectHardware()`
Detects available GPU/CPU and system memory.

**Returns**: 
```javascript
{
    gpu: { available: boolean, type: string },
    memoryMB: number,
    device: 'gpu' | 'cpu'
}
```

##### `getAvailableModels()`
Returns list of all supported models with metadata.

**Returns**: Array of model objects with `name`, `id`, `size`, `minMemoryMB`, etc.

##### `getRecommendedModels()`
Returns models compatible with current hardware.

**Returns**: Filtered array of model objects

##### `async initializeModel(modelId, onProgress)`
Loads and initializes a model.

**Parameters**:
- `modelId` (string): Model identifier
- `onProgress` (function): Callback for progress updates

**Returns**: 
```javascript
{
    success: boolean,
    model: object,
    device: string,
    message: string
}
```

##### `async runTestScenario(testPrompt, onStreamCallback)`
Runs inference with streaming output.

**Parameters**:
- `testPrompt` (string): Input prompt for model
- `onStreamCallback` (function): Called for each text chunk

**Returns**:
```javascript
{
    success: boolean,
    response: string,
    model: string
}
```

##### `async stopGeneration()`
Stops current generation/inference.

**Returns**:
```javascript
{
    success: boolean,
    message: string
}
```

##### `async unloadModel()`
Unloads current model and frees memory.

**Returns**:
```javascript
{
    success: boolean,
    message: string
}
```

##### `getStatus()`
Gets current configuration status.

**Returns**:
```javascript
{
    isInitialized: boolean,
    currentModel: object | null,
    hardware: object,
    initProgress: number,
    engineReady: boolean
}
```

### WebLLMUI Class

#### Constructor
```javascript
const ui = new WebLLMUI(webllmConfig);
```

#### Methods

##### `render()`
Returns HTML string for the UI component.

**Returns**: HTML string

##### `bindEvents()`
Binds all UI event handlers. Must be called after inserting HTML into DOM.

## Architecture

### Component Flow

```
┌─────────────────────────┐
│   index.html Modal      │
│  (aiAssistantModal)     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    WebLLMUI             │
│  (Rendering & Events)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  WebLLMConfig           │
│  (Model Management)     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  @mlc-ai/web-llm        │
│  (Inference Engine)     │
└─────────────────────────┘
```

### Hardware Detection

- **GPU Detection**: Uses `navigator.gpu` API (WebGPU support)
- **GPU Types**: Detects NVIDIA, AMD, Intel, Apple Metal
- **Memory**: Uses `performance.memory.jsHeapSizeLimit` (fallback: 8GB estimate)
- **Device Priority**: GPU preferred if available, falls back to CPU

### Model Loading Process

1. User selects model from dropdown
2. UI displays model details and requirements
3. "Load Model" button becomes enabled
4. Click triggers `initializeModel()`
5. WebLLM downloads model weights from CDN
6. Progress bar updates during download/initialization
7. Once complete, test scenario section is enabled
8. Model remains in memory until explicitly unloaded

## Troubleshooting

### Issue: "WebGPU Not Available - Using CPU"

**Cause**: Browser doesn't support WebGPU

**Solution**:
- Update to latest Chrome/Edge (WebGPU stable)
- Use Chromium-based browser with WebGPU enabled
- Fallback to CPU (slower but works)

### Issue: Model loading takes very long or fails

**Cause**: Large model file, slow internet, or memory issues

**Solution**:
- Start with smaller models (TinyLlama, Phi)
- Check available disk space for cache
- Check browser console for specific errors
- Use browser DevTools Network tab to monitor downloads

### Issue: "Failed to fetch data" during test

**Cause**: Model not fully loaded, insufficient memory, or browser OOM

**Solution**:
- Wait for loading progress to reach 100%
- Close other memory-intensive applications
- Try smaller model
- Check browser memory usage in DevTools

### Issue: Streaming response is slow

**Cause**: CPU-only inference, large model, or system performance

**Solution**:
- Use GPU if available (check detected device)
- Try faster model (TinyLlama, Phi recommended)
- Close other browser tabs
- Increase system RAM if possible

## Browser Requirements

- **Chrome/Edge**: Version 113+ (WebGPU support)
- **Firefox**: Limited WebGPU support, works on CPU
- **Safari**: Limited support, may require beta versions
- **Mobile**: Not recommended (insufficient resources)

## Performance Considerations

### Memory Requirements

- **Typical System RAM**: 4-16 GB recommended
- **VRAM**: 2-8 GB for GPU acceleration
- **Browser Heap**: ~500MB-2GB typical allocation

### Model Selection Guidelines

- **Limited Resources** (≤4GB RAM): Use TinyLlama 1.1B or Phi 2.7B
- **Medium Resources** (4-8GB RAM): Use Llama 2 7B or Mistral 7B
- **High Resources** (8GB+ RAM): Use Llama 2 13B or Orca 2 7B
- **Production**: Smaller models for reliability

### Optimization Tips

1. Load model on-demand, not on startup
2. Unload model when not in use to free memory
3. Use streaming for long responses
4. Batch multiple queries when possible
5. Monitor browser memory in DevTools

## Security Considerations

- **Local Processing**: All inference runs in-browser (no data sent to servers)
- **Model Sources**: Models downloaded from CDN (MLC AI)
- **XSS Prevention**: HTML output properly escaped
- **No Persistence**: Models cached by browser, cleared with cache

## Future Enhancements

- [ ] Model fine-tuning interface
- [ ] Custom system prompts
- [ ] Response history/caching
- [ ] Batch processing support
- [ ] Model quantization options
- [ ] Export generated responses
- [ ] Integration with mapping tool suggestions

## References

- [Web LLM Documentation](https://webllm.mlc.ai/)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [Open Source Models](https://huggingface.co/models)

## License

This component follows the same license as the Mapping Tool project.
