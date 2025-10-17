/**
 * OData Connector UI Component
 * Provides user interface for connecting to OData services
 */
class ODataConnectorUI {
    constructor(containerId, onSchemaLoaded) {
        this.container = document.getElementById(containerId);
        this.connector = new ODataConnector();
        this.onSchemaLoaded = onSchemaLoaded;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="odata-connector">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-cloud-arrow-down me-2"></i>OData Service Connection
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info mb-3">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Demo Available:</strong> Click "Load Demo" to test with a public OData service (TripPin Service)
                        </div>

                        <form id="odataConnectionForm">
                            <div class="mb-3">
                                <label for="serviceUrl" class="form-label">Service URL</label>
                                <input type="url" class="form-control" id="serviceUrl" 
                                       placeholder="https://services.odata.org/v4/TripPinServiceRW" required>
                                <div class="form-text">Enter the base URL of your OData service</div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="authType" class="form-label">Authentication</label>
                                    <select class="form-select" id="authType">
                                        <option value="none">None</option>
                                        <option value="basic">Basic Auth</option>
                                        <option value="bearer">Bearer Token</option>
                                        <option value="apikey">API Key</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="format" class="form-label">Preferred Format</label>
                                    <select class="form-select" id="format">
                                        <option value="json">JSON</option>
                                        <option value="xml">XML</option>
                                    </select>
                                </div>
                            </div>

                            <div id="authFields" style="display: none;">
                                <!-- Auth fields will be shown based on auth type -->
                            </div>

                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="button" class="btn btn-outline-info me-md-2" id="loadDemo">
                                    <i class="bi bi-star me-1"></i>Load Demo
                                </button>
                                <button type="button" class="btn btn-outline-secondary me-md-2" id="testConnection">
                                    <i class="bi bi-wifi me-1"></i>Test Connection
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-plug me-1"></i>Connect
                                </button>
                            </div>
                        </form>

                        <div id="connectionStatus" class="mt-3" style="display: none;">
                            <!-- Connection status will be shown here -->
                        </div>

                        <div id="entityList" class="mt-4" style="display: none;">
                            <h6>Available Entities:</h6>
                            <div class="list-group" id="entityListContainer">
                                <!-- Entities will be listed here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const form = document.getElementById('odataConnectionForm');
        const testBtn = document.getElementById('testConnection');
        const demoBtn = document.getElementById('loadDemo');
        const authType = document.getElementById('authType');

        // Handle auth type change
        authType.addEventListener('change', () => {
            this.updateAuthFields(authType.value);
        });

        // Handle demo button
        demoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadDemoService();
        });

        // Handle test connection
        testBtn.addEventListener('click', async () => {
            await this.testConnection();
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.connect();
        });
    }

    updateAuthFields(authType) {
        const authFields = document.getElementById('authFields');
        
        let html = '';
        switch (authType) {
            case 'basic':
                html = `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="username" required>
                        </div>
                        <div class="col-md-6">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="password" required>
                        </div>
                    </div>
                `;
                break;
            case 'bearer':
                html = `
                    <div class="mb-3">
                        <label for="bearerToken" class="form-label">Bearer Token</label>
                        <input type="password" class="form-control" id="bearerToken" 
                               placeholder="Enter your bearer token" required>
                    </div>
                `;
                break;
            case 'apikey':
                html = `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="apiKeyName" class="form-label">API Key Name</label>
                            <input type="text" class="form-control" id="apiKeyName" 
                                   placeholder="e.g., X-API-Key" required>
                        </div>
                        <div class="col-md-6">
                            <label for="apiKeyValue" class="form-label">API Key Value</label>
                            <input type="password" class="form-control" id="apiKeyValue" required>
                        </div>
                    </div>
                `;
                break;
        }
        
        authFields.innerHTML = html;
        authFields.style.display = authType === 'none' ? 'none' : 'block';
    }

    async testConnection() {
        const serviceUrl = document.getElementById('serviceUrl').value;
        
        if (!serviceUrl) {
            this.showStatus('Please enter a service URL', 'warning');
            return;
        }

        this.showStatus('Testing connection...', 'info', true);

        try {
            // Just try to fetch the service document
            const testConnector = new ODataConnector();
            const result = await testConnector.fetchServiceDocument();
            
            this.showStatus('Connection test successful!', 'success');
            console.log('Service document:', result);
            
        } catch (error) {
            this.showStatus(`Connection failed: ${error.message}`, 'danger');
        }
    }

    async connect() {
        const serviceUrl = document.getElementById('serviceUrl').value;
        const authType = document.getElementById('authType').value;
        
        this.showStatus('Connecting to OData service...', 'info', true);

        try {
            const options = this.buildAuthOptions(authType);
            const result = await this.connector.connect(serviceUrl, options);
            
            if (result.success) {
                this.showStatus(`Connected successfully! Found ${result.entities.length} entities.`, 'success');
                this.displayEntities();
            } else {
                this.showStatus(result.message, 'danger');
            }
        } catch (error) {
            this.showStatus(`Connection failed: ${error.message}`, 'danger');
        }
    }

    buildAuthOptions(authType) {
        const options = { headers: {} };
        
        switch (authType) {
            case 'basic':
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const encoded = btoa(`${username}:${password}`);
                options.headers['Authorization'] = `Basic ${encoded}`;
                break;
            case 'bearer':
                const token = document.getElementById('bearerToken').value;
                options.headers['Authorization'] = `Bearer ${token}`;
                break;
            case 'apikey':
                const keyName = document.getElementById('apiKeyName').value;
                const keyValue = document.getElementById('apiKeyValue').value;
                options.headers[keyName] = keyValue;
                break;
        }
        
        return options;
    }

    displayEntities() {
        const container = document.getElementById('entityListContainer');
        const entityList = document.getElementById('entityList');
        const entities = this.connector.getEntities();

        if (entities.length === 0) {
            container.innerHTML = '<div class="text-muted">No entities found</div>';
        } else {
            container.innerHTML = entities.map(entity => `
                <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
                        data-entity="${entity.name}">
                    <div>
                        <strong>${entity.name}</strong>
                        <small class="text-muted d-block">${entity.propertyCount} properties</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" data-action="preview" data-entity="${entity.name}">
                            <i class="bi bi-eye"></i> Preview
                        </button>
                        <button class="btn btn-sm btn-primary" data-action="load-schema" data-entity="${entity.name}">
                            <i class="bi bi-download"></i> Load Schema
                        </button>
                    </div>
                </button>
            `).join('');

            // Bind entity actions
            container.addEventListener('click', async (e) => {
                if (e.target.dataset.action === 'preview') {
                    await this.previewEntity(e.target.dataset.entity);
                } else if (e.target.dataset.action === 'load-schema') {
                    await this.loadEntitySchema(e.target.dataset.entity);
                }
            });
        }

        entityList.style.display = 'block';
    }

    async previewEntity(entityName) {
        try {
            this.showStatus(`Loading preview for ${entityName}...`, 'info', true);
            const data = await this.connector.fetchEntityData(entityName, 5);
            
            // Show preview in a modal or separate panel
            console.log(`Preview data for ${entityName}:`, data);
            
            // Show success even if empty (some entities might be empty)
            const recordCount = Array.isArray(data) ? data.length : 1;
            if (recordCount === 0) {
                this.showStatus(`Entity ${entityName} loaded but contains no data`, 'info');
            } else {
                this.showStatus(`Preview loaded for ${entityName} (${recordCount} records)`, 'success');
            }
        } catch (error) {
            this.showStatus(`Preview not available for ${entityName} - you can still load the schema`, 'warning');
            console.warn(`Preview error for ${entityName}:`, error);
        }
    }

    async loadEntitySchema(entityName) {
        try {
            const schema = this.connector.generateEntitySchema(entityName);
            
            if (this.onSchemaLoaded) {
                this.onSchemaLoaded(entityName, schema);
            }
            
            this.showStatus(`Schema loaded for ${entityName}`, 'success');
            
        } catch (error) {
            this.showStatus(`Failed to load schema: ${error.message}`, 'danger');
        }
    }

    showStatus(message, type = 'info', loading = false) {
        const status = document.getElementById('connectionStatus');
        const alertClass = `alert-${type}`;
        
        status.className = `alert ${alertClass}`;
        status.innerHTML = `
            ${loading ? '<i class="bi bi-clock spinner-border spinner-border-sm me-2"></i>' : ''}
            ${message}
        `;
        status.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success' && !loading) {
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Load demo OData service (TripPin - Microsoft's public test service)
     */
    loadDemoService() {
        // TripPin Service - Microsoft's official OData v4 test service
        // This service is publicly available and requires no authentication
        const demoUrl = 'https://services.odata.org/v4/TripPinServiceRW';
        
        document.getElementById('serviceUrl').value = demoUrl;
        document.getElementById('authType').value = 'none';
        
        this.updateAuthFields('none');
        
        this.showStatus('Demo service loaded! Click "Connect" to fetch entities.', 'info');
        
        // Auto-connect for convenience
        setTimeout(() => {
            this.connect();
        }, 500);
    }

    // Public methods for external access
    getConnector() {
        return this.connector;
    }

    isConnected() {
        return this.connector.isConnected;
    }
}