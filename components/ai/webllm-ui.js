/**
 * WebLLM UI Component
 * Provides user interface for WebLLM configuration, model selection, and testing
 */
class WebLLMUI {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.isGenerating = false;
        this.currentTestScenarioIndex = 0;
    }

    /**
     * Render the main UI
     */
    render() {
        const html = `
            <div class="webllm-ui">
                <!-- Hardware Detection Section -->
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-cpu me-2"></i> Hardware Information
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-2">
                                    <strong>Processing Unit:</strong>
                                    <span class="badge ${this.config.hardwareInfo.device === 'gpu' ? 'bg-success' : 'bg-info'} ms-2">
                                        ${this.config.hardwareInfo.device.toUpperCase()}
                                    </span>
                                </p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-2">
                                    <strong>Memory Available:</strong>
                                    <span class="badge bg-secondary ms-2">${this.config.hardwareInfo.memoryMB} MB</span>
                                </p>
                            </div>
                        </div>
                        ${this.config.hardwareInfo.gpu.available ? `
                            <p class="mb-0 small text-success">
                                <i class="bi bi-check-circle me-1"></i>
                                WebGPU Available (${this.config.hardwareInfo.gpu.type})
                            </p>
                        ` : `
                            <p class="mb-0 small text-warning">
                                <i class="bi bi-exclamation-circle me-1"></i>
                                WebGPU Not Available - Using CPU
                            </p>
                        `}
                    </div>
                </div>

                <!-- Model Selection Section -->
                <div class="card mb-3">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-robot me-2"></i> Model Selection
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="modelSelect" class="form-label">Choose a Model:</label>
                            <select id="modelSelect" class="form-select">
                                <option value="">-- Select a model --</option>
                                ${this.config.getRecommendedModels().map(model => `
                                    <option value="${model.id}" data-size="${model.size}" data-min-memory="${model.minMemoryMB}">
                                        ${model.name} ${model.recommended ? '⭐ (Recommended)' : ''} - ${model.size}
                                    </option>
                                `).join('')}
                                ${this.config.models.length > this.config.getRecommendedModels().length ? '<optgroup label="Other Models">' : ''}
                                ${this.config.models.filter(m => !this.config.getRecommendedModels().includes(m)).map(model => `
                                    <option value="${model.id}" data-size="${model.size}" data-min-memory="${model.minMemoryMB}">
                                        ${model.name} - ${model.size}
                                    </option>
                                `).join('')}
                                ${this.config.models.length > this.config.getRecommendedModels().length ? '</optgroup>' : ''}
                            </select>
                        </div>

                        <!-- Model Details -->
                        <div id="modelDetails" class="alert alert-light d-none">
                            <div id="modelDetailsContent"></div>
                        </div>

                        <!-- Load Model Button -->
                        <div class="mb-3">
                            <button id="loadModelBtn" class="btn btn-primary w-100" disabled>
                                <i class="bi bi-download me-2"></i> Load Model
                            </button>
                        </div>

                        <!-- Progress Bar -->
                        <div id="loadProgress" class="d-none">
                            <div class="mb-2">
                                <small class="text-muted">Loading model...</small>
                            </div>
                            <div class="progress mb-2" style="height: 25px;">
                                <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%;">
                                    <span id="progressText" class="ms-2">0%</span>
                                </div>
                            </div>
                            <button id="cancelLoadBtn" class="btn btn-sm btn-danger w-100">Cancel</button>
                        </div>

                        <!-- Model Status -->
                        <div id="modelStatus" class="alert alert-success d-none">
                            <i class="bi bi-check-circle me-2"></i>
                            Model loaded: <strong id="loadedModelName"></strong>
                        </div>

                        <!-- Unload Button -->
                        <div id="unloadContainer" class="d-none">
                            <button id="unloadModelBtn" class="btn btn-warning w-100">
                                <i class="bi bi-trash me-2"></i> Unload Model (Free Memory)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Test Scenario Section -->
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-play-circle me-2"></i> Test Scenario
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="testScenarioSelect" class="form-label">Select Test Scenario:</label>
                            <select id="testScenarioSelect" class="form-select" disabled>
                                ${this.config.getTestScenarios().map((scenario, idx) => `
                                    <option value="${idx}">${scenario.name}</option>
                                `).join('')}
                            </select>
                            <small class="text-muted d-block mt-2" id="scenarioDescription"></small>
                        </div>

                        <div class="mb-3">
                            <label for="testPrompt" class="form-label">Custom Prompt (or use selected scenario):</label>
                            <textarea id="testPrompt" class="form-control" rows="3" placeholder="Enter your test prompt here..." disabled></textarea>
                        </div>

                        <button id="runTestBtn" class="btn btn-success w-100 mb-2" disabled>
                            <i class="bi bi-play me-2"></i> Run Test
                        </button>

                        <button id="stopTestBtn" class="btn btn-danger w-100 d-none">
                            <i class="bi bi-stop me-2"></i> Stop Generation
                        </button>

                        <!-- Test Result -->
                        <div id="testResult" class="mt-3 d-none">
                            <div class="card bg-light">
                                <div class="card-header">
                                    <small class="text-muted">Model Response</small>
                                </div>
                                <div class="card-body">
                                    <div id="testResultContent" class="small" style="max-height: 400px; overflow-y: auto;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Bind all UI event handlers
     */
    bindEvents() {
        // Model selection change
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => this.onModelSelected(e));
        }

        // Load model button
        const loadModelBtn = document.getElementById('loadModelBtn');
        if (loadModelBtn) {
            loadModelBtn.addEventListener('click', () => this.loadModel());
        }

        // Unload model button
        const unloadModelBtn = document.getElementById('unloadModelBtn');
        if (unloadModelBtn) {
            unloadModelBtn.addEventListener('click', () => this.unloadModel());
        }

        // Test scenario selection
        const testScenarioSelect = document.getElementById('testScenarioSelect');
        if (testScenarioSelect) {
            testScenarioSelect.addEventListener('change', (e) => this.onScenarioSelected(e));
        }

        // Run test button
        const runTestBtn = document.getElementById('runTestBtn');
        if (runTestBtn) {
            runTestBtn.addEventListener('click', () => this.runTest());
        }

        // Stop test button
        const stopTestBtn = document.getElementById('stopTestBtn');
        if (stopTestBtn) {
            stopTestBtn.addEventListener('click', () => this.stopTest());
        }

        // Cancel load button
        const cancelLoadBtn = document.getElementById('cancelLoadBtn');
        if (cancelLoadBtn) {
            cancelLoadBtn.addEventListener('click', () => this.cancelLoad());
        }

        // Set initial scenario description
        if (testScenarioSelect) {
            this.updateScenarioDescription();
        }
    }

    /**
     * Handle model selection
     */
    onModelSelected(event) {
        const selectedId = event.target.value;
        const loadModelBtn = document.getElementById('loadModelBtn');
        const modelDetails = document.getElementById('modelDetails');
        const modelDetailsContent = document.getElementById('modelDetailsContent');

        if (!selectedId) {
            loadModelBtn.disabled = true;
            modelDetails.classList.add('d-none');
            return;
        }

        loadModelBtn.disabled = false;

        // Find and display model details
        const model = this.config.models.find(m => m.id === selectedId);
        if (model) {
            modelDetailsContent.innerHTML = `
                <strong>${model.name}</strong><br>
                <small>${model.description}</small><br>
                <div class="mt-2">
                    <span class="badge bg-info">Size: ${model.size}</span>
                    <span class="badge bg-secondary">Min RAM: ${model.minMemoryMB} MB</span>
                    <span class="badge bg-primary">Latency: ${model.maxLatency}</span>
                </div>
            `;
            modelDetails.classList.remove('d-none');
        }
    }

    /**
     * Load selected model
     */
    async loadModel() {
        const modelSelect = document.getElementById('modelSelect');
        const selectedId = modelSelect.value;

        if (!selectedId) {
            alert('Please select a model first');
            return;
        }

        const loadModelBtn = document.getElementById('loadModelBtn');
        const loadProgress = document.getElementById('loadProgress');
        const modelDetails = document.getElementById('modelDetails');
        const modelStatus = document.getElementById('modelStatus');

        loadModelBtn.disabled = true;
        loadProgress.classList.remove('d-none');
        modelDetails.classList.add('d-none');

        try {
            await this.config.initializeModel(selectedId, (info) => {
                this.updateProgressBar(info.progress);
            });

            // Show success
            loadProgress.classList.add('d-none');
            modelStatus.classList.remove('d-none');
            document.getElementById('loadedModelName').textContent = this.config.currentModel.name;

            // Enable test section
            this.enableTestScenario();

            // Show unload button
            document.getElementById('unloadContainer').classList.remove('d-none');

            // Show success alert
            this.showAlert('success', `✅ ${this.config.currentModel.name} loaded successfully!`);
        } catch (error) {
            loadProgress.classList.add('d-none');
            loadModelBtn.disabled = false;
            
            // Format error message for display
            let displayError = error.message;
            if (error.message.includes('not found')) {
                // Try to extract and format available models list
                displayError = error.message.replace(/\n/g, '<br>');
            }
            
            this.showAlert('danger', `❌ Error loading model:<br>${displayError}`);
            console.error('Load error:', error);
        }
    }

    /**
     * Unload current model
     */
    async unloadModel() {
        try {
            await this.config.unloadModel();
            document.getElementById('modelStatus').classList.add('d-none');
            document.getElementById('unloadContainer').classList.add('d-none');
            document.getElementById('loadModelBtn').disabled = false;
            this.disableTestScenario();
            this.showAlert('success', '✅ Model unloaded, memory freed');
        } catch (error) {
            this.showAlert('danger', `❌ Error unloading model: ${error.message}`);
        }
    }

    /**
     * Update progress bar during model loading
     */
    updateProgressBar(progress) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const percentage = Math.round(progress * 100);
        progressBar.style.width = percentage + '%';
        progressText.textContent = percentage + '%';
    }

    /**
     * Update scenario description
     */
    updateScenarioDescription() {
        const testScenarioSelect = document.getElementById('testScenarioSelect');
        const scenarioDescription = document.getElementById('scenarioDescription');
        const idx = parseInt(testScenarioSelect.value) || 0;
        const scenario = this.config.getTestScenarios()[idx];
        if (scenario) {
            scenarioDescription.textContent = scenario.description;
            // Pre-fill the test prompt
            document.getElementById('testPrompt').value = scenario.prompt;
        }
    }

    /**
     * Handle scenario selection
     */
    onScenarioSelected(event) {
        this.updateScenarioDescription();
    }

    /**
     * Run test scenario
     */
    async runTest() {
        const testPrompt = document.getElementById('testPrompt').value || this.config.getDefaultTestPrompt();
        
        if (!testPrompt.trim()) {
            alert('Please enter a test prompt');
            return;
        }

        this.isGenerating = true;
        const runTestBtn = document.getElementById('runTestBtn');
        const stopTestBtn = document.getElementById('stopTestBtn');
        const testResult = document.getElementById('testResult');
        const testResultContent = document.getElementById('testResultContent');

        runTestBtn.disabled = true;
        stopTestBtn.classList.remove('d-none');
        testResult.classList.remove('d-none');
        testResultContent.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div> Generating response...';

        try {
            let fullResponse = '';
            
            await this.config.runTestScenario(testPrompt, (chunk) => {
                fullResponse += chunk;
                testResultContent.innerHTML = `<div>${this.escapeHtml(fullResponse)}</div><span class="spinner-border spinner-border-sm ms-2" role="status"></span>`;
                testResultContent.parentElement.scrollTop = testResultContent.parentElement.scrollHeight;
            });

            testResultContent.innerHTML = `<div>${this.escapeHtml(fullResponse)}</div>`;
            this.showAlert('success', '✅ Test completed successfully');
        } catch (error) {
            testResultContent.innerHTML = `<div class="text-danger"><strong>Error:</strong> ${this.escapeHtml(error.message)}</div>`;
            this.showAlert('danger', `❌ Error: ${error.message}`);
        } finally {
            this.isGenerating = false;
            runTestBtn.disabled = false;
            stopTestBtn.classList.add('d-none');
        }
    }

    /**
     * Stop test generation
     */
    stopTest() {
        try {
            this.config.stopGeneration();
            this.showAlert('info', 'ℹ️ Generation stopped');
        } catch (error) {
            this.showAlert('danger', `❌ Error stopping generation: ${error.message}`);
        }
    }

    /**
     * Cancel model loading
     */
    cancelLoad() {
        // This would require engine support for cancellation
        this.showAlert('info', 'ℹ️ Load cancelled');
        document.getElementById('loadProgress').classList.add('d-none');
        document.getElementById('loadModelBtn').disabled = false;
    }

    /**
     * Enable test scenario section
     */
    enableTestScenario() {
        document.getElementById('testScenarioSelect').disabled = false;
        document.getElementById('testPrompt').disabled = false;
        document.getElementById('runTestBtn').disabled = false;
    }

    /**
     * Disable test scenario section
     */
    disableTestScenario() {
        document.getElementById('testScenarioSelect').disabled = true;
        document.getElementById('testPrompt').disabled = true;
        document.getElementById('runTestBtn').disabled = true;
        document.getElementById('testResult').classList.add('d-none');
    }

    /**
     * Show alert message
     */
    showAlert(type, message) {
        const container = document.querySelector('.webllm-ui');
        if (!container) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        container.insertBefore(alert, container.firstChild);
        setTimeout(() => alert.remove(), 4000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebLLMUI;
}
