import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';

/**
 * Component for creating new documents with title input, filename generation, and validation.
 * Handles the complete workflow from initial title to ready-to-edit state.
 */
@customElement('new-document-creator')
export class NewDocumentCreator extends LitElement {
  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: String })
  initialTitle: string = '';

  @state() private showTitleInput = false;
  @state() private documentTitle = '';
  @state() private documentFilename = '';
  @state() private statusMessage = '';
  @state() private statusType: 'info' | 'success' | 'error' = 'info';

  static override styles = css`
    :host {
      display: block;
    }

    .new-document-section {
      text-align: center;
      padding: 40px 20px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      margin-bottom: 24px;
    }

    .new-document-section h3 {
      margin: 0 0 16px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
    }

    .title-input-section {
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      text-align: center;
    }

    .title-prompt {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-large-size, 16px);
      font-weight: var(--md-sys-typescale-body-large-weight, 400);
      line-height: var(--md-sys-typescale-body-large-line-height, 24px);
      margin-bottom: 16px;
    }

    .title-input {
      width: 100%;
      max-width: 400px;
      padding: 16px 20px;
      border: 2px solid var(--md-sys-color-outline, #79747e);
      border-radius: 12px;
      background-color: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-headline-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-headline-small-size, 24px);
      font-weight: var(--md-sys-typescale-headline-small-weight, 400);
      line-height: var(--md-sys-typescale-headline-small-line-height, 32px);
      text-align: center;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      box-sizing: border-box;
      margin-bottom: 16px;
    }

    .title-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 3px var(--md-sys-color-primary-container, #eaddff);
    }

    .title-input::placeholder {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.8;
    }

    .filename-preview {
      margin: 16px 0;
      padding: 12px;
      background-color: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 8px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }

    .filename-preview strong {
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .button-row {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .status-message {
      padding: 12px 16px;
      border-radius: 8px;
      text-align: center;
      margin-top: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
    }

    .status-message.success {
      background-color: var(--md-sys-color-primary-container, #e8f5e8);
      color: var(--md-sys-color-on-primary-container, #0d5016);
      border: 1px solid var(--md-sys-color-primary, #4caf50);
    }

    .status-message.error {
      background-color: var(--md-sys-color-error-container, #fdeaea);
      color: var(--md-sys-color-on-error-container, #b71c1c);
      border: 1px solid var(--md-sys-color-error, #f44336);
    }

    .status-message.info {
      background-color: var(--md-sys-color-primary-container, #e3f2fd);
      color: var(--md-sys-color-on-primary-container, #0d47a1);
      border: 1px solid var(--md-sys-color-primary, #2196f3);
    }

    .description {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      text-align: center;
      margin-bottom: 16px;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    if (this.initialTitle) {
      this.documentTitle = this.initialTitle;
      this.generateFilename();
    }
  }

  private handleStartNewDocument() {
    this.showTitleInput = true;
    this.showStatus('Enter a title to get started with your new document.', 'info');
    
    this.dispatchEvent(new CustomEvent('creation-started', {
      bubbles: true
    }));
  }

  private handleTitleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.documentTitle = input.value;
    this.generateFilename();
  }

  private generateFilename() {
    if (!this.documentTitle.trim()) {
      this.documentFilename = '';
      return;
    }

    const title = this.documentTitle.trim();
    this.documentFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')    // Remove special chars
      .trim()
      .replace(/\s+/g, '_');          // Spaces to underscores
  }

  private validateTitle(): { isValid: boolean; error?: string } {
    if (!this.documentTitle.trim()) {
      return { isValid: false, error: 'Title cannot be empty' };
    }

    if (this.documentTitle.trim().length < 3) {
      return { isValid: false, error: 'Title must be at least 3 characters long' };
    }

    return { isValid: true };
  }

  private validateFilename(): { isValid: boolean; error?: string } {
    if (!this.documentFilename.trim()) {
      return { isValid: false, error: 'Filename cannot be empty' };
    }

    if (this.documentFilename.length < 3) {
      return { isValid: false, error: 'Filename must be at least 3 characters long' };
    }

    if (!/^[a-z0-9_]+$/.test(this.documentFilename)) {
      return { isValid: false, error: 'Filename can only contain lowercase letters, numbers, and underscores' };
    }

    if (this.documentFilename.startsWith('_') || this.documentFilename.endsWith('_')) {
      return { isValid: false, error: 'Filename cannot start or end with underscores' };
    }

    return { isValid: true };
  }

  private handleContinue() {
    const titleValidation = this.validateTitle();
    if (!titleValidation.isValid) {
      this.showStatus(titleValidation.error!, 'error');
      return;
    }

    const filenameValidation = this.validateFilename();
    if (!filenameValidation.isValid) {
      this.showStatus(filenameValidation.error!, 'error');
      return;
    }

    this.showStatus('Document ready for editing!', 'success');

    // Dispatch event with document creation data
    this.dispatchEvent(new CustomEvent('document-created', {
      detail: {
        title: this.documentTitle.trim(),
        filename: this.documentFilename
      },
      bubbles: true
    }));
  }

  private handleCancel() {
    this.showTitleInput = false;
    this.documentTitle = '';
    this.documentFilename = '';
    this.statusMessage = '';
    
    this.dispatchEvent(new CustomEvent('creation-cancelled', {
      bubbles: true
    }));
  }

  private showStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.statusMessage = message;
    this.statusType = type;
  }

  override render() {
    if (this.showTitleInput) {
      return html`
        <div class="title-input-section">
          <div class="title-prompt">
            What would you like to call your new document?
          </div>
          <input 
            type="text" 
            class="title-input"
            .value=${this.documentTitle}
            @input=${this.handleTitleChange}
            placeholder="Enter document title..."
            ?disabled=${this.disabled}
            title="This will become the H1 heading, filename, and metadata title">

          ${this.documentFilename ? html`
            <div class="filename-preview">
              <strong>Filename:</strong> ${this.documentFilename}.md
            </div>
          ` : ''}

          <div class="button-row">
            <md-filled-button 
              @click=${this.handleContinue}
              ?disabled=${this.disabled || !this.documentTitle.trim()}>
              Continue with "${this.documentTitle}"
            </md-filled-button>
            <md-filled-button 
              @click=${this.handleCancel}
              ?disabled=${this.disabled}>
              Cancel
            </md-filled-button>
          </div>

          ${this.statusMessage ? html`
            <div class="status-message ${this.statusType}">
              ${this.statusMessage}
            </div>
          ` : ''}
        </div>
      `;
    }

    return html`
      <div class="new-document-section">
        <h3>Create New Document</h3>
        <div class="description">
          Start a new document with proper metadata and structured content.
        </div>
        <md-filled-button 
          @click=${this.handleStartNewDocument}
          ?disabled=${this.disabled}>
          New Document
        </md-filled-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'new-document-creator': NewDocumentCreator;
  }
}