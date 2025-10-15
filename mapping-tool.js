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
                
                // Test syntax highlighting on load
                this.testSyntaxHighlighting();
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
            
            alert('Schemas loaded successfully!');
        } catch (error) {
            alert('Error parsing JSON: ' + error.message);
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
        nodeDiv.setAttribute('data-id', nodeId);
        nodeDiv.setAttribute('data-path', currentPath);
        
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
            alert('Please generate mapping output first!');
            return;
        }
        
        navigator.clipboard.writeText(output).then(() => {
            alert('Mapping JSON copied to clipboard!');
        }).catch(err => {
            alert('Failed to copy: ' + err);
        });
    }
    
    loadMappingFromJSON() {
        const jsonInput = prompt('Paste your mapping JSON here:');
        if (!jsonInput) return;
        
        try {
            const mappingData = JSON.parse(jsonInput);
            this.applyMappingData(mappingData);
            alert('Mapping loaded successfully!');
        } catch (error) {
            alert('Error loading mapping: ' + error.message);
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
                alert('Please provide source data to execute the mapping!');
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
            alert('Error executing mapping: ' + error.message);
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
            alert('Please execute the mapping first!');
            return;
        }
        
        navigator.clipboard.writeText(result).then(() => {
            alert('Result copied to clipboard!');
        }).catch(err => {
            alert('Failed to copy: ' + err);
        });
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
        
        // Store mapping data
        const mapping = {
            connector1,
            connector2,
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
            string: 'ABC',
            math: '+',
            logical: 'IF',
            conversion: '⇄'
        };
        
        functoid.innerHTML = `
            <span class="functoid-icon">${icons[type]}</span>
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
            alert('No mappings to clear!');
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
}

// Initialize the mapping tool when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mappingTool = new MappingTool();
});
