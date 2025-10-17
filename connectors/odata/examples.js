/**
 * OData Connector - Usage Examples
 * 
 * This file demonstrates how to use the OData Connector with the mapping tool
 */

// ==============================================================================
// EXAMPLE 1: Using the Demo Service (Recommended for Testing)
// ==============================================================================

// The UI includes a "Load Demo" button that automatically:
// 1. Sets the service URL to: https://services.odata.org/v4/TripPinServiceRW
// 2. Sets authentication to "None"
// 3. Connects to the service
// 4. Lists available entities

// To use programmatically:
function loadDemoODataService() {
    // Assuming the ODataConnectorUI instance is available globally
    if (window.odataConnectorUI) {
        window.odataConnectorUI.loadDemoService();
    }
}

// ==============================================================================
// EXAMPLE 2: Manually Create Connector and Connect to TripPin
// ==============================================================================

async function connectToTripPin() {
    const connector = new ODataConnector();
    
    const result = await connector.connect(
        'https://services.odata.org/v4/TripPinServiceRW',
        {} // No authentication needed
    );
    
    if (result.success) {
        console.log('Connected successfully!');
        console.log('Available entities:', result.entities);
        
        // Get all entities with details
        const entities = connector.getEntities();
        console.log(entities);
    } else {
        console.error('Connection failed:', result.message);
    }
}

// ==============================================================================
// EXAMPLE 3: Generate Schema from TripPin People Entity
// ==============================================================================

async function getPeopleEntitySchema() {
    const connector = new ODataConnector();
    
    await connector.connect('https://services.odata.org/v4/TripPinServiceRW');
    
    // Generate schema for the People entity
    const peopleSchema = connector.generateEntitySchema('People');
    
    console.log('People Entity Schema:', JSON.stringify(peopleSchema, null, 2));
    
    // Output example:
    // {
    //   "type": "object",
    //   "title": "People",
    //   "properties": {
    //     "PersonID": {
    //       "title": "PersonID",
    //       "type": "integer"
    //     },
    //     "FirstName": {
    //       "title": "FirstName",
    //       "type": "string"
    //     },
    //     "LastName": {
    //       "title": "LastName",
    //       "type": "string"
    //     },
    //     ... (more properties)
    //   },
    //   "required": ["PersonID", "FirstName", "LastName"]
    // }
    
    return peopleSchema;
}

// ==============================================================================
// EXAMPLE 4: Load Schema into Mapping Tool
// ==============================================================================

async function loadPeopleSchemaIntoMappingTool() {
    const connector = new ODataConnector();
    
    await connector.connect('https://services.odata.org/v4/TripPinServiceRW');
    
    const peopleSchema = connector.generateEntitySchema('People');
    
    // Load the schema into the mapping tool
    if (window.mappingToolInstance && window.mappingToolInstance.loadSchemasFromConfig) {
        window.mappingToolInstance.loadSchemasFromConfig({
            source: peopleSchema,
            destination: null
        });
    }
}

// ==============================================================================
// EXAMPLE 5: Preview Data from Airports Entity
// ==============================================================================

async function previewAirports() {
    const connector = new ODataConnector();
    
    await connector.connect('https://services.odata.org/v4/TripPinServiceRW');
    
    // Fetch sample data (top 5)
    const airportData = await connector.fetchEntityData('Airports', 5);
    
    console.log('Sample Airport Data:', airportData);
    
    // You can then use this data for testing mappings
}

// ==============================================================================
// EXAMPLE 6: Working with Authenticated Services
// ==============================================================================

async function connectWithAuthentication() {
    const connector = new ODataConnector();
    
    // Example with Basic Authentication
    const options = {
        headers: {
            'Authorization': 'Basic ' + btoa('username:password')
        }
    };
    
    const result = await connector.connect(
        'https://your-enterprise-odata-service.com/odata/v4',
        options
    );
    
    if (result.success) {
        console.log('Connected with authentication');
    }
}

// ==============================================================================
// EXAMPLE 7: Using Bearer Token Authentication
// ==============================================================================

async function connectWithBearerToken(token) {
    const connector = new ODataConnector();
    
    const options = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    
    const result = await connector.connect(
        'https://your-api.com/odata/v4',
        options
    );
    
    return result;
}

// ==============================================================================
// EXAMPLE 8: TripPin Entity Reference
// ==============================================================================

const TRIPPIN_ENTITIES = {
    'People': {
        description: 'Person records',
        keyProperty: 'PersonID',
        properties: ['PersonID', 'FirstName', 'LastName', 'Gender', 'Age', 'Email', 'AddressInfo', 'HomeAddress', 'FavoriteFeature']
    },
    'Airports': {
        description: 'Airport information',
        keyProperty: 'IcaoCode',
        properties: ['IcaoCode', 'Name', 'IataCode', 'Location']
    },
    'Airlines': {
        description: 'Airline details',
        keyProperty: 'AirlineCode',
        properties: ['AirlineCode', 'Name']
    },
    'Trips': {
        description: 'Trip information',
        keyProperty: 'TripID',
        properties: ['TripID', 'ShareID', 'Name', 'Budget', 'Description', 'Tags', 'StartsAt', 'EndsAt', 'PlanItems']
    },
    'Events': {
        description: 'Event data',
        keyProperty: 'EventID',
        properties: ['EventID', 'Name', 'OccurredAt', 'Description']
    },
    'Photos': {
        description: 'Photo information',
        keyProperty: 'PhotoID',
        properties: ['PhotoID', 'Name', 'Url']
    },
    'Me': {
        description: 'Current user/self',
        keyProperty: 'PersonID',
        properties: ['PersonID', 'FirstName', 'LastName', 'Gender', 'Age', 'Email', 'AddressInfo', 'HomeAddress']
    }
};

// ==============================================================================
// EXAMPLE 9: Browser Console Testing
// ==============================================================================

/*
To test in browser console, try these commands:

1. Load demo service:
   window.odataConnectorUI.loadDemoService()

2. After connected, view entities:
   window.odataConnectorUI.connector.getEntities()

3. Get schema for People:
   const schema = window.odataConnectorUI.connector.generateEntitySchema('People')
   console.log(JSON.stringify(schema, null, 2))

4. Fetch sample data:
   await window.odataConnectorUI.connector.fetchEntityData('Airports', 3)

5. Check connection status:
   window.odataConnectorUI.connector.getConnectionStatus()
*/

// ==============================================================================
// EXAMPLE 10: Common Mapping Scenarios
// ==============================================================================

const MAPPING_SCENARIOS = {
    
    // Scenario 1: Flatten nested People data
    scenarioFlattenPeople: {
        description: 'Flatten TripPin People entity to a simple contact format',
        source: 'People',
        target: 'Contact',
        mappings: [
            { source: 'FirstName', target: 'FirstName' },
            { source: 'LastName', target: 'LastName' },
            { source: 'Email', target: 'EmailAddress' },
            { source: 'Gender', target: 'Gender' }
        ]
    },
    
    // Scenario 2: Transform trip information
    scenarioTransformTrips: {
        description: 'Transform TripPin Trips to internal Trip format',
        source: 'Trips',
        target: 'InternalTrip',
        mappings: [
            { source: 'TripID', target: 'Id' },
            { source: 'Name', target: 'Title' },
            { source: 'Budget', target: 'MaxBudget' },
            { source: 'StartsAt', target: 'StartDate' },
            { source: 'EndsAt', target: 'EndDate' }
        ]
    },
    
    // Scenario 3: Consolidate airport information
    scenarioAirportLookup: {
        description: 'Create airport reference with ICAO and IATA codes',
        source: 'Airports',
        target: 'AirportReference',
        mappings: [
            { source: 'IcaoCode', target: 'IcaoCode' },
            { source: 'IataCode', target: 'IataCode' },
            { source: 'Name', target: 'AirportName' }
        ]
    }
};

// ==============================================================================
// Helper Function: Print Available Entities
// ==============================================================================

async function printAvailableEntities() {
    if (!window.odataConnectorUI || !window.odataConnectorUI.isConnected()) {
        console.log('OData service not connected. Click "Load Demo" first.');
        return;
    }
    
    const entities = window.odataConnectorUI.connector.getEntities();
    
    console.log('=== Available OData Entities ===');
    entities.forEach((entity, index) => {
        console.log(`${index + 1}. ${entity.name} (${entity.propertyCount} properties)`);
    });
}

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        connectToTripPin,
        getPeopleEntitySchema,
        previewAirports,
        TRIPPIN_ENTITIES,
        MAPPING_SCENARIOS
    };
}