import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';
import { loadAllRAGFilesAsync } from '../stores/chroma-rag';

/**
 * Component for bulk loading RAG files from a directory.
 * Handles the complete workflow for processing all markdown files with options.
 */
@customElement('bulk-rag-loader')
export class BulkRagLoader extends LitElement {
  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: String })
  ragDirectory: string = '';

  @state() private isLoading = false;
  @state() private showVerboseOutput = false;
  @state() private verboseMessages: Array<{type: string, text: string}> = [];
  @state() private statusMessage = '';
  @state() private statusType: 'info' | 'success' | 'error' = 'info';

  static override styles = css`
    :host {
      display: block;
    }

    .storage-option {
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
    }

    .storage-option h4 {
      margin: 0 0 12px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
    }

    .option-description {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      margin-bottom: 16px;
    }

    .bulk-loader-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .file-status {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .verbose-output {
      background-color: var(--md-sys-color-surface-container, #f3edf7);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .verbose-output h5 {
      margin: 0 0 12px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-small-size, 14px);
      font-weight: var(--md-sys-typescale-title-small-weight, 500);
    }

    .verbose-log {
      max-height: 300px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      background-color: var(--md-sys-color-surface, #fffbfe);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 12px;
    }

    .verbose-line {
      margin-bottom: 4px;
    }

    .verbose-line.info {
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .verbose-line.success {
      color: var(--md-sys-color-primary, #6750a4);
    }

    .verbose-line.error {
      color: var(--md-sys-color-error, #ba1a1a);
    }

    .processing-options {
      background-color: var(--md-sys-color-surface, #fffbfe);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      padding: 16px;
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .option-row:last-child {
      margin-bottom: 0;
    }

    .option-row input[type="checkbox"] {
      margin: 0;
    }

    .option-row label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
    }

    .status-message {
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      margin-top: 16px;
      min-height: 20px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      letter-spacing: var(--md-sys-typescale-body-medium-tracking, 0.25px);
    }

    .status-message.success {
      background-color: var(--md-sys-color-tertiary-container, #d4edda);
      color: var(--md-sys-color-on-tertiary-container, #155724);
      border: 1px solid var(--md-sys-color-tertiary, #4caf50);
    }

    .status-message.error {
      background-color: var(--md-sys-color-error-container, #fce4ec);
      color: var(--md-sys-color-on-error-container, #b71c1c);
      border: 1px solid var(--md-sys-color-error, #f44336);
    }

    .status-message.info {
      background-color: var(--md-sys-color-primary-container, #e3f2fd);
      color: var(--md-sys-color-on-primary-container, #0d47a1);
      border: 1px solid var(--md-sys-color-primary, #2196f3);
    }
  `;

  private async loadAllRagFiles() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.statusMessage = 'Loading RAG files...';
    this.statusType = 'info';
    this.verboseMessages = [];

    const resetCollectionCheckbox = this.shadowRoot?.querySelector('#resetCollectionOption') as HTMLInputElement;
    const verboseCheckbox = this.shadowRoot?.querySelector('#verboseOption') as HTMLInputElement;

    const resetCollection = resetCollectionCheckbox?.checked || false;
    const verbose = verboseCheckbox?.checked || false;

    this.showVerboseOutput = verbose;

    try {
      const loadOperation = loadAllRAGFilesAsync({
        resetCollection,
        verbose
      });

      if (verbose) {
        // Poll for updates if verbose mode is enabled - simplified approach
        const pollInterval = setInterval(() => {
          this.requestUpdate();
        }, 500);
        
        // Clear polling when operation completes
        loadOperation.complete.then(() => {
          clearInterval(pollInterval);
        });
      }

      await loadOperation.complete;
      const result = loadOperation.value;

      if (result && result.success) {
        this.statusMessage = `Successfully loaded RAG files! ${result.data?.message || ''}`;
        this.statusType = 'success';
        
        this.dispatchEvent(new CustomEvent('files-loaded', {
          detail: { result },
          bubbles: true
        }));
      } else {
        throw new Error(result?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error loading RAG files:', error);
      this.statusMessage = `Error loading RAG files: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.statusType = 'error';
      
      this.dispatchEvent(new CustomEvent('load-error', {
        detail: { error },
        bubbles: true
      }));
    } finally {
      this.isLoading = false;
    }
  }

  override render() {
    return html`
      <div class="storage-option">
        <h4>Load All RAG Files:</h4>
        <p class="option-description">Process all markdown files from the configured RAG directory (${this.ragDirectory || 'DEFAULT_MARKDOWN_SOURCE_DIR'})</p>
        
        <div class="bulk-loader-container">
          <md-filled-button 
            @click=${this.loadAllRagFiles}
            ?disabled=${this.disabled || this.isLoading}>
            ${this.isLoading ? 'Loading...' : 'Load All RAG Files'}
          </md-filled-button>
          <span class="file-status"></span>
        </div>

        <!-- Verbose Output Area -->
        ${this.showVerboseOutput ? html`
          <div class="verbose-output">
            <h5>Processing Details:</h5>
            <div class="verbose-log">
              ${this.verboseMessages.map(msg => html`<div class="verbose-line ${msg.type}">${msg.text}</div>`)}
            </div>
          </div>
        ` : ''}

        <!-- Processing Options -->
        <div class="processing-options">
          <div class="option-row">
            <input 
              type="checkbox" 
              id="resetCollectionOption"
              ?disabled=${this.disabled || this.isLoading}>
            <label for="resetCollectionOption">Reset collection (--reset-collection)</label>
          </div>
          
          <div class="option-row">
            <input 
              type="checkbox" 
              id="verboseOption"
              ?disabled=${this.disabled || this.isLoading}>
            <label for="verboseOption">Verbose output (--verbose)</label>
          </div>
        </div>

        ${this.statusMessage ? html`
          <div class="status-message ${this.statusType}">${this.statusMessage}</div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bulk-rag-loader': BulkRagLoader;
  }
}