/**
 * JSON Viewer Web Component
 * A terminal-style JSON viewer with VS Code Dark+ syntax highlighting
 * 
 * Usage:
 * <json-viewer id="myViewer"></json-viewer>
 * 
 * JavaScript:
 * document.getElementById('myViewer').setJSON({ key: "value" });
 * const text = document.getElementById('myViewer').getText();
 */
class JsonViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._jsonData = null;
        this.render();
    }

    connectedCallback() {
        // Component is added to the DOM
    }

    /**
     * Set JSON data to display with syntax highlighting
     * @param {Object|string} json - JSON object or string to display
     */
    setJSON(json) {
        this._jsonData = json;
        this.updateDisplay();
    }

    /**
     * Get the plain text content (without HTML tags)
     * @returns {string} Plain text JSON
     */
    getText() {
        const pre = this.shadowRoot.querySelector('pre');
        return pre ? pre.textContent : '';
    }

    /**
     * Clear the JSON display
     */
    clear() {
        this._jsonData = null;
        const pre = this.shadowRoot.querySelector('pre');
        if (pre) {
            pre.innerHTML = '';
        }
    }

    /**
     * Format JSON with syntax highlighting
     * @param {Object|string} json - JSON to format
     * @returns {string} HTML with syntax highlighting
     */
    formatJSONWithSyntaxHighlight(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        
        // Escape HTML entities
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Apply syntax highlighting
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

    updateDisplay() {
        const pre = this.shadowRoot.querySelector('pre');
        if (pre && this._jsonData !== null) {
            pre.innerHTML = this.formatJSONWithSyntaxHighlight(this._jsonData);
        }
    }

    render() {
        const style = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                pre {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-family: 'Consolas', 'Courier New', monospace;
                    font-size: 0.75rem;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    padding: 0.15rem;
                    margin: 0;
                    border: none;
                    border-radius: 0;
                    min-height: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    line-height: 1.4;
                    overflow: auto;
                }

                /* Dark mode scrollbar styling */
                pre::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                pre::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }

                pre::-webkit-scrollbar-thumb {
                    background: #424242;
                    border-radius: 0;
                }

                pre::-webkit-scrollbar-thumb:hover {
                    background: #4e4e4e;
                }

                .json-key {
                    color: #9cdcfe;
                    font-weight: normal;
                }

                .json-string {
                    color: #ce9178;
                }

                .json-number {
                    color: #b5cea8;
                }

                .json-boolean {
                    color: #569cd6;
                    font-weight: bold;
                }

                .json-null {
                    color: #569cd6;
                    font-weight: bold;
                }
            </style>
        `;

        const template = `
            ${style}
            <pre></pre>
        `;

        this.shadowRoot.innerHTML = template;
    }
}

// Register the custom element
customElements.define('json-viewer', JsonViewer);
