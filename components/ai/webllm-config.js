/**
 * WebLLM Configuration Manager
 * Manages model selection, hardware detection, and WebLLM initialization
 */
class WebLLMConfig {
    constructor() {
        this.engine = null;
        this.currentModel = null;
        this.isInitialized = false;
        this.hardwareInfo = this.detectHardware();
        this.models = this.getAvailableModels();
        this.initProgress = 0;
        this.shouldStop = false; // Flag for stopping generation
    }

    /**
     * Detect available hardware (GPU/CPU)
     */
    detectHardware() {
        const info = {
            gpu: this.checkWebGPU(),
            memoryMB: this.getAvailableMemory(),
            device: 'cpu' // default
        };

        // Prefer GPU if available
        if (info.gpu.available) {
            info.device = 'gpu';
        }

        return info;
    }

    /**
     * Check if WebGPU is available
     */
    checkWebGPU() {
        const available = !!navigator.gpu;
        let type = 'unknown';
        
        if (available) {
            // Detect GPU type (can be enhanced with more specific detection)
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes('nvidia')) {
                type = 'nvidia';
            } else if (userAgent.includes('amd') || userAgent.includes('radeon')) {
                type = 'amd';
            } else if (userAgent.includes('intel')) {
                type = 'intel';
            } else if (userAgent.includes('apple')) {
                type = 'metal';
            }
        }

        return {
            available,
            type
        };
    }

    /**
     * Get approximate available system memory
     */
    getAvailableMemory() {
        try {
            if (performance.memory) {
                // Rough estimate based on heap size
                return Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024));
            }
        } catch (e) {
            // Not available in all browsers
        }
        return 8000; // Default estimate
    }

    /**
     * Get list of available models with metadata
     */
    getAvailableModels() {
        // Try to get models dynamically from WebLLM's appConfig
        try {
            if (window.webllm && window.webllm.MLCEngine) {
                const engine = new window.webllm.MLCEngine();
                
                // Check if appConfig exists and has model_list
                if (engine.appConfig && engine.appConfig.model_list && Array.isArray(engine.appConfig.model_list)) {
                    console.log('✅ Found models in WebLLM appConfig:', engine.appConfig.model_list.length);
                    console.log('Model details:', engine.appConfig.model_list);
                    
                    return engine.appConfig.model_list.map(m => {
                        // Extract size from model metadata
                        let sizeGB = 'Unknown';
                        let sizeBytes = 2 * 1024 * 1024 * 1024; // default
                        
                        if (m.model_library_url) {
                            // Try to extract size from URL or other properties
                            console.log(`Model: ${m.model_id}, URL: ${m.model_library_url}`);
                        }
                        
                        // Try common size patterns
                        if (m.model_id) {
                            const id = m.model_id.toLowerCase();
                            if (id.includes('gemma-2b')) {
                                sizeGB = '1.4 GB';
                                sizeBytes = 1.4 * 1024 * 1024 * 1024;
                            } else if (id.includes('tinyllama') || id.includes('1.1b')) {
                                sizeGB = '0.6 GB';
                                sizeBytes = 0.6 * 1024 * 1024 * 1024;
                            } else if (id.includes('phi-2') || id.includes('2.7b')) {
                                sizeGB = '1.5 GB';
                                sizeBytes = 1.5 * 1024 * 1024 * 1024;
                            } else if (id.includes('mistral') && id.includes('7b')) {
                                sizeGB = '3.9 GB';
                                sizeBytes = 3.9 * 1024 * 1024 * 1024;
                            } else if (id.includes('7b')) {
                                sizeGB = '3.5-4 GB';
                                sizeBytes = 3.5 * 1024 * 1024 * 1024;
                            } else if (id.includes('13b')) {
                                sizeGB = '7-8 GB';
                                sizeBytes = 7.5 * 1024 * 1024 * 1024;
                            }
                        }
                        
                        return {
                            name: m.model_id.split('/').pop().split('-').slice(0, -1).join(' ') || m.model_id,
                            id: m.model_id,
                            size: sizeGB,
                            sizeBytes: sizeBytes,
                            description: m.model_id,
                            minMemoryMB: Math.ceil(sizeBytes / (1024 * 1024)) + 512,
                            maxLatency: 'Medium',
                            quantization: 'q4f16_1',
                            recommended: true
                        };
                    });
                }
            }
        } catch (e) {
            console.warn('Could not fetch models from WebLLM appConfig:', e);
        }

        // Fallback: default model list
        console.log('ℹ️ Using fallback model list');
        return [
            {
                name: 'Gemma 2B',
                id: 'gemma-2b-it-q4f16_1-MLC',
                size: '1.4 GB',
                sizeBytes: 1.4 * 1024 * 1024 * 1024,
                description: 'Google\'s Gemma - ultra-compact, instruction-tuned',
                minMemoryMB: 1536,
                maxLatency: 'Very Fast',
                quantization: 'q4f16_1',
                recommended: true
            },
            {
                name: 'TinyLlama 1.1B',
                id: 'TinyLlama-1.1b-chat-v1.0-q4f16_1-MLC',
                size: '0.6 GB',
                sizeBytes: 0.6 * 1024 * 1024 * 1024,
                description: 'Compact model, great for testing and low-resource devices',
                minMemoryMB: 1024,
                maxLatency: 'Very Fast',
                quantization: 'q4f16_1',
                recommended: true
            },
            {
                name: 'Phi 2.7B',
                id: 'Phi-2-q4f16_1-MLC',
                size: '1.5 GB',
                sizeBytes: 1.5 * 1024 * 1024 * 1024,
                description: 'Microsoft\'s efficient model, good balance of speed and quality',
                minMemoryMB: 2048,
                maxLatency: 'Very Fast',
                quantization: 'q4f16_1',
                recommended: true
            },
            {
                name: 'Mistral 7B',
                id: 'Mistral-7B-Instruct-v0.2-q4f16_1-MLC',
                size: '3.9 GB',
                sizeBytes: 3.9 * 1024 * 1024 * 1024,
                description: 'Fast and capable model, good for instruction following',
                minMemoryMB: 4096,
                maxLatency: 'Fast',
                quantization: 'q4f16_1',
                recommended: false
            }
        ];
    }

    /**
     * Get recommended models based on available hardware
     */
    getRecommendedModels() {
        const memMB = this.hardwareInfo.memoryMB;
        return this.models.filter(model => {
            if (memMB < model.minMemoryMB) {
                return false;
            }
            return true;
        });
    }

    /**
     * Initialize WebLLM with selected model
     */
    async initializeModel(modelId, onProgress) {
        if (!modelId) {
            throw new Error('Model ID is required');
        }

        try {
            // Import WebLLM dynamically
            if (!window.webllm) {
                throw new Error('WebLLM library not loaded. Add <script src="https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest"></script> to your HTML');
            }

            const { MLCEngine } = window.webllm;
            
            // Create or reinitialize engine
            if (!this.engine) {
                this.engine = new MLCEngine({
                    initProgressCallback: (info) => {
                        this.initProgress = info.progress;
                        if (onProgress) {
                            onProgress(info);
                        }
                    }
                });
            }

            // Get available models from engine to verify modelId
            let availableModels = [];
            try {
                availableModels = this.engine.listModels();
                console.log('✅ Available WebLLM models:', availableModels);
                
                // Check if requested model is available
                if (!availableModels.includes(modelId)) {
                    const modelList = availableModels.slice(0, 15).join('\n- ');
                    throw new Error(
                        `Model "${modelId}" not found.\n\n` +
                        `Available models (showing first 15):\n- ${modelList}` +
                        (availableModels.length > 15 ? `\n... and ${availableModels.length - 15} more` : '')
                    );
                }
            } catch (e) {
                if (e.message.includes('not found')) {
                    throw e;
                }
                // Continue if listModels fails - engine might still load it
                console.warn('Could not verify model availability:', e);
            }

            // Load the model
            console.log(`Loading model: ${modelId}...`);
            await this.engine.reload(modelId);
            
            // Find model metadata (or create basic entry)
            let modelInfo = this.models.find(m => m.id === modelId);
            if (!modelInfo) {
                modelInfo = {
                    name: modelId,
                    id: modelId,
                    size: 'Unknown',
                    description: 'WebLLM model'
                };
                this.models.push(modelInfo);
            }
            
            this.currentModel = modelInfo;
            this.isInitialized = true;
            this.initProgress = 100;

            console.log(`✅ Model loaded successfully: ${this.currentModel.name}`);
            return {
                success: true,
                model: this.currentModel,
                device: this.hardwareInfo.device,
                message: `Successfully loaded ${this.currentModel.name}`
            };
        } catch (error) {
            console.error('❌ Error initializing WebLLM:', error);
            throw error;
        }
    }

    /**
     * Run test scenario with the current model
     */
    async runTestScenario(testPrompt, onStreamCallback) {
        if (!this.isInitialized || !this.engine) {
            throw new Error('WebLLM is not initialized. Please load a model first.');
        }

        try {
            this.shouldStop = false; // Reset stop flag
            
            const messages = [
                {
                    role: 'user',
                    content: testPrompt || this.getDefaultTestPrompt()
                }
            ];

            let fullResponse = '';
            
            // Stream the response
            const asyncChunkGenerator = await this.engine.chat.completions.create({
                messages,
                stream: true,
                temperature: 0.7,
                top_p: 0.95,
                max_tokens: 512
            });

            for await (const chunk of asyncChunkGenerator) {
                // Check if generation should be stopped
                if (this.shouldStop) {
                    console.log('Generation stopped by user');
                    break;
                }
                
                const delta = chunk.choices[0].delta;
                if (delta.content) {
                    fullResponse += delta.content;
                    if (onStreamCallback) {
                        onStreamCallback(delta.content);
                    }
                }
            }

            return {
                success: true,
                response: fullResponse,
                model: this.currentModel.name
            };
        } catch (error) {
            console.error('Error running test scenario:', error);
            throw error;
        }
    }

    /**
     * Get default test prompt
     */
    getDefaultTestPrompt() {
        return 'Explain in one sentence what JSON schema mapping is and why it\'s useful.';
    }

    /**
     * Get test scenarios
     */
    getTestScenarios() {
        return [
            {
                name: 'Quick Test',
                prompt: this.getDefaultTestPrompt(),
                description: 'Quick response to verify model is working'
            },
            {
                name: 'Schema Explanation',
                prompt: 'Provide a brief explanation of JSON schema validation and its use cases.',
                description: 'Tests model knowledge of JSON schemas'
            },
            {
                name: 'Code Generation',
                prompt: 'Write a simple JavaScript function that validates if a value is a valid email address.',
                description: 'Tests code generation capabilities'
            },
            {
                name: 'Schema Mapping Help',
                prompt: 'How would you approach mapping a customer database schema to an e-commerce API schema? List the key steps.',
                description: 'Tests reasoning for mapping tasks'
            }
        ];
    }

    /**
     * Get current configuration status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentModel: this.currentModel,
            hardware: this.hardwareInfo,
            initProgress: this.initProgress,
            engineReady: !!this.engine
        };
    }

    /**
     * Unload current model to free memory
     */
    async unloadModel() {
        try {
            // Set stop flag in case generation is running
            this.shouldStop = true;
            
            // Reset engine state
            this.engine = null;
            this.isInitialized = false;
            this.currentModel = null;
            this.initProgress = 0;
            
            return { success: true, message: 'Model unloaded successfully' };
        } catch (error) {
            console.error('Error unloading model:', error);
            throw error;
        }
    }

    /**
     * Stop current generation
     */
    stopGeneration() {
        this.shouldStop = true;
        console.log('Generation stop requested');
        return { success: true, message: 'Generation stopped' };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebLLMConfig;
}
