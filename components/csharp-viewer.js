/**
 * C# Viewer Web Component
 * A terminal-style C# code viewer with syntax highlighting
 * 
 * Usage:
 * <csharp-viewer id="myViewer"></csharp-viewer>
 * 
 * JavaScript:
 * document.getElementById('myViewer').setCode("public class MyClass { }");
 * const code = document.getElementById('myViewer').getText();
 */
class CSharpViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._code = null;
        this.render();
    }

    connectedCallback() {
        // Component is added to the DOM
    }

    /**
     * Set C# code to display with syntax highlighting
     * @param {string} code - C# code string to display
     */
    setCode(code) {
        this._code = code;
        this.updateDisplay();
    }

    /**
     * Get the plain text content (without HTML tags)
     * @returns {string} Plain text C# code
     */
    getText() {
        const pre = this.shadowRoot.querySelector('pre');
        return pre ? pre.textContent : '';
    }

    /**
     * Clear the code display
     */
    clear() {
        this._code = null;
        const pre = this.shadowRoot.querySelector('pre');
        if (pre) {
            pre.innerHTML = '';
        }
    }

    /**
     * Format C# code with syntax highlighting
     * @param {string} code - C# code to format
     * @returns {string} HTML with syntax highlighting
     */
    formatCSharpWithSyntaxHighlight(code) {
        if (!code) return '';
        
        // Escape HTML entities
        code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // C# Keywords
        const keywords = [
            'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
            'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
            'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
            'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
            'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
            'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
            'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this',
            'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort',
            'using', 'var', 'virtual', 'void', 'volatile', 'while', 'async', 'await', 'nameof',
            'when', 'get', 'set', 'value', 'partial', 'where', 'select', 'from', 'join', 'let',
            'orderby', 'group', 'by', 'into', 'on', 'equals', 'ascending', 'descending'
        ];
        
        // Highlight comments (// and /* */)
        code = code.replace(/(\/\/.*?$)/gm, '<span class="cs-comment">$1</span>');
        code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cs-comment">$1</span>');
        
        // Highlight strings
        code = code.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="cs-string">$1</span>');
        
        // Highlight numbers
        code = code.replace(/\b(\d+\.?\d*[fFdDmM]?)\b/g, '<span class="cs-number">$1</span>');
        
        // Highlight keywords
        const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
        code = code.replace(keywordPattern, '<span class="cs-keyword">$1</span>');
        
        // Highlight types (PascalCase words)
        code = code.replace(/\b([A-Z][a-zA-Z0-9]*(?:&lt;[^&]*&gt;)?)\b/g, '<span class="cs-type">$1</span>');
        
        // Highlight method calls
        code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="cs-method">$1</span>');
        
        return code;
    }

    updateDisplay() {
        const pre = this.shadowRoot.querySelector('pre');
        if (pre && this._code !== null) {
            pre.innerHTML = this.formatCSharpWithSyntaxHighlight(this._code);
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
                    margin: 0;
                    padding: 0.15rem;
                    font-family: 'Consolas', 'Courier New', monospace;
                    font-size: 0.75rem;
                    line-height: 1.4;
                    color: #d4d4d4;
                    background: #1e1e1e;
                    white-space: pre;
                    overflow: auto;
                    height: 100%;
                    box-sizing: border-box;
                }

                /* Scrollbar styling */
                pre::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                pre::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }

                pre::-webkit-scrollbar-thumb {
                    background: #424242;
                    border-radius: 4px;
                }

                pre::-webkit-scrollbar-thumb:hover {
                    background: #4e4e4e;
                }

                /* C# Syntax Highlighting - VS Code Dark+ Theme */
                .cs-keyword {
                    color: #569cd6;
                    font-weight: bold;
                }

                .cs-type {
                    color: #4ec9b0;
                }

                .cs-string {
                    color: #ce9178;
                }

                .cs-comment {
                    color: #6a9955;
                    font-style: italic;
                }

                .cs-number {
                    color: #b5cea8;
                }

                .cs-method {
                    color: #dcdcaa;
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
customElements.define('csharp-viewer', CSharpViewer);
