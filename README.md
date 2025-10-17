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
- **🚀 AI-Powered Field Documentation** - WebLLM integration for automatic business descriptions
- **📋 Property Inspector** - Click on destination fields to edit metadata and properties
- **✨ Field Business Descriptions** - Generate AI-powered business descriptions for fields using local LLM
- **🔒 Automatic Model Loading** - TinyLlama 1.1B auto-loads on startup with progress tracking
- **💻 On-Device AI** - All LLM processing happens locally, no external API calls
- **🎯 Two-Column Property Editor** - Optimized layout for field metadata (left) and descriptions (right)
- **⏳ Real-Time Generation** - Stream AI-generated text directly into the editor
- **🔄 Smart Field Locking** - Destination fields are disabled during AI generation with visual feedback
- **📊 Loading Indicators** - Animated spinner shows generation progress next to selected field

## Technologies Used

- **AdminLTE 4.0.0-rc5** - Admin dashboard template
- **Bootstrap 5.3.7** - CSS framework
- **Bootstrap Icons 1.13.1** - Icon library
- **OverlayScrollbars 2.11.0** - Custom scrollbar styling
- **WebLLM 0.2.47** - On-device LLM inference via WebGPU/WASM
- **TinyLlama 1.1B** - Efficient local language model for text generation
- **Vanilla JavaScript** - No framework dependencies for core logic
- **Split.js** - Resizable split pane layouts

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

### Field Properties

Extended field definitions can include:

```json
{
  "name": "CustomerID",
  "type": "field",
  "dataType": "string",
  "format": "uuid",
  "required": true,
  "default": null,
  "description": "Technical details (optional)",
  "businessDescription": "A unique identifier that distinguishes each customer"
}
```

**Field Attributes:**
- `name` - Field identifier
- `type` - "field", "parent", or "root"
- `dataType` - Data type (string, number, boolean, date, etc.)
- `format` - Format hint (uuid, email, date-time, etc.)
- `required` - Boolean indicating if field is mandatory
- `default` - Default value for the field
- `description` - Technical description (optional)
- `businessDescription` - Business-friendly description (AI-generated or manual)

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

## AI-Powered Features

### 🤖 WebLLM Integration

The mapping tool includes an integrated WebLLM engine for on-device AI inference. This allows you to:

- Generate business descriptions for fields automatically
- Process all AI locally without sending data to external services
- Use TinyLlama 1.1B (0.6GB) model for efficient inference
- Get real-time streaming output as the model generates text

### ✨ Field Property Editor

**Accessing the Inspector:**
1. Click on any destination field in the schema tree
2. The field becomes highlighted in blue
3. The "Properties" tab opens in the bottom panel

**Field Properties:**
- **Field Name** - Read-only identifier
- **Type** - Data type (string, number, object, etc.)
- **Format** - Optional format hint (date-time, email, etc.)
- **Default Value** - Default value for the field
- **Required** - Checkbox to mark field as required
- **Business Description** - AI-generated user-friendly description

### 🎯 AI Description Wizard

**Generating Descriptions:**
1. Open a field's Properties in the inspector
2. Click the magic wand (✨) button next to "Business Description"
3. The tool will:
   - Show a loading modal on first use (initializes TinyLlama)
   - Disable other field selection during generation
   - Display a spinning indicator next to the selected field
   - Stream the generated description in real-time
   - Auto-save to the field properties

**Example Generated Description:**
- Input: Field "CustomerID" (type: string)
- Output: "A unique identifier that distinguishes each customer in the system"

### ⚙️ Automatic Model Loading

On startup:
1. WebLLM checks for available models
2. TinyLlama 1.1B is automatically queued for download
3. A loading modal shows progress (0-100%)
4. Once loaded, the AI Assistant is ready to use
5. Subsequent generations are instant (no download delay)

**Progress Tracking:**
- Visual progress bar
- Percentage indicator
- Download size and speed information
- Status messages

### 📝 Property Persistence

All field properties are saved automatically:
- Click "Save" to persist changes to the destination schema
- Properties are stored in the JSON schema definition
- Click "Clear" to deselect and reset the inspector
- Changes survive across mapping operations

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

### 6. Document Fields with AI

- Click on any destination field to open its properties
- Click the magic wand to generate a business description
- Wait for generation to complete (usually 10-30 seconds)
- Review the description and edit if needed
- Click "Save" to persist to the schema

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

### WebLLM Requirements

For AI features to work, your browser must support:
- **WebGPU** - For GPU-accelerated inference (recommended)
- **WebAssembly (WASM)** - For CPU fallback
- **Sufficient Memory** - At least 2GB for TinyLlama model

**Browser Support:**
- ✅ Chrome 113+ (with WebGPU)
- ✅ Edge 113+ (with WebGPU)
- ✅ Firefox 120+ (with WASM fallback)
- ✅ Safari 18+ (with WebGPU)
- ⚠️ Chrome 90-112 (WASM fallback, slower)
- ❌ Internet Explorer (not supported)

## AdminLTE Features

The tool leverages AdminLTE's powerful features:
- **Collapsible Cards** - Expand/collapse configuration panel
- **Card Maximize** - Fullscreen mapping canvas
- **Sidebar Navigation** - Quick access to all functions
- **Responsive Layout** - Mobile-friendly design
- **Custom Scrollbars** - Smooth scrolling in schema panels
- **Bootstrap Icons** - Professional icon set
- **Dark Mode Ready** - Switch themes easily

## Troubleshooting

### AI Features Not Working

**Issue: "WebLLM not initialized" message**
- Solution: Wait for the loading modal to complete on startup
- The model needs to download on first use (usually 1-2 minutes)
- Check browser console for detailed error messages

**Issue: Generation is very slow**
- Solution: Your browser may be using WASM instead of WebGPU
- Try using Chrome or Edge for GPU acceleration
- First generation is slower as the model loads to memory

**Issue: Browser crashes during generation**
- Solution: The model requires significant memory
- Close other tabs/applications to free up RAM
- Try a lighter task first to verify functionality

### WebLLM Model Download Issues

**Problem: Download fails or times out**
- Check your internet connection
- The model is ~600MB, so a good connection is needed
- Try refreshing the page to retry
- Check if your firewall blocks CDN access

### Schema/Mapping Issues

**Problem: Fields don't appear clickable**
- Make sure you've loaded a schema first
- Destination fields must be in the right panel
- Refresh the page if fields appear but aren't responsive

**Problem: Properties don't save**
- Click the "Save" button explicitly
- Check browser console for errors
- Verify the field is properly selected (highlighted in blue)

## Performance Tips

- **First Load**: WebLLM downloads happen automatically on first use
- **Subsequent Loads**: No download needed, instant inference
- **GPU vs CPU**: WebGPU (GPU) is 5-10x faster than WASM (CPU)
- **Model Size**: TinyLlama is optimized for speed, not max accuracy
- **Batch Operations**: Generate descriptions one at a time for best performance

## Project Structure

```
mapping/
├── index.html                  # Main application (AdminLTE integrated)
├── mapping-tool.js             # Core mapping logic
├── mapping-styles.css          # Custom styles for mapping tool
├── style.css                   # Legacy styles
├── webllm-config.js            # WebLLM configuration and model management
├── webllm-ui.js                # WebLLM UI components
├── sample-schemas.json         # Sample schema data
├── sample-mapping.json         # Sample mapping configuration
├── README.md                   # This file
├── INTEGRATION.md              # Integration guide for WebLLM
├── components/
│   ├── json-editor.js          # JSON editor web component
│   ├── json-viewer.js          # JSON viewer web component
│   ├── csharp-viewer.js        # C# code viewer web component
│   └── ai/
│       └── README.md           # AI integration documentation
└── .gitignore                  # Git ignore rules
```

## Credits

- **AdminLTE** - [adminlte.io](https://adminlte.io)
- **Bootstrap** - [getbootstrap.com](https://getbootstrap.com)
- **Bootstrap Icons** - [icons.getbootstrap.com](https://icons.getbootstrap.com)

## License

Free to use and modify for your projects.
