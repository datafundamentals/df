import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './bulk-rag-loader.js';
import './rag-app-header.js';
import { SignalWatcher } from '@lit-labs/signals';
import { isLoggedIn } from '../stores/auth';

@customElement('rag-document-storage')
export class RagDocumentStorage extends SignalWatcher(LitElement) {
  @state() statusMessage = '';
  @state() statusType: 'info' | 'success' | 'error' = 'info';
  @state() isLoading = false;
  @state() ragDirectory = '';

  static override styles = css`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }


    .mode-section {
      display: none;
    }

    .mode-section.active {
      display: block;
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

  private showStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.statusMessage = message;
    this.statusType = type;
  }


  private handleFilesLoaded(event: CustomEvent) {
    const { result } = event.detail;
    this.ragDirectory = result.directory || this.ragDirectory;
    this.showStatus(`Successfully processed ${result.filesProcessed || 0} RAG files!`, 'success');
  }

  private handleLoadError(event: CustomEvent) {
    const { error } = event.detail;
    this.showStatus(`Error loading files: ${error.message}`, 'error');
  }

  override render() {
    return html`
      <rag-app-header
        title="Approach"
        subtitle="Document Storage"
        activePage="storage">
      </rag-app-header>

      ${isLoggedIn.get() ? html`
        <!-- RAG Interface Content -->

      <!-- Document Storage Mode -->
      <div class="mode-section active">
        <p>Save documents as embeddings in ChromaDB:</p>

        <bulk-rag-loader
          .disabled=${this.isLoading}
          .ragDirectory=${this.ragDirectory}
          @files-loaded=${this.handleFilesLoaded}
          @load-error=${this.handleLoadError}>
        </bulk-rag-loader>

        ${this.statusMessage ? html`
          <div class="status-message ${this.statusType}">${this.statusMessage}</div>
        ` : ''}
      </div>

      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rag-document-storage': RagDocumentStorage;
  }
}