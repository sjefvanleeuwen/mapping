class MappingTool {
    constructor() {
        this.mappings = [];
        this.functoids = [];
        this.selectedConnector = null;
        this.tempLine = null;
        this.functoidCounter = 0;
        this.isDraggingFunctoid = false;
        this.draggedFunctoid = null;
        this.dragOffset = { x: 0, y: 0 };
        this.sourceSchema = null;
        this.destinationSchema = null;
        this.selectedField = null; // For property inspector
        this.isGenerating = false; // Flag for disabling field selection during generation
        
        this.svg = document.getElementById('mappingSvg');
        this.functoidArea = document.getElementById('functoidArea');
        this.mappingCanvas = document.querySelector('.mapping-canvas');
        this.sourceSchemaContainer = document.getElementById('sourceSchema');
        this.destSchemaContainer = document.getElementById('destinationSchema');
        
        this.init();
    }
    
    // JSON Syntax Highlighting Helper
    formatJSONWithSyntaxHighlight(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
    
    // Helper methods for component compatibility (textarea vs json-editor vs json-viewer)
    getElementValue(element) {
        if (!element) return '';
        
        if (element.tagName === 'JSON-EDITOR') {
            return element.getValue();
        } else if (element.tagName === 'TEXTAREA') {
            return element.value;
        } else if (element.value !== undefined) {
            return element.value;
        }
        return '';
    }
    
    setElementValue(element, value) {
        if (!element) return;
        
        if (element.tagName === 'JSON-EDITOR') {
            element.setValue(value);
        } else if (element.tagName === 'TEXTAREA') {
            element.value = value;
        } else if (element.value !== undefined) {
            element.value = value;
        }
    }
    
    init() {
        this.attachEventListeners();
        this.setupFunctoidToolbar();
        this.setupClearButton();
        this.setupConfigPanel();
        this.setupOutputPanel();
        this.setupScrollHandlers();
        this.setupAdditionalButtons();
        
        // Load sample schemas from file on startup
        this.loadSchemasFromFile();
        
        // Store instance globally for sidebar access
        window.mappingToolInstance = this;
    }
    
    attachEventListeners() {
        // Connector click events
        document.querySelectorAll('.connector-dot').forEach(dot => {
            dot.addEventListener('click', (e) => this.handleConnectorClick(e));
        });
        
        // Canvas click to cancel
        this.mappingCanvas.addEventListener('click', (e) => {
            if (e.target === this.mappingCanvas || e.target === this.svg) {
                this.cancelConnection();
            }
        });
        
        // Mouse move for temporary line
        this.mappingCanvas.addEventListener('mousemove', (e) => {
            this.updateTempLine(e);
        });
        
        // Functoid dragging
        this.mappingCanvas.addEventListener('mousedown', (e) => {
            if (e.target.closest('.functoid')) {
                this.startDraggingFunctoid(e);
            }
        });
        
        this.mappingCanvas.addEventListener('mousemove', (e) => {
            if (this.isDraggingFunctoid) {
                this.dragFunctoid(e);
            }
        });
        
        this.mappingCanvas.addEventListener('mouseup', () => {
            this.stopDraggingFunctoid();
        });
    }
    
    setupFunctoidToolbar() {
        // Setup draggable functoid buttons
        document.querySelectorAll('.functoid-btn').forEach(btn => {
            // Drag start - create a functoid on the canvas
            btn.addEventListener('dragstart', (e) => {
                const type = btn.getAttribute('data-type');
                e.dataTransfer.setData('functoid-type', type);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            // Click to add functoid at center
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.getAttribute('data-type');
                this.addFunctoid(type);
            });
        });
        
        // Setup canvas drop zone
        if (this.functoidArea) {
            this.functoidArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            
            this.functoidArea.addEventListener('drop', (e) => {
                e.preventDefault();
                const type = e.dataTransfer.getData('functoid-type');
                if (type) {
                    // Get drop position relative to functoid area
                    const rect = this.functoidArea.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.addFunctoid(type, { x, y });
                }
            });
        }
        
        // Add Execute button handler
        const executeBtn = document.getElementById('executeMapping');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => {
                this.executeMapping();
            });
        }
    }
    
    setupClearButton() {
        const clearBtn = document.getElementById('clearMappings');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllMappings();
            });
        }
    }
    
    setupConfigPanel() {
        document.getElementById('loadSchemas').addEventListener('click', () => {
            this.loadSchemasFromInput();
        });
        
        document.getElementById('loadSampleData').addEventListener('click', () => {
            this.loadSampleSchemas();
        });
    }
    
    setupOutputPanel() {
        const generateBtn = document.getElementById('generateOutput');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateMappingOutput();
            });
        }
        
        const copyOutputBtn = document.getElementById('copyOutput');
        if (copyOutputBtn) {
            copyOutputBtn.addEventListener('click', () => {
                this.copyOutputToClipboard();
            });
        }
    }
    
    setupScrollHandlers() {
        // Add scroll event listeners to schema tree containers to update mapping lines
        const sourceTree = document.getElementById('sourceSchema');
        const destTree = document.getElementById('destinationSchema');
        
        if (sourceTree) {
            sourceTree.addEventListener('scroll', () => {
                this.updateAllMappingLines();
            });
        }
        
        if (destTree) {
            destTree.addEventListener('scroll', () => {
                this.updateAllMappingLines();
            });
        }
        
        // Also add to the parent panels in case scrolling happens there
        const sourcePanels = document.querySelectorAll('.source-panel');
        const destPanels = document.querySelectorAll('.destination-panel');
        
        sourcePanels.forEach(panel => {
            panel.addEventListener('scroll', () => {
                this.updateAllMappingLines();
            });
        });
        
        destPanels.forEach(panel => {
            panel.addEventListener('scroll', () => {
                this.updateAllMappingLines();
            });
        });
    }
    
    updateAllMappingLines() {
        // Redraw all mapping lines to match new scroll positions
        this.mappings.forEach(mapping => {
            const pos1 = this.getConnectorPosition(mapping.connector1);
            const pos2 = this.getConnectorPosition(mapping.connector2);
            const path = this.createCurvePath(pos1.x, pos1.y, pos2.x, pos2.y);
            mapping.line.setAttribute('d', path);
        });
    }
    
    setupAdditionalButtons() {
        const loadBtn = document.getElementById('loadMapping');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.loadMappingFromJSON();
            });
        }
        
        const executeBtn = document.getElementById('executeMapping');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => {
                this.executeMapping();
            });
        }
        
        const copyResultBtn = document.getElementById('copyResult');
        if (copyResultBtn) {
            copyResultBtn.addEventListener('click', () => {
                this.copyResultToClipboard();
            });
        }

        // Property inspector buttons
        const savePropsBtn = document.getElementById('saveProperties');
        if (savePropsBtn) {
            savePropsBtn.addEventListener('click', () => {
                this.saveFieldProperties();
            });
        }

        const clearPropsBtn = document.getElementById('clearProperties');
        if (clearPropsBtn) {
            clearPropsBtn.addEventListener('click', () => {
                this.clearFieldSelection();
            });
        }
    }
    
    loadSampleSchemas() {
        const sampleSource = {
            "name": "SourceData",
            "type": "root",
            "children": [
                {
                    "name": "Customer",
                    "type": "parent",
                    "children": [
                        { "name": "CustomerID", "type": "field", "dataType": "string" },
                        { "name": "Title", "type": "field", "dataType": "string" },
                        { "name": "FirstName", "type": "field", "dataType": "string" },
                        { "name": "LastName", "type": "field", "dataType": "string" },
                        { "name": "Email", "type": "field", "dataType": "string" },
                        { "name": "Phone", "type": "field", "dataType": "string" },
                        { "name": "Address", "type": "field", "dataType": "string" },
                        { "name": "City", "type": "field", "dataType": "string" },
                        { "name": "State", "type": "field", "dataType": "string" },
                        { "name": "ZipCode", "type": "field", "dataType": "string" },
                        { "name": "Country", "type": "field", "dataType": "string" }
                    ]
                },
                {
                    "name": "Order",
                    "type": "parent",
                    "children": [
                        { "name": "OrderID", "type": "field", "dataType": "string" },
                        { "name": "OrderDate", "type": "field", "dataType": "string" },
                        { "name": "TotalAmount", "type": "field", "dataType": "number" },
                        { "name": "Status", "type": "field", "dataType": "string" }
                    ]
                }
            ]
        };
        
        const sampleDestination = {
            "name": "DestinationData",
            "type": "root",
            "children": [
                {
                    "name": "ContactRecord",
                    "type": "parent",
                    "children": [
                        { "name": "RecordID", "type": "field", "dataType": "string" },
                        { "name": "FullName", "type": "field", "dataType": "string" },
                        { "name": "DisplayName", "type": "field", "dataType": "string" },
                        { "name": "EmailAddress", "type": "field", "dataType": "string" },
                        { "name": "PhoneNumber", "type": "field", "dataType": "string" },
                        {
                            "name": "Location",
                            "type": "parent",
                            "children": [
                                { "name": "StreetAddress", "type": "field", "dataType": "string" },
                                { "name": "CityName", "type": "field", "dataType": "string" },
                                { "name": "StateCode", "type": "field", "dataType": "string" },
                                { "name": "PostalCode", "type": "field", "dataType": "string" },
                                { "name": "CountryCode", "type": "field", "dataType": "string" },
                                { "name": "FullAddress", "type": "field", "dataType": "string" }
                            ]
                        }
                    ]
                },
                {
                    "name": "Transaction",
                    "type": "parent",
                    "children": [
                        { "name": "TransactionID", "type": "field", "dataType": "string" },
                        { "name": "Date", "type": "field", "dataType": "string" },
                        { "name": "Amount", "type": "field", "dataType": "number" },
                        { "name": "TransactionStatus", "type": "field", "dataType": "string" }
                    ]
                }
            ]
        };
        
        this.setElementValue(document.getElementById('sourceSchemaInput'), JSON.stringify(sampleSource, null, 2));
        this.setElementValue(document.getElementById('destSchemaInput'), JSON.stringify(sampleDestination, null, 2));
        
        // Sample source data for execution
        const sampleSourceData = {
            "Customer": {
                "CustomerID": "CUST-001",
                "Title": "Mr.",
                "FirstName": "John",
                "LastName": "Smith",
                "Email": "john.smith@example.com",
                "Phone": "+1-555-0123",
                "Address": "123 Main Street",
                "City": "New York",
                "State": "NY",
                "ZipCode": "10001",
                "Country": "USA"
            },
            "Order": {
                "OrderID": "ORD-2025-001",
                "OrderDate": "2025-10-14",
                "TotalAmount": 1250.50,
                "Status": "Confirmed"
            }
        };
        
        this.setElementValue(document.getElementById('sourceDataInput'), JSON.stringify(sampleSourceData, null, 2));
        
        this.loadSchemasFromInput();
    }
    
    async loadSchemasFromFile() {
        try {
            const response = await fetch('sample-schemas.json');
            if (!response.ok) {
                console.warn('Could not load sample-schemas.json, using inline defaults');
                this.loadSampleSchemas();
                return;
            }
            
            const data = await response.json();
            
            // Populate the input textareas
            const sourceInput = document.getElementById('sourceSchemaInput');
            const destInput = document.getElementById('destSchemaInput');
            
            if (!sourceInput || !destInput) {
                console.warn('Schema input textareas not found, retrying...');
                // Retry after a short delay
                setTimeout(() => this.loadSchemasFromFile(), 100);
                return;
            }
            
            this.setElementValue(sourceInput, JSON.stringify(data.sourceSchema, null, 2));
            this.setElementValue(destInput, JSON.stringify(data.destinationSchema, null, 2));
            
            // Sample source data for execution
            const sampleSourceData = {
                "Customer": {
                    "PersonalInfo": {
                        "FirstName": "John",
                        "LastName": "Doe",
                        "DateOfBirth": "1985-06-15",
                        "SSN": "123-45-6789"
                    },
                    "ContactInfo": {
                        "Email": "john.doe@example.com",
                        "Phone": "+1-555-0100",
                        "Address": "456 Oak Avenue",
                        "City": "San Francisco",
                        "State": "CA",
                        "ZipCode": "94102"
                    },
                    "AccountInfo": {
                        "AccountNumber": "ACC-987654",
                        "AccountType": "Premium",
                        "Balance": 5432.10,
                        "Status": "Active"
                    }
                }
            };
            
            const dataInput = document.getElementById('sourceDataInput');
            if (dataInput) {
                this.setElementValue(dataInput, JSON.stringify(sampleSourceData, null, 2));
            }
            
            this.loadSchemasFromInput();
            
            // Load sample mapping after schemas are rendered
            setTimeout(() => {
                this.loadSampleMapping();
            }, 300);
        } catch (error) {
            console.error('Error loading sample schemas:', error);
            this.loadSampleSchemas();
        }
    }
    
    loadSchemasFromInput() {
        try {
            const sourceJSON = this.getElementValue(document.getElementById('sourceSchemaInput'));
            const destJSON = this.getElementValue(document.getElementById('destSchemaInput'));
            
            this.sourceSchema = JSON.parse(sourceJSON);
            this.destinationSchema = JSON.parse(destJSON);
            
            this.renderSchemas();
            this.clearAllMappings();
            
            showToast('Schemas loaded successfully!', 'success');
        } catch (error) {
            showToast('Error parsing JSON: ' + error.message, 'error');
        }
    }

    /**
     * Load schemas directly from a configuration object
     * Used by connectors (e.g., OData) to load schemas programmatically
     * @param {object} config - Configuration object with source and destination schemas
     */
    loadSchemasFromConfig(config) {
        try {
            if (config.source) {
                // Convert JSON schema format to internal schema format
                this.sourceSchema = this.convertJsonSchemaToInternal(config.source, 'source');
                
                // Update the source schema input
                const sourceInput = document.getElementById('sourceSchemaInput');
                if (sourceInput) {
                    this.setElementValue(sourceInput, JSON.stringify(this.sourceSchema, null, 2));
                }
            }
            
            if (config.destination) {
                this.destinationSchema = this.convertJsonSchemaToInternal(config.destination, 'destination');
                
                const destInput = document.getElementById('destSchemaInput');
                if (destInput) {
                    this.setElementValue(destInput, JSON.stringify(this.destinationSchema, null, 2));
                }
            }
            
            this.renderSchemas();
            this.clearAllMappings();
            
            showToast('Schemas loaded from connector!', 'success');
        } catch (error) {
            showToast('Error loading schemas: ' + error.message, 'error');
            console.error('Schema loading error:', error);
        }
    }

    /**
     * Convert JSON Schema (from OData) to internal schema format
     * @param {object} jsonSchema - JSON Schema object
     * @param {string} name - Name of the schema
     * @returns {object} - Converted schema in internal format
     */
    convertJsonSchemaToInternal(jsonSchema, name = 'Schema') {
        const schema = {
            name: jsonSchema.title || name,
            type: 'root',
            children: []
        };

        if (jsonSchema.properties) {
            Object.keys(jsonSchema.properties).forEach(propName => {
                const prop = jsonSchema.properties[propName];
                const field = {
                    name: propName,
                    type: 'field',
                    dataType: this.mapJsonSchemaType(prop.type, prop.format)
                };
                
                // Handle nested objects
                if (prop.type === 'object' && prop.properties) {
                    field.type = 'parent';
                    field.children = [];
                    Object.keys(prop.properties).forEach(nestedPropName => {
                        const nestedProp = prop.properties[nestedPropName];
                        field.children.push({
                            name: nestedPropName,
                            type: 'field',
                            dataType: this.mapJsonSchemaType(nestedProp.type, nestedProp.format)
                        });
                    });
                }
                
                schema.children.push(field);
            });
        }

        return schema;
    }

    /**
     * Map JSON Schema types to internal data types
     * @param {string} type - JSON Schema type
     * @param {string} format - JSON Schema format
     * @returns {string} - Internal data type
     */
    mapJsonSchemaType(type, format = null) {
        if (format === 'date-time') return 'datetime';
        if (format === 'date') return 'date';
        if (format === 'uuid') return 'guid';
        
        switch (type) {
            case 'string':
                return 'string';
            case 'integer':
                return 'integer';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                return 'array';
            case 'object':
                return 'object';
            default:
                return 'string';
        }
    }
    
    renderSchemas() {
        this.sourceSchemaContainer.innerHTML = '';
        this.destSchemaContainer.innerHTML = '';
        
        this.renderSchemaNode(this.sourceSchema, this.sourceSchemaContainer, 'source', '');
        this.renderSchemaNode(this.destinationSchema, this.destSchemaContainer, 'dest', '');
        
        // Re-attach connector listeners
        document.querySelectorAll('.connector-dot').forEach(dot => {
            dot.addEventListener('click', (e) => this.handleConnectorClick(e));
        });
    }
    
    renderSchemaNode(node, container, prefix, path) {
        const currentPath = path ? `${path}.${node.name}` : node.name;
        const nodeId = `${prefix}-${currentPath.replace(/\./g, '-').toLowerCase()}`;
        
        const nodeDiv = document.createElement('div');
        nodeDiv.className = `schema-node ${node.type}`;
        if (prefix === 'dest' && node.type === 'field') {
            nodeDiv.classList.add('dest-field');
        }
        nodeDiv.setAttribute('data-id', nodeId);
        nodeDiv.setAttribute('data-path', currentPath);
        nodeDiv.setAttribute('data-node-name', node.name);
        nodeDiv.setAttribute('data-node-type', node.type);
        nodeDiv.setAttribute('data-prefix', prefix);
        
        let icon = '📁';
        if (node.type === 'parent') icon = '📂';
        if (node.type === 'field') icon = '🔹';
        
        // For destination schema, add connector on left
        if (node.type === 'field') {
            if (prefix === 'dest') {
                nodeDiv.innerHTML = `
                    <span class="connector-dot left" data-field="${currentPath}" data-side="${prefix}"></span>
                    <span class="node-icon">${icon}</span>
                    <span class="node-label">${node.name}</span>
                `;
                // Make destination fields clickable for property editing
                nodeDiv.style.cursor = 'pointer';
                nodeDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!this.isGenerating) {
                        this.selectFieldForEditing(node, currentPath, prefix);
                    }
                });
            } else {
                nodeDiv.innerHTML = `
                    <span class="node-icon">${icon}</span>
                    <span class="node-label">${node.name}</span>
                    <span class="connector-dot" data-field="${currentPath}" data-side="${prefix}"></span>
                `;
            }
        } else {
            nodeDiv.innerHTML = `
                <span class="node-icon">${icon}</span>
                <span class="node-label">${node.name}</span>
            `;
        }
        
        container.appendChild(nodeDiv);
        
        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'schema-children';
            container.appendChild(childrenContainer);
            
            node.children.forEach(child => {
                this.renderSchemaNode(child, childrenContainer, prefix, currentPath);
            });
        }
    }
    
    generateMappingOutput() {
        const output = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            mappings: [],
            functoids: []
        };
        
        // Export mappings
        this.mappings.forEach(mapping => {
            const source = this.getConnectorInfo(mapping.connector1);
            const target = this.getConnectorInfo(mapping.connector2);
            
            output.mappings.push({
                source: source,
                target: target
            });
        });
        
        // Export functoids
        this.functoids.forEach(functoid => {
            const rect = functoid.element.getBoundingClientRect();
            const canvasRect = this.mappingCanvas.getBoundingClientRect();
            
            output.functoids.push({
                id: functoid.id,
                type: functoid.type,
                position: {
                    x: rect.left - canvasRect.left,
                    y: rect.top - canvasRect.top
                }
            });
        });
        
        const outputText = JSON.stringify(output, null, 2);
        const outputElement = document.getElementById('mappingOutput');
        if (outputElement && outputElement.tagName === 'JSON-VIEWER') {
            outputElement.setJSON(outputText);
        } else if (outputElement && outputElement.tagName === 'PRE') {
            outputElement.innerHTML = this.formatJSONWithSyntaxHighlight(outputText);
        } else if (outputElement) {
            outputElement.value = outputText;
        }
    }
    
    getConnectorInfo(connector) {
        const field = connector.getAttribute('data-field');
        const side = connector.getAttribute('data-side');
        const isFunctoid = connector.classList.contains('functoid-connector');
        
        if (isFunctoid) {
            const functoid = connector.closest('.functoid');
            const functoidData = this.functoids.find(f => f.element === functoid);
            return {
                type: 'functoid',
                functoidId: functoidData ? functoidData.id : null,
                connectorSide: connector.classList.contains('left') ? 'left' : 'right'
            };
        } else {
            return {
                type: 'field',
                path: field,
                schema: side
            };
        }
    }

    /**
     * Select a field from destination schema for editing
     */
    selectFieldForEditing(node, fieldPath, prefix) {
        // Clear previous highlight
        if (this.selectedField && this.selectedField.element) {
            this.selectedField.element.style.backgroundColor = 'transparent';
        }

        // Store current selection
        this.selectedField = {
            node: node,
            path: fieldPath,
            prefix: prefix,
            element: event.currentTarget
        };

        // Highlight the selected field
        event.currentTarget.style.backgroundColor = 'rgba(13, 110, 253, 0.15)';

        // Show properties in the inspector
        this.displayFieldProperties(node, fieldPath);

        // Switch to properties tab
        const propsTab = document.getElementById('properties-tab');
        if (propsTab) {
            propsTab.click();
        }
    }

    /**
     * Display field properties in the inspector
     */
    displayFieldProperties(node, fieldPath) {
        const container = document.getElementById('fieldPropertiesContainer');
        const noSelection = document.getElementById('noSelectionPlaceholder');
        const fieldNameEl = document.getElementById('fieldName');
        const propFieldName = document.getElementById('propFieldName');
        const propFieldType = document.getElementById('propFieldType');
        const propFieldBusinessDesc = document.getElementById('propFieldBusinessDesc');
        const propFieldRequired = document.getElementById('propFieldRequired');
        const propFieldFormat = document.getElementById('propFieldFormat');
        const propFieldDefault = document.getElementById('propFieldDefault');
        const fieldPathEl = document.getElementById('fieldPath');

        // Hide no-selection placeholder and show container
        if (noSelection) noSelection.style.display = 'none';
        if (container) container.style.display = 'block';

        // Populate fields
        if (fieldNameEl) fieldNameEl.textContent = node.name + ' Properties';
        if (propFieldName) propFieldName.value = node.name;
        if (propFieldType) propFieldType.value = node.type || '';
        if (propFieldBusinessDesc) propFieldBusinessDesc.value = node.businessDescription || '';
        if (propFieldRequired) propFieldRequired.checked = node.required || false;
        if (propFieldFormat) propFieldFormat.value = node.format || '';
        if (propFieldDefault) propFieldDefault.value = node.default || '';
        if (fieldPathEl) fieldPathEl.textContent = 'Path: ' + fieldPath;

        // Store reference for saving
        this.selectedField.fieldProperties = {
            name: node.name,
            type: node.type,
            businessDescription: node.businessDescription,
            required: node.required,
            format: node.format,
            default: node.default
        };

        // Setup AI wizard button
        this.setupBusinessDescWizard();
    }

    /**
     * Setup business description AI wizard
     */
    setupBusinessDescWizard() {
        const genBtn = document.getElementById('generateBusinessDesc');
        if (!genBtn) return;

        // Remove previous listener
        const newBtn = genBtn.cloneNode(true);
        genBtn.parentNode.replaceChild(newBtn, genBtn);

        // Add new listener
        newBtn.addEventListener('click', async () => {
            if (!this.selectedField) {
                showToast('No field selected', 'warning');
                return;
            }

            const fieldName = this.selectedField.node.name;
            const fieldType = this.selectedField.node.type;
            const businessDescField = document.getElementById('propFieldBusinessDesc');

            // Check if WebLLM is available
            if (!window.webllm || !window.mappingToolInstance.webllmConfig) {
                showToast('WebLLM not initialized. Please load a model in AI Assistant first.', 'warning');
                return;
            }

            // Disable field selection during generation
            this.isGenerating = true;
            this.disableFieldSelection();

            newBtn.disabled = true;
            newBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
            newBtn.title = 'Generating...';
            businessDescField.value = ''; // Clear previous content

            // Add loading spinner next to selected field
            const selectedElement = this.selectedField.element;
            const loadingSpinner = document.createElement('span');
            loadingSpinner.id = 'field-loading-spinner';
            loadingSpinner.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i>';
            selectedElement.appendChild(loadingSpinner);

            try {
                const prompt = `For the field "${fieldName}" (type: ${fieldType}), write a concise business description explaining its role within the data structure. Keep it to 1-2 sentences and focus on business context.`;

                // Use WebLLM to generate description with streaming
                let fullResponse = '';
                const result = await window.mappingToolInstance.webllmConfig.runTestScenario(
                    prompt, 
                    (chunk) => {
                        // Stream callback - update textarea as text arrives
                        fullResponse += chunk;
                        businessDescField.value = fullResponse;
                        businessDescField.scrollTop = businessDescField.scrollHeight; // Auto-scroll
                    }
                );
                
                if (result && result.response) {
                    businessDescField.value = result.response.trim();
                    showToast('✨ Business description generated!', 'success');
                }
            } catch (error) {
                console.error('Error generating business description:', error);
                businessDescField.value = `Error: ${error.message}`;
                showToast('Error: ' + error.message, 'danger');
            } finally {
                // Re-enable field selection
                this.isGenerating = false;
                this.enableFieldSelection();

                // Remove loading spinner
                const spinner = document.getElementById('field-loading-spinner');
                if (spinner) spinner.remove();

                newBtn.disabled = false;
                newBtn.innerHTML = '<i class="bi bi-magic"></i>';
                newBtn.title = 'Generate with AI';
            }
        });
    }

    /**
     * Disable all destination field selection
     */
    disableFieldSelection() {
        const destFields = document.querySelectorAll('.schema-node.dest-field');
        destFields.forEach(field => {
            field.style.cursor = 'not-allowed';
            field.style.opacity = '0.5';
            field.onclick = (e) => {
                e.stopPropagation();
                showToast('Cannot select field while generating...', 'info');
            };
        });
    }

    /**
     * Enable all destination field selection
     */
    enableFieldSelection() {
        const destFields = document.querySelectorAll('.schema-node.dest-field');
        destFields.forEach(field => {
            field.style.cursor = 'pointer';
            field.style.opacity = '1';
            field.onclick = null; // Remove the blocking handler
            // Re-attach the original click handler
            field.addEventListener('click', (e) => {
                e.stopPropagation();
                const node = this.findNodeByPath(field.getAttribute('data-path'));
                if (node) {
                    this.selectFieldForEditing(node, field.getAttribute('data-path'), field.getAttribute('data-prefix'));
                }
            });
        });
    }

    /**
     * Find node in schema by path
     */
    findNodeByPath(path) {
        const parts = path.split('.');
        let current = this.destinationSchema;
        for (const part of parts) {
            if (current.children) {
                current = current.children.find(c => c.name === part);
                if (!current) return null;
            } else {
                return null;
            }
        }
        return current;
    }

    /**
     * Save field property changes
     */
    saveFieldProperties() {
        if (!this.selectedField || !this.selectedField.node) {
            showToast('No field selected', 'warning');
            return;
        }

        // Get updated values
        const propFieldType = document.getElementById('propFieldType').value;
        const propFieldBusinessDesc = document.getElementById('propFieldBusinessDesc').value;
        const propFieldRequired = document.getElementById('propFieldRequired').checked;
        const propFieldFormat = document.getElementById('propFieldFormat').value;
        const propFieldDefault = document.getElementById('propFieldDefault').value;

        // Update the node
        this.selectedField.node.type = propFieldType || this.selectedField.node.type;
        this.selectedField.node.businessDescription = propFieldBusinessDesc;
        this.selectedField.node.required = propFieldRequired;
        this.selectedField.node.format = propFieldFormat;
        this.selectedField.node.default = propFieldDefault;

        // Update the destination schema JSON
        const destInput = document.getElementById('destSchemaInput');
        if (destInput) {
            this.setElementValue(destInput, JSON.stringify(this.destinationSchema, null, 2));
        }

        showToast('Field properties saved successfully!', 'success');
        console.log('Saved field:', this.selectedField.node);
    }

    /**
     * Clear field selection from inspector
     */
    clearFieldSelection() {
        // Clear selection
        this.selectedField = null;

        // Hide properties container
        const container = document.getElementById('fieldPropertiesContainer');
        const noSelection = document.getElementById('noSelectionPlaceholder');
        if (container) container.style.display = 'none';
        if (noSelection) noSelection.style.display = 'block';

        // Clear highlights
        document.querySelectorAll('.schema-node.dest-field').forEach(el => {
            el.style.backgroundColor = 'transparent';
        });

        showToast('Selection cleared', 'info');
    }
    
    copyOutputToClipboard() {
        const outputElement = document.getElementById('mappingOutput');
        let output = '';
        
        if (outputElement.tagName === 'JSON-VIEWER') {
            output = outputElement.getText();
        } else if (outputElement.tagName === 'PRE') {
            output = outputElement.textContent;
        } else {
            output = outputElement.value;
        }
        
        if (!output) {
            showToast('Please generate mapping output first!', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(output).then(() => {
            showToast('Mapping JSON copied to clipboard!', 'success');
        }).catch(err => {
            showToast('Failed to copy: ' + err, 'error');
        });
    }
    
    loadMappingFromJSON() {
        const jsonInput = prompt('Paste your mapping JSON here:');
        if (!jsonInput) return;
        
        try {
            const mappingData = JSON.parse(jsonInput);
            this.applyMappingData(mappingData);
            showToast('Mapping loaded successfully!', 'success');
        } catch (error) {
            showToast('Error loading mapping: ' + error.message, 'error');
        }
    }
    
    async loadSampleMapping() {
        try {
            const response = await fetch('sample-mapping.json');
            if (!response.ok) {
                console.warn('Could not load sample-mapping.json');
                return;
            }
            
            const mappingData = await response.json();
            console.log('Loading sample mapping:', mappingData);
            this.applyMappingData(mappingData);
        } catch (error) {
            console.error('Error loading sample mapping:', error);
        }
    }
    
    applyMappingData(mappingData) {
        // Clear existing mappings
        this.clearAllMappings();
        
        // Load functoids first
        if (mappingData.functoids) {
            mappingData.functoids.forEach(functoidData => {
                this.addFunctoid(functoidData.type, functoidData.position, functoidData.id);
            });
        }
        
        // Wait a bit for functoids to render, then create mappings
        setTimeout(() => {
            if (mappingData.mappings) {
                mappingData.mappings.forEach(mapping => {
                    const sourceConnector = this.findConnector(mapping.source);
                    const targetConnector = this.findConnector(mapping.target);
                    
                    if (sourceConnector && targetConnector) {
                        this.createMapping(sourceConnector, targetConnector);
                    } else {
                        console.warn('Could not find connectors for mapping:', mapping);
                    }
                });
            }
            console.log('Mapping applied successfully');
        }, 200);
    }
    
    findConnector(connectorInfo) {
        if (connectorInfo.type === 'field') {
            return document.querySelector(`.connector-dot[data-field="${connectorInfo.path}"][data-side="${connectorInfo.schema}"]`);
        } else if (connectorInfo.type === 'functoid') {
            const functoidData = this.functoids.find(f => f.id === connectorInfo.functoidId);
            if (functoidData) {
                const connectorClass = connectorInfo.connectorSide === 'left' ? '.left' : '.right';
                return functoidData.element.querySelector(`.functoid-connector${connectorClass}`);
            }
        }
        return null;
    }
    
    executeMapping() {
        try {
            const sourceDataText = this.getElementValue(document.getElementById('sourceDataInput'));
            if (!sourceDataText) {
                showToast('Please provide source data to execute the mapping!', 'warning');
                return;
            }
            
            const sourceData = JSON.parse(sourceDataText);
            const result = {};
            
            // Process each mapping
            this.mappings.forEach(mapping => {
                const source = this.getConnectorInfo(mapping.connector1);
                const target = this.getConnectorInfo(mapping.connector2);
                
                // Only process direct field-to-field mappings for now
                // In a real implementation, you'd evaluate functoids too
                if (source.type === 'field' && target.type === 'field') {
                    const sourceValue = this.getValueFromPath(sourceData, source.path);
                    this.setValueToPath(result, target.path, sourceValue);
                } else if (source.type === 'field' && target.type === 'functoid') {
                    // Store for functoid processing
                } else if (source.type === 'functoid' && target.type === 'field') {
                    // Process functoid output
                }
            });
            
            // Apply functoid transformations (simplified)
            this.applyFunctoidTransformations(sourceData, result);
            
            const resultText = JSON.stringify(result, null, 2);
            const resultElement = document.getElementById('executionResult');
            if (resultElement && resultElement.tagName === 'JSON-VIEWER') {
                resultElement.setJSON(resultText);
            } else if (resultElement && resultElement.tagName === 'PRE') {
                resultElement.innerHTML = this.formatJSONWithSyntaxHighlight(resultText);
            } else if (resultElement) {
                resultElement.value = resultText;
            }
            
            // Show execution panel (AdminLTE card)
            const executionCard = document.getElementById('executionCard');
            if (executionCard) {
                executionCard.style.display = 'block';
            }
            
        } catch (error) {
            showToast('Error executing mapping: ' + error.message, 'error');
            console.error(error);
        }
    }
    
    getValueFromPath(data, path) {
        // Remove the root schema name and navigate through the object
        const parts = path.split('.').slice(1); // Skip "SourceData" or schema name
        let value = data;
        
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return null;
            }
        }
        
        return value;
    }
    
    setValueToPath(data, path, value) {
        // Remove the root schema name and create the object structure
        const parts = path.split('.').slice(1); // Skip "DestinationData" or schema name
        let current = data;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }
        
        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;
    }
    
    applyFunctoidTransformations(sourceData, result) {
        // Build a map of functoid connections
        const functoidConnections = new Map();
        
        this.mappings.forEach(mapping => {
            const source = this.getConnectorInfo(mapping.connector1);
            const target = this.getConnectorInfo(mapping.connector2);
            
            if (target.type === 'functoid') {
                if (!functoidConnections.has(target.functoidId)) {
                    functoidConnections.set(target.functoidId, { inputs: [], outputs: [] });
                }
                if (source.type === 'field') {
                    functoidConnections.get(target.functoidId).inputs.push({
                        path: source.path,
                        value: this.getValueFromPath(sourceData, source.path)
                    });
                }
            }
            
            if (source.type === 'functoid') {
                if (!functoidConnections.has(source.functoidId)) {
                    functoidConnections.set(source.functoidId, { inputs: [], outputs: [] });
                }
                if (target.type === 'field') {
                    functoidConnections.get(source.functoidId).outputs.push({
                        path: target.path
                    });
                }
            }
        });
        
        // Execute functoids
        functoidConnections.forEach((connections, functoidId) => {
            const functoid = this.functoids.find(f => f.id === functoidId);
            if (!functoid) return;
            
            const inputValues = connections.inputs.map(i => i.value);
            let outputValue = null;
            
            // Apply functoid logic based on type
            switch (functoid.type) {
                case 'string':
                    // Concatenate strings
                    outputValue = inputValues.filter(v => v != null).join(' ');
                    break;
                case 'math':
                    // Sum numbers
                    outputValue = inputValues.reduce((sum, val) => sum + (Number(val) || 0), 0);
                    break;
                case 'logical':
                    // Return first non-null value
                    outputValue = inputValues.find(v => v != null) || null;
                    break;
                case 'conversion':
                    // Convert to string
                    outputValue = String(inputValues[0] || '');
                    break;
            }
            
            // Set output value to destination fields
            connections.outputs.forEach(output => {
                this.setValueToPath(result, output.path, outputValue);
            });
        });
    }
    
    copyResultToClipboard() {
        const resultElement = document.getElementById('executionResult');
        let result = '';
        
        if (resultElement.tagName === 'JSON-VIEWER') {
            result = resultElement.getText();
        } else if (resultElement.tagName === 'PRE') {
            result = resultElement.textContent;
        } else {
            result = resultElement.value;
        }
        
        if (!result) {
            showToast('Please execute the mapping first!', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(result).then(() => {
            showToast('Result copied to clipboard!', 'success');
        }).catch(err => {
            showToast('Failed to copy: ' + err, 'error');
        });
    }
    
    generateCSharpCode() {
        try {
            const sourceSchema = this.sourceSchema;
            const destSchema = this.destinationSchema;
            
            if (!sourceSchema || !destSchema) {
                showToast('Please load schemas first!', 'warning');
                return '';
            }
            
            const sourceClassName = this.getSchemaName(sourceSchema) || 'SourceModel';
            const destClassName = this.getSchemaName(destSchema) || 'DestinationModel';
            
            let code = `using System;\nusing System.Linq;\n\nnamespace MappingTool.Generated\n{\n`;
            
            // Generate source model class
            code += this.generateCSharpClass(sourceSchema, sourceClassName);
            code += '\n';
            
            // Generate destination model class
            code += this.generateCSharpClass(destSchema, destClassName);
            code += '\n';
            
            // Generate mapper class
            code += `    public class DataMapper\n    {\n`;
            
            // Generate functoid methods
            code += this.generateFunctoidMethods();
            
            // Generate main mapping method
            code += `\n        public ${destClassName} Map(${sourceClassName} source)\n        {\n`;
            code += `            if (source == null) throw new ArgumentNullException(nameof(source));\n\n`;
            code += `            var destination = new ${destClassName}();\n\n`;
            
            // Generate mapping statements
            if (this.mappings.length === 0) {
                code += `            // No mappings defined yet\n`;
                code += `            // Add mappings in the visual tool to generate code here\n`;
            } else {
                // Process direct mappings (field to field)
                const directMappings = this.mappings.filter(m => 
                    m.source && m.destination && 
                    m.source.type === 'field' && m.destination.type === 'field'
                );
                
                // Process functoid-based mappings
                const functoidMappings = this.getFunctoidBasedMappings();
                
                const totalOutputMappings = directMappings.length + functoidMappings.length;
                const sourceFieldMappings = this.mappings.filter(m => m.source && m.source.type === 'field').length;
                const destFieldMappings = this.mappings.filter(m => m.destination && m.destination.type === 'field').length;
                
                code += `            // Mappings: ${sourceFieldMappings} source fields → ${destFieldMappings} destination fields (${totalOutputMappings} assignments)\n`;
                
                directMappings.forEach(mapping => {
                    const mappingCode = this.generateMappingStatement(mapping, 'source', 'destination');
                    if (mappingCode) {
                        code += `            ${mappingCode}\n`;
                    }
                });
                
                functoidMappings.forEach(fm => {
                    const mappingCode = this.generateFunctoidMappingStatement(fm, 'source', 'destination');
                    if (mappingCode) {
                        code += `            ${mappingCode}\n`;
                    }
                });
            }
            
            code += `\n            return destination;\n`;
            code += `        }\n`;
            code += `    }\n`;
            code += `}\n`;
            
            return code;
        } catch (error) {
            showToast('Error generating C# code: ' + error.message, 'error');
            return '';
        }
    }
    
    getSchemaName(schema) {
        if (typeof schema === 'object' && schema !== null) {
            const keys = Object.keys(schema);
            if (keys.length > 0) {
                return keys[0];
            }
        }
        return null;
    }
    
    generateCSharpClass(schema, className) {
        let code = `    public class ${className}\n    {\n`;
        
        // Handle tree-based schema structure
        if (schema.children && Array.isArray(schema.children)) {
            schema.children.forEach(child => {
                if (child.type === 'parent' && child.children) {
                    // Nested class property
                    const nestedClassName = this.toPascalCase(child.name);
                    code += `        public ${nestedClassName} ${nestedClassName} { get; set; }\n`;
                } else if (child.type === 'field') {
                    // Simple property
                    const propName = this.toPascalCase(child.name);
                    const propType = this.dataTypeToCSharpType(child.dataType);
                    code += `        public ${propType} ${propName} { get; set; }\n`;
                }
            });
        }
        
        code += `    }\n`;
        
        // Generate nested classes
        if (schema.children && Array.isArray(schema.children)) {
            schema.children.forEach(child => {
                if (child.type === 'parent' && child.children) {
                    code += '\n';
                    code += this.generateNestedCSharpClass(child);
                }
            });
        }
        
        return code;
    }
    
    generateNestedCSharpClass(node) {
        const className = this.toPascalCase(node.name);
        let code = `    public class ${className}\n    {\n`;
        
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(child => {
                if (child.type === 'parent' && child.children) {
                    // Nested class property
                    const nestedClassName = this.toPascalCase(child.name);
                    code += `        public ${nestedClassName} ${nestedClassName} { get; set; }\n`;
                } else if (child.type === 'field') {
                    // Simple property
                    const propName = this.toPascalCase(child.name);
                    const propType = this.dataTypeToCSharpType(child.dataType);
                    code += `        public ${propType} ${propName} { get; set; }\n`;
                }
            });
        }
        
        code += `    }\n`;
        
        // Recursively generate nested classes
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(child => {
                if (child.type === 'parent' && child.children) {
                    code += '\n';
                    code += this.generateNestedCSharpClass(child);
                }
            });
        }
        
        return code;
    }
    
    dataTypeToCSharpType(dataType) {
        const typeMap = {
            'string': 'string',
            'number': 'decimal',
            'boolean': 'bool',
            'integer': 'int',
            'date': 'DateTime',
            'datetime': 'DateTime'
        };
        return typeMap[dataType] || 'string';
    }
    
    extractPropertiesRecursive(obj, parentKey = '') {
        const props = [];
        
        if (typeof obj !== 'object' || obj === null) {
            return props;
        }
        
        // If this is the root schema object, get its first key
        if (!parentKey) {
            const rootKeys = Object.keys(obj);
            if (rootKeys.length > 0) {
                const rootKey = rootKeys[0];
                return this.extractPropertiesRecursive(obj[rootKey], rootKey);
            }
            return props;
        }
        
        // Extract properties from this level
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const propName = this.toPascalCase(key);
            
            if (value === null) {
                props.push({ name: propName, type: 'string' });
            } else if (Array.isArray(value)) {
                if (value.length > 0 && typeof value[0] === 'object') {
                    props.push({ name: propName, type: 'List<object>' });
                } else {
                    props.push({ name: propName, type: 'List<string>' });
                }
            } else if (typeof value === 'object') {
                // Nested object - create nested class
                const nestedClassName = propName;
                props.push({ name: propName, type: nestedClassName });
            } else {
                const csharpType = this.inferCSharpType(value);
                props.push({ name: propName, type: csharpType });
            }
        });
        
        return props;
    }
    
    toPascalCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    inferCSharpType(value) {
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'int' : 'decimal';
        }
        if (typeof value === 'boolean') return 'bool';
        return 'object';
    }
    
    extractProperties(schema, prefix = '') {
        const props = [];
        
        if (typeof schema !== 'object' || schema === null) {
            return props;
        }
        
        // Get the root object
        const rootKey = Object.keys(schema)[0];
        const rootObj = schema[rootKey];
        
        if (typeof rootObj === 'object' && rootObj !== null) {
            Object.keys(rootObj).forEach(key => {
                const value = rootObj[key];
                const propName = key.charAt(0).toUpperCase() + key.slice(1);
                
                if (typeof value === 'object' && value !== null) {
                    props.push({ name: propName, type: 'object' });
                } else {
                    props.push({ name: propName, type: typeof value });
                }
            });
        }
        
        return props;
    }
    
    jsonTypeToCSharpType(type) {
        const typeMap = {
            'string': 'string',
            'number': 'decimal',
            'boolean': 'bool',
            'object': 'object',
            'array': 'List<object>'
        };
        return typeMap[type] || 'object';
    }
    
    generateFunctoidMethods() {
        let code = '';
        const functoidTypes = new Set();
        
        // Collect unique functoid types used
        this.functoids.forEach(f => functoidTypes.add(f.type));
        
        if (functoidTypes.has('string')) {
            code += `        private string StringConcat(params object[] values)\n`;
            code += `        {\n`;
            code += `            return string.Join("", values.Select(v => v?.ToString() ?? ""));\n`;
            code += `        }\n\n`;
        }
        
        if (functoidTypes.has('math')) {
            code += `        private decimal MathOperation(params decimal[] values)\n`;
            code += `        {\n`;
            code += `            return values.Sum();\n`;
            code += `        }\n\n`;
        }
        
        if (functoidTypes.has('logical')) {
            code += `        private bool LogicalAnd(params bool[] values)\n`;
            code += `        {\n`;
            code += `            return values.All(v => v);\n`;
            code += `        }\n\n`;
        }
        
        if (functoidTypes.has('conversion')) {
            code += `        private T Convert<T>(object value)\n`;
            code += `        {\n`;
            code += `            return (T)System.Convert.ChangeType(value, typeof(T));\n`;
            code += `        }\n\n`;
        }
        
        return code;
    }
    
    generateMappingStatement(mapping, sourceVar, destVar) {
        if (!mapping.source || !mapping.destination) {
            return null;
        }
        
        const sourcePath = this.getPropertyPath(mapping.source.path);
        const destPath = this.getPropertyPath(mapping.destination.path);
        
        if (!sourcePath || !destPath) {
            return null;
        }
        
        // Simple direct mapping
        return `${destVar}.${destPath} = ${sourceVar}.${sourcePath};`;
    }
    
    getFunctoidBasedMappings() {
        const functoidMappings = [];
        
        // For each functoid, find its input and output mappings
        this.functoids.forEach(functoid => {
            const inputMappings = this.mappings.filter(m => 
                m.destination && m.destination.type === 'functoid' && 
                m.destination.functoidId === functoid.id
            );
            
            const outputMappings = this.mappings.filter(m => 
                m.source && m.source.type === 'functoid' && 
                m.source.functoidId === functoid.id
            );
            
            // Create a mapping for each output
            outputMappings.forEach(outputMapping => {
                functoidMappings.push({
                    functoid: functoid,
                    inputs: inputMappings,
                    output: outputMapping
                });
            });
        });
        
        return functoidMappings;
    }
    
    generateFunctoidMappingStatement(fm, sourceVar, destVar) {
        if (!fm.output || !fm.output.destination || fm.inputs.length === 0) {
            return null;
        }
        
        const destPath = this.getPropertyPath(fm.output.destination.path);
        if (!destPath) return null;
        
        // Get all input paths
        const inputPaths = fm.inputs
            .map(m => m.source ? this.getPropertyPath(m.source.path) : null)
            .filter(p => p !== null);
        
        if (inputPaths.length === 0) return null;
        
        // Generate the functoid call
        const functoidCall = this.generateFunctoidCallWithInputs(
            fm.functoid.type, 
            sourceVar, 
            inputPaths
        );
        
        return `${destVar}.${destPath} = ${functoidCall};`;
    }
    
    generateFunctoidCallWithInputs(functoidType, sourceVar, inputPaths) {
        const inputs = inputPaths.map(p => `${sourceVar}.${p}`).join(', ');
        
        switch (functoidType) {
            case 'string':
                return `StringConcat(${inputs})`;
            case 'math':
                return `MathOperation(${inputs})`;
            case 'logical':
                return `LogicalAnd(${inputs})`;
            case 'conversion':
                if (inputPaths.length > 0) {
                    return `Convert<string>(${sourceVar}.${inputPaths[0]})`;
                }
                return `Convert<string>(null)`;
            default:
                return inputs;
        }
    }
    
    getPropertyPath(path) {
        if (!path) {
            return null;
        }
        
        const parts = path.split('.');
        
        if (parts.length > 1) {
            // Skip first part (schema name) and convert remaining to PascalCase
            const result = parts.slice(1).map(p => 
                p.charAt(0).toUpperCase() + p.slice(1)
            ).join('.');
            return result;
        }
        
        return null;
    }
    
    findFunctoidInMapping(mapping) {
        // Find functoid connected to this mapping
        for (const functoid of this.functoids) {
            const hasSourceConnection = this.mappings.some(m => 
                m.destination && m.destination.element === functoid.element
            );
            const hasDestConnection = this.mappings.some(m => 
                m.source && m.source.element === functoid.element
            );
            
            if (hasSourceConnection && hasDestConnection) {
                return functoid;
            }
        }
        return null;
    }
    
    generateFunctoidCall(functoid, sourceVar, sourcePath) {
        switch (functoid.type) {
            case 'string':
                return `StringConcat(${sourceVar}.${sourcePath})`;
            case 'math':
                return `MathOperation(${sourceVar}.${sourcePath})`;
            case 'logical':
                return `LogicalAnd(${sourceVar}.${sourcePath})`;
            case 'conversion':
                return `Convert<string>(${sourceVar}.${sourcePath})`;
            default:
                return `${sourceVar}.${sourcePath}`;
        }
    }
    
    handleConnectorClick(e) {
        e.stopPropagation();
        const connector = e.target;
        
        if (!this.selectedConnector) {
            // First connector selected
            this.selectedConnector = connector;
            connector.classList.add('active');
            this.createTempLine(connector);
        } else {
            // Second connector selected - create mapping
            if (this.selectedConnector !== connector) {
                this.createMapping(this.selectedConnector, connector);
            }
            this.cancelConnection();
        }
    }
    
    createTempLine(connector) {
        const pos = this.getConnectorPosition(connector);
        this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempLine.classList.add('mapping-line', 'temp');
        this.tempLine.setAttribute('d', `M ${pos.x} ${pos.y} L ${pos.x} ${pos.y}`);
        this.svg.appendChild(this.tempLine);
    }
    
    updateTempLine(e) {
        if (!this.tempLine || !this.selectedConnector) return;
        
        const startPos = this.getConnectorPosition(this.selectedConnector);
        const rect = this.mappingCanvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        
        const path = this.createCurvePath(startPos.x, startPos.y, endX, endY);
        this.tempLine.setAttribute('d', path);
    }
    
    cancelConnection() {
        if (this.selectedConnector) {
            this.selectedConnector.classList.remove('active');
            this.selectedConnector = null;
        }
        if (this.tempLine) {
            this.tempLine.remove();
            this.tempLine = null;
        }
    }
    
    createMapping(connector1, connector2) {
        const pos1 = this.getConnectorPosition(connector1);
        const pos2 = this.getConnectorPosition(connector2);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.classList.add('mapping-line');
        
        const path = this.createCurvePath(pos1.x, pos1.y, pos2.x, pos2.y);
        line.setAttribute('d', path);
        
        // Get connector information
        const sourceInfo = this.getConnectorInfo(connector1);
        const destInfo = this.getConnectorInfo(connector2);
        
        // Store mapping data with source and destination paths
        const mapping = {
            connector1,
            connector2,
            source: sourceInfo,
            destination: destInfo,
            line,
            id: Date.now()
        };
        
        this.mappings.push(mapping);
        this.svg.appendChild(line);
        
        // Update mapping count
        this.updateMappingCount();
        
        // Add double-click to delete (no confirmation needed)
        line.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Double-click detected on mapping line');
            this.deleteMapping(mapping);
        });
        
        // Add single click for debugging
        line.addEventListener('click', (e) => {
            console.log('Single click on line detected');
        });
        
        // Optional: Add visual feedback on hover
        line.addEventListener('mouseenter', () => {
            line.style.strokeWidth = '4';
            line.style.cursor = 'pointer';
            line.style.stroke = 'var(--bs-danger)';
        });
        
        line.addEventListener('mouseleave', () => {
            line.style.strokeWidth = '2';
            line.style.stroke = '';
        });
    }
    
    deleteMapping(mapping) {
        const index = this.mappings.indexOf(mapping);
        if (index > -1) {
            this.mappings.splice(index, 1);
            mapping.line.remove();
            this.updateMappingCount();
        }
    }
    
    createCurvePath(x1, y1, x2, y2) {
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
    }
    
    getConnectorPosition(connector) {
        const canvasRect = this.mappingCanvas.getBoundingClientRect();
        const connectorRect = connector.getBoundingClientRect();
        
        return {
            x: connectorRect.left + connectorRect.width / 2 - canvasRect.left,
            y: connectorRect.top + connectorRect.height / 2 - canvasRect.top
        };
    }
    
    addFunctoid(type, position = null, id = null) {
        const functoid = document.createElement('div');
        functoid.className = `functoid ${type}`;
        
        if (position) {
            functoid.style.left = position.x + 'px';
            functoid.style.top = position.y + 'px';
        } else {
            functoid.style.left = '50%';
            functoid.style.top = '50%';
        }
        functoid.style.transform = 'translate(-50%, -50%)';
        
        const icons = {
            string: 'bi-fonts',
            math: 'bi-calculator',
            logical: 'bi-check-square',
            conversion: 'bi-arrow-left-right'
        };
        
        functoid.innerHTML = `
            <i class="bi ${icons[type]}"></i>
            <div class="functoid-connector left"></div>
            <div class="functoid-connector right"></div>
            <div class="delete-btn">×</div>
        `;
        
        const functoidData = {
            element: functoid,
            type,
            id: id !== null ? id : this.functoidCounter++
        };
        
        // Update counter if loading with specific ID
        if (id !== null && id >= this.functoidCounter) {
            this.functoidCounter = id + 1;
        }
        
        this.functoids.push(functoidData);
        this.functoidArea.appendChild(functoid);
        
        // Add connector event listeners
        functoid.querySelectorAll('.functoid-connector').forEach(connector => {
            connector.addEventListener('click', (e) => this.handleConnectorClick(e));
        });
        
        // Add delete button listener
        functoid.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFunctoid(functoidData);
        });
    }
    
    deleteFunctoid(functoidData) {
        // Remove all mappings connected to this functoid
        const connectorsToRemove = functoidData.element.querySelectorAll('.functoid-connector');
        this.mappings = this.mappings.filter(mapping => {
            const shouldRemove = Array.from(connectorsToRemove).includes(mapping.connector1) ||
                                Array.from(connectorsToRemove).includes(mapping.connector2);
            if (shouldRemove) {
                mapping.line.remove();
            }
            return !shouldRemove;
        });
        
        // Remove functoid
        const index = this.functoids.indexOf(functoidData);
        if (index > -1) {
            this.functoids.splice(index, 1);
        }
        functoidData.element.remove();
    }
    
    startDraggingFunctoid(e) {
        const functoid = e.target.closest('.functoid');
        if (!functoid || e.target.closest('.functoid-connector') || e.target.closest('.delete-btn')) {
            return;
        }
        
        this.isDraggingFunctoid = true;
        this.draggedFunctoid = functoid;
        
        const rect = functoid.getBoundingClientRect();
        const canvasRect = this.mappingCanvas.getBoundingClientRect();
        
        this.dragOffset = {
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        };
        
        functoid.classList.add('dragging');
    }
    
    dragFunctoid(e) {
        if (!this.isDraggingFunctoid || !this.draggedFunctoid) return;
        
        const canvasRect = this.mappingCanvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - this.dragOffset.x;
        const y = e.clientY - canvasRect.top - this.dragOffset.y;
        
        // Constrain to canvas bounds
        const maxX = canvasRect.width - 30;
        const maxY = canvasRect.height - 30;
        const constrainedX = Math.max(30, Math.min(x, maxX));
        const constrainedY = Math.max(30, Math.min(y, maxY));
        
        this.draggedFunctoid.style.left = constrainedX + 'px';
        this.draggedFunctoid.style.top = constrainedY + 'px';
        this.draggedFunctoid.style.transform = 'translate(-50%, -50%)';
        
        // Update connected mappings
        this.updateConnectedMappings();
    }
    
    stopDraggingFunctoid() {
        if (this.draggedFunctoid) {
            this.draggedFunctoid.classList.remove('dragging');
        }
        this.isDraggingFunctoid = false;
        this.draggedFunctoid = null;
    }
    
    updateConnectedMappings() {
        this.mappings.forEach(mapping => {
            const pos1 = this.getConnectorPosition(mapping.connector1);
            const pos2 = this.getConnectorPosition(mapping.connector2);
            const path = this.createCurvePath(pos1.x, pos1.y, pos2.x, pos2.y);
            mapping.line.setAttribute('d', path);
        });
    }
    
    clearAllMappings() {
        if (this.mappings.length === 0 && this.functoids.length === 0) {
            return;
        }
        
        if (confirm('Clear all mappings and functoids?')) {
            // Clear all mappings
            this.mappings.forEach(mapping => mapping.line.remove());
            this.mappings = [];
            
            // Clear all functoids
            this.functoids.forEach(functoid => functoid.element.remove());
            this.functoids = [];
            
            this.cancelConnection();
            
            // Update mapping count badge
            this.updateMappingCount();
        }
    }
    
    updateMappingCount() {
        const badge = document.getElementById('mappingCount');
        if (badge) {
            const count = this.mappings.length;
            badge.textContent = `${count} mapping${count !== 1 ? 's' : ''}`;
        }
    }
    
    testSyntaxHighlighting() {
        // Test the syntax highlighting with sample JSON
        const testJSON = {
            "message": "Syntax highlighting test",
            "number": 42,
            "boolean": true,
            "null": null,
            "array": [1, 2, 3]
        };
        
        const resultElement = document.getElementById('executionResult');
        if (resultElement && resultElement.tagName === 'JSON-VIEWER') {
            resultElement.setJSON(testJSON);
        } else if (resultElement && resultElement.tagName === 'PRE') {
            resultElement.innerHTML = this.formatJSONWithSyntaxHighlight(testJSON);
        }
    }

    copySourceToDestination() {
        // Copy the source schema 1:1 to the destination schema
        if (!this.sourceSchema || Object.keys(this.sourceSchema).length === 0) {
            alert('Source schema is empty. Please load a source schema first.');
            return;
        }

        // Check if there are existing mappings that will be cleared
        if (this.mappings.length > 0) {
            const confirmed = confirm(
                `⚠️ Warning: Changing the destination schema will break and clear ${this.mappings.length} existing mapping(s).\n\n` +
                'Do you want to continue?'
            );
            
            if (!confirmed) {
                return; // User cancelled the operation
            }

            // Clear all existing mappings
            this.mappings.forEach(mapping => {
                mapping.line.remove();
            });
            this.mappings = [];

            // Clear functoids as well
            this.functoids.forEach(functoid => {
                functoid.element.remove();
            });
            this.functoids = [];

            // Update the mapping badge
            const badge = document.querySelector('.mapping-badge');
            if (badge) {
                badge.textContent = '0 mappings';
            }
        }

        // Deep clone the source schema
        this.destinationSchema = JSON.parse(JSON.stringify(this.sourceSchema));

        // Update the destination panel with the copied schema
        this.renderSchemas();

        // Show success message
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success alert-dismissible fade show';
        successAlert.role = 'alert';
        successAlert.innerHTML = `
            <strong>Success!</strong> Source schema copied to Destination.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(successAlert, container.firstChild);
            setTimeout(() => successAlert.remove(), 3000);
        }
    }
}

// Initialize the mapping tool when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mappingTool = new MappingTool();
    
    // Bind the "Copy Source Schema" button
    const copySourceBtn = document.getElementById('copySourceToDestination');
    if (copySourceBtn) {
        copySourceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            mappingTool.copySourceToDestination();
        });
    }

    // Initialize page navigation system
    initializePageNavigation();
    
    // Bind AI Assistant menu button
    const openAIBtn = document.getElementById('openAIAssistant');
    if (openAIBtn) {
        openAIBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Click the AI Assistant tab
            const aiTab = document.querySelector('[data-page="ai-assistant"]');
            if (aiTab) {
                aiTab.click();
            }
        });
    }

    // Auto-load TinyLlama model on startup
    autoLoadWebLLMModel();

    // Diagnostic helper for WebLLM
    window.diagnosticWebLLM = async function() {
        console.log('🔍 WebLLM Diagnostic Tool');
        console.log('=========================');
        
        if (!window.webllm) {
            console.error('❌ WebLLM not loaded');
            return;
        }
        
        console.log('✅ WebLLM loaded');
        console.log('Available exports:', Object.keys(window.webllm));
        
        try {
            const { MLCEngine } = window.webllm;
            const engine = new MLCEngine();
            
            // Try to get model list from appConfig if available
            if (engine.appConfig && engine.appConfig.model_list) {
                console.log('📦 Available models from appConfig:');
                const models = engine.appConfig.model_list;
                console.table(models.map(m => ({
                    'Model ID': m.model_id,
                    'Library URL': m.model_library_url ? '✓' : '✗',
                    'Quantization': m.quantization || 'N/A'
                })));
                
                // Also log full model objects for inspection
                console.log('Full model details:', models);
                
                return models.map(m => m.model_id);
            }
            
            // Check for other ways to get model list
            console.log('Engine properties:', Object.keys(engine));
            
        } catch (e) {
            console.error('Error accessing WebLLM engine:', e);
        }
    };
    
    console.log('💡 Tip: Run window.diagnosticWebLLM() in console to see available models');
});

/**
 * Initialize AI Assistant with WebLLM
 */
function initializeAIAssistant() {
    const container = document.getElementById('aiAssistantContainer');
    if (!container) {
        console.error('AI Assistant container not found');
        return;
    }
    
    // Only initialize once - check for a flag, not innerHTML
    if (container.dataset.initialized === 'true') {
        console.log('AI Assistant already initialized');
        return;
    }

    try {
        // Check if classes exist
        if (typeof WebLLMConfig === 'undefined') {
            throw new Error('WebLLMConfig class not found - webllm-config.js may not have loaded');
        }
        if (typeof WebLLMUI === 'undefined') {
            throw new Error('WebLLMUI class not found - webllm-ui.js may not have loaded');
        }

        console.log('Creating WebLLM config...');
        const webllmConfig = new WebLLMConfig();
        console.log('WebLLM config created, hardware:', webllmConfig.hardwareInfo);

        console.log('Creating WebLLM UI...');
        const webllmUI = new WebLLMUI(webllmConfig);

        console.log('Rendering UI...');
        const html = webllmUI.render();
        container.innerHTML = html;
        container.dataset.initialized = 'true';

        console.log('Binding events...');
        webllmUI.bindEvents();

        // Store WebLLM config globally for property wizard
        window.mappingToolInstance.webllmConfig = webllmConfig;

        console.log('AI Assistant initialized successfully');

        // Check if WebLLM library is loaded
        if (!window.webllm) {
            const warning = document.createElement('div');
            warning.className = 'alert alert-warning';
            warning.innerHTML = `
                <strong>⚠️ WebLLM Library Not Loaded</strong><br>
                The @mlc-ai/web-llm library did not load. 
                Please refresh the page or check your internet connection.
            `;
            container.insertBefore(warning, container.firstChild);
        }
    } catch (error) {
        console.error('Error initializing AI Assistant:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error:</strong> ${error.message}<br>
                <small>Check browser console (F12) for details</small>
            </div>
        `;
    }
}


/**
 * Initialize page navigation system
 */
function initializePageNavigation() {
    const tabs = document.querySelectorAll('.page-tab');
    const pages = document.querySelectorAll('.page-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = tab.dataset.page;

            // Update tab states
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update page visibility
            pages.forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`page-${pageName}`);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // Initialize AI Assistant ONLY when tab is clicked and page becomes visible
                if (pageName === 'ai-assistant') {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        initializeAIAssistant();
                    }, 100);
                }
            }
        });
    });
}

/**
 * Auto-load TinyLlama model on application startup
 */
async function autoLoadWebLLMModel() {
    // Show loading modal
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    try {
        // Wait a bit for page to fully render
        await new Promise(resolve => setTimeout(resolve, 500));

        // Initialize AI Assistant first
        initializeAIAssistant();

        // Wait for WebLLM to be initialized
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if mapping tool instance and webllm config are available
        if (!window.mappingToolInstance || !window.mappingToolInstance.webllmConfig) {
            console.log('WebLLM not ready yet, will retry...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!window.mappingToolInstance || !window.mappingToolInstance.webllmConfig) {
            throw new Error('WebLLM initialization failed');
        }

        const webllmConfig = window.mappingToolInstance.webllmConfig;
        
        // Update status
        const statusEl = document.getElementById('loadingStatus');
        const progressBar = document.getElementById('loadingProgressBar');
        const progressPercentage = document.getElementById('loadingPercentage');
        
        if (statusEl) {
            statusEl.textContent = 'Downloading TinyLlama 1.1B model...';
        }

        console.log('Starting auto-load of TinyLlama model...');

        // Try to load TinyLlama
        const modelId = 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC';
        
        await webllmConfig.initializeModel(modelId, (info) => {
            const progress = Math.round(info.progress * 100);
            
            // Update progress bar
            if (progressBar) {
                progressBar.style.width = progress + '%';
                progressBar.setAttribute('aria-valuenow', progress);
            }
            if (progressPercentage) {
                progressPercentage.textContent = progress + '%';
            }
            
            if (statusEl) {
                statusEl.textContent = `Loading model... ${progress}%`;
            }
            console.log(`Model load progress: ${progress}%`);
        });

        console.log('✅ TinyLlama model loaded successfully!');
        
        if (statusEl) {
            statusEl.textContent = 'Ready! You can now generate business descriptions.';
        }

        // Close modal after 2 seconds
        setTimeout(() => {
            loadingModal.hide();
            showToast('✨ WebLLM ready! Click the magic button to generate descriptions.', 'success');
        }, 2000);

    } catch (error) {
        console.error('Error auto-loading model:', error);
        
        const statusEl = document.getElementById('loadingStatus');
        if (statusEl) {
            statusEl.innerHTML = `<span class="text-danger">Error: ${error.message}</span><br><small>You can manually load a model from the AI Assistant tab.</small>`;
        }

        // Keep modal open on error
        setTimeout(() => {
            // Allow user to close it
        }, 3000);
    }
}

