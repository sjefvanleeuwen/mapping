# Dynamic Schema Mapping Tool

A web-based visual mapping tool inspired by BizTalk, built with pure HTML, CSS, and JavaScript. This tool allows you to visually map fields between source and destination schemas using JSON configuration.

## Features

- **Dynamic Schema Loading**: Load source and destination schemas from JSON
- **Visual Mapping**: Click-to-connect interface for creating field mappings
- **Functoids**: Add transformation blocks (String, Math, Logical, Conversion)
- **Drag & Drop**: Reposition functoids on the canvas
- **JSON Export/Import**: Export mappings as JSON and reload them later
- **No Dependencies**: Pure vanilla JavaScript, no frameworks required

## Getting Started

Simply open `index.html` in your web browser.

## JSON Schema Format

### Schema Structure

Both source and destination schemas should follow this JSON format:

```json
{
  "name": "Schema",
  "type": "root",
  "children": [
    {
      "name": "ParentNode",
      "type": "parent",
      "children": [
        {
          "name": "FieldName",
          "type": "field",
          "dataType": "string"
        }
      ]
    }
  ]
}
```

### Node Types

- **root**: The top-level schema container
- **parent**: A container node that can have children
- **field**: A mappable field (leaf node)

### Example Source Schema

```json
{
  "name": "Schema",
  "type": "root",
  "children": [
    {
      "name": "Customer",
      "type": "parent",
      "children": [
        { "name": "FirstName", "type": "field", "dataType": "string" },
        { "name": "LastName", "type": "field", "dataType": "string" },
        { "name": "Email", "type": "field", "dataType": "string" },
        { "name": "Phone", "type": "field", "dataType": "string" }
      ]
    }
  ]
}
```

### Example Destination Schema

```json
{
  "name": "Schema",
  "type": "root",
  "children": [
    {
      "name": "Contact",
      "type": "parent",
      "children": [
        { "name": "FullName", "type": "field", "dataType": "string" },
        { "name": "EmailAddress", "type": "field", "dataType": "string" }
      ]
    }
  ]
}
```

## Mapping Output Format

When you generate the mapping output, it produces JSON in this format:

```json
{
  "version": "1.0",
  "timestamp": "2025-10-14T12:00:00.000Z",
  "mappings": [
    {
      "source": {
        "type": "field",
        "path": "Schema.Customer.FirstName",
        "schema": "source"
      },
      "target": {
        "type": "field",
        "path": "Schema.Contact.FullName",
        "schema": "dest"
      }
    },
    {
      "source": {
        "type": "field",
        "path": "Schema.Customer.Email",
        "schema": "source"
      },
      "target": {
        "type": "functoid",
        "functoidId": 0,
        "connectorSide": "left"
      }
    }
  ],
  "functoids": [
    {
      "id": 0,
      "type": "string",
      "position": {
        "x": 450,
        "y": 300
      }
    }
  ]
}
```

## How to Use

### 1. Load Schemas

- Click **"Load Sample Data"** to see an example
- Or paste your own JSON schemas in the text areas
- Click **"Load Schemas"** to render them

### 2. Create Mappings

- Click a connector dot (blue circle) on any field
- Click another connector dot to create a mapping
- The curved line represents the mapping

### 3. Add Functoids

- Click any functoid button in the toolbar
- Drag the functoid to position it
- Connect functoids to fields or other functoids

### 4. Export Mappings

- Click **"Generate Mapping JSON"** to create the output
- Click **"Copy to Clipboard"** to copy the JSON
- Save this JSON to reload the mapping later

### 5. Import Mappings

- Click **"Load Mapping"** 
- Paste your previously exported mapping JSON
- The tool will recreate all mappings and functoids

## Functoid Types

- **ABC** - String functoid (concatenation, substring, etc.)
- **+** - Math functoid (add, subtract, multiply, etc.)
- **IF** - Logical functoid (if/else conditions)
- **⇄** - Conversion functoid (type conversion)

## Tips

- Use the hierarchical path format for precise field identification
- Functoids can have multiple input and output connections
- Click any mapping line to delete it
- Use "Clear All Mappings" to start fresh
- Save your mapping JSON frequently for backup

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

Free to use and modify for your projects.
