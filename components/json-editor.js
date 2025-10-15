/**
 * JSON Editor Web Component
 * An editable terminal-style JSON editor with VS Code Dark+ syntax highlighting
 * 
 * Usage:
 * <json-editor id="myEditor" rows="10"></json-editor>
 * 
 * JavaScript:
 * document.getElementById('myEditor').setValue('{ "key": "value" }');
 * const text = document.getElementById('myEditor').getValue();
 */
class JsonEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._debounceTimer = null;
        this.render();
    }

    connectedCallback() {
        // Component is added to the DOM
        const rows = this.getAttribute('rows') || '10';
        const minHeight = rows * 20; // Approximate height per row
        
        const container = this.shadowRoot.querySelector('.editor-container');
        if (container) {
            container.style.minHeight = minHeight + 'px';
        }

        // Setup input handlers
        const textarea = this.shadowRoot.querySelector('textarea');
        const highlighted = this.shadowRoot.querySelector('.highlighted');
        
        if (textarea && highlighted) {
            textarea.addEventListener('input', () => this.handleInput());
            textarea.addEventListener('scroll', () => this.syncScroll());
        }
    }

    static get observedAttributes() {
        return ['rows'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'rows') {
            const minHeight = newValue * 20;
            const container = this.shadowRoot.querySelector('.editor-container');
            if (container) {
                container.style.minHeight = minHeight + 'px';
            }
        }
    }

    /**
     * Set the editor value
     * @param {string|Object} value - String or JSON object to set
     */
    setValue(value) {
        const textarea = this.shadowRoot.querySelector('textarea');
        if (textarea) {
            if (typeof value === 'object') {
                textarea.value = JSON.stringify(value, null, 2);
            } else {
                textarea.value = value;
            }
            this.updateHighlight();
        }
    }

    /**
     * Get the current editor value
     * @returns {string} Current text content
     */
    getValue() {
        const textarea = this.shadowRoot.querySelector('textarea');
        return textarea ? textarea.value : '';
    }

    /**
     * Clear the editor
     */
    clear() {
        const textarea = this.shadowRoot.querySelector('textarea');
        const highlighted = this.shadowRoot.querySelector('.highlighted');
        if (textarea) {
            textarea.value = '';
        }
        if (highlighted) {
            highlighted.innerHTML = '';
        }
    }

    /**
     * Format the current JSON with proper indentation
     */
    format() {
        try {
            const current = this.getValue();
            if (current.trim()) {
                const parsed = JSON.parse(current);
                this.setValue(parsed);
            }
        } catch (error) {
            console.error('Invalid JSON, cannot format:', error);
        }
    }

    /**
     * Handle input changes with debouncing
     */
    handleInput() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        
        this._debounceTimer = setTimeout(() => {
            this.updateHighlight();
        }, 100);
    }

    /**
     * Sync scroll between textarea and highlighted div
     */
    syncScroll() {
        const textarea = this.shadowRoot.querySelector('textarea');
        const highlighted = this.shadowRoot.querySelector('.highlighted');
        
        if (textarea && highlighted) {
            highlighted.scrollTop = textarea.scrollTop;
            highlighted.scrollLeft = textarea.scrollLeft;
        }
    }

    /**
     * Update syntax highlighting
     */
    updateHighlight() {
        const textarea = this.shadowRoot.querySelector('textarea');
        const highlighted = this.shadowRoot.querySelector('.highlighted');
        
        if (textarea && highlighted) {
            const text = textarea.value;
            highlighted.innerHTML = this.formatJSONWithSyntaxHighlight(text);
        }
    }

    /**
     * Format JSON with syntax highlighting
     * @param {string} json - JSON text to highlight
     * @returns {string} HTML with syntax highlighting
     */
    formatJSONWithSyntaxHighlight(json) {
        if (!json) return '';
        
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

    render() {
        const style = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .editor-wrapper {
                    position: relative;
                    background: #1e1e1e;
                    border: none;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                }

                .editor-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 100%;
                }

                .highlighted {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    padding: 0.15rem;
                    margin: 0;
                    border: none;
                    font-family: 'Consolas', 'Courier New', monospace;
                    font-size: 0.75rem;
                    line-height: 1.4;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow: hidden;
                    pointer-events: none;
                    background: transparent;
                    box-sizing: border-box;
                }

                textarea {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: inherit;
                    background: transparent !important;
                    border: none !important;
                    color: #d4d4d4 !important;
                    caret-color: #d4d4d4 !important;
                    font-family: 'Consolas', 'Courier New', monospace !important;
                    font-size: 0.75rem !important;
                    padding: 0.15rem !important;
                    margin: 0;
                    resize: vertical;
                    box-sizing: border-box;
                    line-height: 1.4;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow: auto;
                    z-index: 1;
                }

                /* Make textarea text invisible so syntax highlighting shows through */
                textarea {
                    color: transparent !important;
                    -webkit-text-fill-color: transparent !important;
                }

                /* Show selection */
                textarea::selection {
                    background: #264f78;
                }

                .editor-wrapper:focus-within {
                    outline: none;
                }

                textarea:focus {
                    outline: none !important;
                }

                /* JSON Syntax Highlighting */
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

                /* Scrollbar styling - only for textarea */
                textarea::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                textarea::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }

                textarea::-webkit-scrollbar-thumb {
                    background: #424242;
                    border-radius: 0;
                }

                textarea::-webkit-scrollbar-thumb:hover {
                    background: #4e4e4e;
                }
            </style>
        `;

        const template = `
            ${style}
            <div class="editor-wrapper">
                <div class="editor-container">
                    <div class="highlighted"></div>
                    <textarea spellcheck="false"></textarea>
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = template;
    }
}

// Register the custom element
customElements.define('json-editor', JsonEditor);
