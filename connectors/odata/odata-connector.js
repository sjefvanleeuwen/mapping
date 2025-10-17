/**
 * OData Connector
 * Provides functionality to connect to OData services and discover entity schemas
 */
class ODataConnector {
    constructor() {
        this.baseUrl = '';
        this.metadata = null;
        this.entities = [];
        this.isConnected = false;
    }

    /**
     * Connect to an OData service
     * @param {string} serviceUrl - The OData service URL
     * @param {object} options - Connection options (headers, auth, etc.)
     */
    async connect(serviceUrl, options = {}) {
        try {
            this.baseUrl = serviceUrl.replace(/\/$/, ''); // Remove trailing slash
            
            // Test connection by fetching service document
            const serviceDoc = await this.fetchServiceDocument();
            
            // Fetch metadata
            await this.fetchMetadata();
            
            this.isConnected = true;
            
            return {
                success: true,
                message: 'Connected successfully to OData service',
                entities: this.entities.map(e => e.name)
            };
        } catch (error) {
            this.isConnected = false;
            return {
                success: false,
                message: `Failed to connect to OData service: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Fetch the OData service document
     */
    async fetchServiceDocument() {
        const url = `${this.baseUrl}?$format=json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Fetch and parse OData metadata
     */
    async fetchMetadata() {
        const url = `${this.baseUrl}/$metadata`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch metadata: HTTP ${response.status}`);
        }
        
        const metadataXml = await response.text();
        this.metadata = metadataXml;
        
        // Parse entities from metadata
        this.parseEntitiesFromMetadata(metadataXml);
        
        return this.metadata;
    }

    /**
     * Parse entity types from OData metadata XML
     */
    parseEntitiesFromMetadata(metadataXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(metadataXml, 'text/xml');
        
        // Find all EntityType elements
        const entityTypes = xmlDoc.getElementsByTagName('EntityType');
        this.entities = [];
        
        for (let i = 0; i < entityTypes.length; i++) {
            const entityType = entityTypes[i];
            const entityName = entityType.getAttribute('Name');
            
            if (entityName) {
                const properties = [];
                const propertyElements = entityType.getElementsByTagName('Property');
                
                for (let j = 0; j < propertyElements.length; j++) {
                    const prop = propertyElements[j];
                    properties.push({
                        name: prop.getAttribute('Name'),
                        type: prop.getAttribute('Type'),
                        nullable: prop.getAttribute('Nullable') !== 'false',
                        maxLength: prop.getAttribute('MaxLength')
                    });
                }
                
                this.entities.push({
                    name: entityName,
                    properties: properties
                });
            }
        }
    }

    /**
     * Generate JSON schema for a specific entity
     * @param {string} entityName - Name of the entity
     */
    generateEntitySchema(entityName) {
        const entity = this.entities.find(e => e.name === entityName);
        if (!entity) {
            throw new Error(`Entity '${entityName}' not found`);
        }

        const schema = {
            type: 'object',
            title: entityName,
            properties: {}
        };

        const required = [];

        entity.properties.forEach(prop => {
            const propSchema = {
                title: prop.name
            };

            // Map OData types to JSON Schema types
            switch (prop.type) {
                case 'Edm.String':
                    propSchema.type = 'string';
                    if (prop.maxLength && prop.maxLength !== 'Max') {
                        propSchema.maxLength = parseInt(prop.maxLength);
                    }
                    break;
                case 'Edm.Int32':
                case 'Edm.Int64':
                    propSchema.type = 'integer';
                    break;
                case 'Edm.Double':
                case 'Edm.Decimal':
                    propSchema.type = 'number';
                    break;
                case 'Edm.Boolean':
                    propSchema.type = 'boolean';
                    break;
                case 'Edm.DateTime':
                case 'Edm.DateTimeOffset':
                    propSchema.type = 'string';
                    propSchema.format = 'date-time';
                    break;
                case 'Edm.Date':
                    propSchema.type = 'string';
                    propSchema.format = 'date';
                    break;
                case 'Edm.Guid':
                    propSchema.type = 'string';
                    propSchema.format = 'uuid';
                    break;
                default:
                    propSchema.type = 'string';
            }

            schema.properties[prop.name] = propSchema;

            if (!prop.nullable) {
                required.push(prop.name);
            }
        });

        if (required.length > 0) {
            schema.required = required;
        }

        return schema;
    }

    /**
     * Get all available entities
     */
    getEntities() {
        return this.entities.map(e => ({
            name: e.name,
            propertyCount: e.properties.length
        }));
    }

    /**
     * Test data retrieval from an entity
     * @param {string} entityName - Name of the entity
     * @param {number} top - Number of records to retrieve (default: 10)
     */
    async fetchEntityData(entityName, top = 10) {
        if (!this.isConnected) {
            throw new Error('Not connected to OData service');
        }

        try {
            // Try with $format=json first
            let url = `${this.baseUrl}/${entityName}?$top=${top}&$format=json`;
            let response = await fetch(url);
            
            // If 404 with $format=json, try without it
            if (response.status === 404) {
                console.warn(`Trying alternative URL format for ${entityName}`);
                url = `${this.baseUrl}/${entityName}?$top=${top}`;
                response = await fetch(url);
            }
            
            if (!response.ok) {
                // Try with Accept header instead
                console.warn(`Trying with Accept header for ${entityName}`);
                const headerResponse = await fetch(url, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!headerResponse.ok) {
                    throw new Error(`Failed to fetch data: HTTP ${headerResponse.status}`);
                }
                
                response = headerResponse;
            }
            
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                // Try to parse as JSON anyway
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    return data.value || data;
                } catch (e) {
                    console.error('Response is not JSON:', contentType);
                    throw new Error(`Response is not JSON format (${contentType})`);
                }
            }
            
            const data = await response.json();
            return data.value || data;
            
        } catch (error) {
            console.error(`Error fetching entity data for ${entityName}:`, error);
            // Return empty array instead of throwing to allow UI to continue
            console.warn(`Could not fetch data for ${entityName}, returning empty array`);
            return [];
        }
    }

    /**
     * Disconnect from the service
     */
    disconnect() {
        this.baseUrl = '';
        this.metadata = null;
        this.entities = [];
        this.isConnected = false;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            baseUrl: this.baseUrl,
            entityCount: this.entities.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ODataConnector;
}