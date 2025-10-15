# Dynamic Schema Mapping Tool

A web-based visual mapping tool built with **AdminLTE 4** and **Bootstrap 5**, providing a professional admin interface for schema mapping operations. This tool allows you to visually map fields between source and destination schemas using JSON configuration.

## Features

- **Professional Admin Interface** - Built with AdminLTE 4 for a polished, enterprise-ready look
- **Dynamic Schema Loading** - Load source and destination schemas from JSON
- **Visual Mapping** - Click-to-connect interface for creating field mappings
- **Functoids** - Add transformation blocks (String, Math, Logical, Conversion)
- **Drag & Drop** - Reposition functoids on the canvas
- **JSON Export/Import** - Export mappings as JSON and reload them later
- **Execution Engine** - Test mappings with sample data and see results
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Mode Support** - Fully compatible with AdminLTE's dark mode
- **Sidebar Navigation** - Quick access to all features from the sidebar

## Technologies Used

- **AdminLTE 4.0.0-rc5** - Admin dashboard template
- **Bootstrap 5.3.7** - CSS framework
- **Bootstrap Icons 1.13.1** - Icon library
- **OverlayScrollbars 2.11.0** - Custom scrollbar styling
- **Vanilla JavaScript** - No framework dependencies for core logic

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

**Option A: Via Sidebar**
- Click on "Load Sample" in the sidebar to load example data
- Or click "Load Schemas" after pasting your JSON

**Option B: Via Configuration Panel**
- Click the + icon on the "Schema Configuration" card to expand it
- Paste your source and destination JSON schemas
- Paste sample source data for execution testing
- Click "Load Schemas"

### 2. Create Mappings

- Click a connector dot (colored circle) on any source field
- Click another connector dot on destination field to create a mapping
- The curved line represents the mapping
- Click any line to delete that specific mapping

### 3. Add Functoids

**Via Sidebar:**
- Expand the "Functoids" menu
- Click on String, Math, Logical, or Conversion

**Via Toolbar (if enabled):**
- Click functoid buttons to add to canvas
- Drag functoids to position them
- Connect functoids to fields or other functoids
- Delete functoids by clicking the × button that appears on hover

### 4. Execute Mappings

- Click "Execute Mapping" in the sidebar or main button
- The tool will apply your mappings to the sample data
- Results appear in the "Execution Result" card
- Click "Copy" to copy the result to clipboard

### 5. Export/Import Mappings

- Click "Generate JSON" to create mapping configuration
- Click "Copy to Clipboard" to copy the JSON
- Save this JSON to reload the mapping later
- Click "Load Mapping" and paste JSON to restore

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

## AdminLTE Features

The tool leverages AdminLTE's powerful features:
- **Collapsible Cards** - Expand/collapse configuration panel
- **Card Maximize** - Fullscreen mapping canvas
- **Sidebar Navigation** - Quick access to all functions
- **Responsive Layout** - Mobile-friendly design
- **Custom Scrollbars** - Smooth scrolling in schema panels
- **Bootstrap Icons** - Professional icon set
- **Dark Mode Ready** - Switch themes easily

## Project Structure

```
mapping/
├── index.html              # Main application (AdminLTE integrated)
├── mapping-tool.js         # Core mapping logic
├── mapping-styles.css      # Custom styles for mapping tool
├── style.css              # Legacy styles (can be removed)
├── sample-schemas.json    # Sample schema data
├── README.md              # This file
└── .gitignore             # Git ignore rules
```

## Credits

- **AdminLTE** - [adminlte.io](https://adminlte.io)
- **Bootstrap** - [getbootstrap.com](https://getbootstrap.com)
- **Bootstrap Icons** - [icons.getbootstrap.com](https://icons.getbootstrap.com)

## License

Free to use and modify for your projects.
