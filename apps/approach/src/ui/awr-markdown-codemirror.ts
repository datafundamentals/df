import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import '@material/web/button/filled-tonal-button.js';
import { marked } from 'marked';
import { countTokens, parseMarkdown } from '../services/file-processing.js';

@customElement('awr-markdown-codemirror')
export class AwrMarkdownCodeMirror extends LitElement {
  @property({ type: String })
  markdownContent = '';

  @state()
  private tokenCount = 0;

  @state()
  private lastCalculatedContent = '';

  @state()
  private isContentChanged = false;

  listener = EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged) {
      this.markdownContent = update.state.doc.toString();
      this.isContentChanged = this.markdownContent !== this.lastCalculatedContent;
      // Remove requestUpdate() to prevent infinite render loop
    }
  }) as never;

  editorView: EditorView | null = null;

  static override styles = css`
    :host {
      display: block;
      font-family: 'Roboto', sans-serif;
    }

    .editor-container {
      box-shadow: 0 0 0 0.5px black;
      border-radius: 5px;
      border: solid 0.5px lightgrey;
      background-color: #f9f9f9;
      padding: 5px;
    }

    #editor {
      border: 1px solid #ccc;
      margin-bottom: 5px;
      width: 100%;
    }

    .markdown-title {
      font-size: small;
      margin-left: 2px;
    }

    #output {
      margin-top: 20px;
      padding: 24px;
      background-color: var(--md-sys-color-primary-container, #eaddff);
      border: 1px solid var(--md-sys-color-primary, #6750a4);
      border-radius: 16px;
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    #output h1, #output h2, #output h3, #output h4, #output h5, #output h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    #output p {
      margin-bottom: 16px;
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    #output pre {
      background-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
    }

    #output code {
      background-color: var(--md-sys-color-surface-container-high, #ece6f0);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    #output blockquote {
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
      margin: 16px 0;
      padding: 8px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      font-style: italic;
    }

    .token-display {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .token-count {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 16px;
      padding: 4px 12px;
      border-radius: 8px;
      min-width: 60px;
      text-align: center;
    }

    .token-good {
      background-color: var(--md-sys-color-tertiary-container, #d8e5d8);
      color: var(--md-sys-color-on-tertiary-container, #0d3818);
      border: 1px solid var(--md-sys-color-tertiary, #5e795f);
    }

    .token-approaching {
      background-color: var(--md-sys-color-secondary-container, #e6e1ff);
      color: var(--md-sys-color-on-secondary-container, #1d1b20);
      border: 1px solid var(--md-sys-color-secondary, #9a91c4);
    }

    .token-warning {
      background-color: #ffeaa7;
      color: #d63031;
      border: 1px solid #fdcb6e;
    }

    .token-over-limit {
      background-color: #ff7675;
      color: #ffffff;
      border: 1px solid #d63031;
      animation: pulse 1.5s infinite;
    }

    .token-changed {
      background-color: #a29bfe;
      color: #ffffff;
      border: 1px solid #6c5ce7;
      animation: blink 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.5; }
    }

    .token-label {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .button-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  `;

  override firstUpdated() {
    const editorElement = this.shadowRoot?.getElementById('editor');
    if (editorElement) {
      this.editorView = new EditorView({
        state: EditorState.create({
          doc: this.markdownContent,
          extensions: [
            basicSetup,
            markdown(),
            keymap.of(defaultKeymap),
            EditorView.updateListener.of(update => {
              if (update.docChanged) {
                this.markdownContent = update.state.doc.toString();
                this.isContentChanged = this.markdownContent !== this.lastCalculatedContent;
                // Remove requestUpdate() to prevent infinite render loop
                this.dispatchEvent(new CustomEvent('markdown-updated', { detail: { markdown: this.markdownContent } }));
                
                // Emit token status change event
                this.dispatchEvent(new CustomEvent('token-status-changed', { 
                  detail: { 
                    stale: this.isContentChanged 
                  } 
                }));
              }
            }),
          ],
        }),
        parent: editorElement,
      });
    }
    
    // Calculate initial token count if content exists
    if (this.markdownContent && this.markdownContent.trim()) {
      this.calculateTokenCount();
    }
  }

  private handleMarkdownBlur() {
    this.dispatchEvent(new CustomEvent('markdown-update', { detail: { markdown: this.markdownContent } }));
  }

  private calculateTokenCount() {
    try {
      // Get content directly from CodeMirror editor state (more reliable)
      const editorContent = this.editorView?.state.doc.toString() || '';
      const propContent = this.markdownContent || '';
      
      // Use editor content if available, fallback to property
      const content = editorContent || propContent;
      
      const parsed = parseMarkdown(content);
      this.tokenCount = countTokens(parsed.content || '');
      
      // Update tracking properties without triggering property observer
      // Don't update markdownContent property here to avoid infinite loop
      this.lastCalculatedContent = content;
      this.isContentChanged = false;
      
      // Emit event about token calculation status
      this.dispatchEvent(new CustomEvent('token-calculated', { 
        detail: { 
          tokenCount: this.tokenCount,
          isContentChanged: false
        } 
      }));
    } catch (error) {
      console.error('Error calculating token count:', error);
      this.tokenCount = 0;
    }
  }

  private renderMarkdown() {
    // Calculate token count when rendering
    this.calculateTokenCount();
    
    const outputElement = this.shadowRoot?.getElementById('output');
    if (outputElement) {
      // Handle undefined/null content for marked.parse
      const content = this.markdownContent || '';
      outputElement.innerHTML = '' + marked.parse(content);
    }
  }

  private getTokenCountStatus(): { count: string; colorClass: string; label: string } {
    if (this.isContentChanged) {
      return { count: '???', colorClass: 'token-changed', label: 'changed' };
    }
    
    const count = this.tokenCount.toString();
    let colorClass = 'token-good';
    let label = 'tokens';
    
    if (this.tokenCount > 500) {
      colorClass = 'token-over-limit';
      label = 'tokens (way over limit!)';
    } else if (this.tokenCount > 300) {
      colorClass = 'token-warning';
      label = 'tokens (over 300 target)';
    } else if (this.tokenCount > 250) {
      colorClass = 'token-approaching';
      label = 'tokens (approaching 300)';
    }
    
    return { count, colorClass, label };
  }

  override render() {
    const tokenStatus = this.getTokenCountStatus();
    
    return html`
      <div class="editor-container" @focusout=${this.handleMarkdownBlur}>
        <div class="markdown-title">Markdown Editor:</div>
        <div id="editor"></div>
        
        <div class="button-container">
          <md-filled-tonal-button @click="${this.renderMarkdown}">
            Preview & Count Tokens
          </md-filled-tonal-button>
          
          <div class="token-display">
            <span class="token-count ${tokenStatus.colorClass}">
              ${tokenStatus.count}
            </span>
            <span class="token-label">${tokenStatus.label}</span>
          </div>
        </div>
        
        <div id="output"></div>
      </div>
    `;
  }
}
