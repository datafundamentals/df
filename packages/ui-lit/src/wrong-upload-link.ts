import {SignalWatcher} from '@lit-labs/signals';
import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {
  setUploadMode,
  setLinkUrl,
  setUploadFile,
  uploadLinkState,
} from '@df/state';
import type {UploadMode, UploadLinkChangeEvent} from '@df/types';

@customElement('wrong-upload-link')
export class WrongUploadLink extends SignalWatcher(LitElement) {
  @property({type: String}) declare variant: 'compact' | 'full';
  @property({type: String}) declare label: string;

  constructor() {
    super();
    this.variant = 'full';
    this.label = 'Wrong Upload Link';
  }

  static override styles = css`
    :host {
      display: block;
      font-family: var(--df-font-family, 'Roboto', sans-serif);
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border: 1px solid var(--df-upload-outline-color, #c6c6c6);
      border-radius: 12px;
      background: var(--df-upload-surface-color, #ffffff);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
      color: var(--df-upload-text-color, #1f1f1f);
    }

    .mode-selector {
      display: inline-flex;
      border: 1px solid var(--df-upload-outline-color, #c6c6c6);
      border-radius: 9999px;
      overflow: hidden;
      background: var(--df-upload-surface-color, #ffffff);
    }

    .mode-button {
      border: none;
      background: transparent;
      padding: 8px 16px;
      font: inherit;
      cursor: pointer;
      color: var(--df-upload-text-color, #1f1f1f);
      transition: background-color 120ms ease, color 120ms ease;
      white-space: nowrap;
    }

    .mode-button:not(:last-of-type) {
      border-right: 1px solid var(--df-upload-outline-color, #c6c6c6);
    }

    .mode-button[aria-pressed='true'] {
      background: var(--df-upload-primary-color, #1d4ed8);
      color: var(--df-upload-surface-color, #ffffff);
    }

    .mode-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .file-upload {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      background-color: var(--df-upload-primary-color, #1d4ed8);
      color: var(--df-upload-surface-color, #ffffff);
      border: none;
      transition: opacity 120ms ease;
    }

    .file-label:hover {
      opacity: 0.9;
    }

    .file-input {
      display: none;
    }

    .url-input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--df-upload-outline-color, #c6c6c6);
      border-radius: 8px;
      font: inherit;
      color: var(--df-upload-text-color, #1f1f1f);
      background: var(--df-upload-surface-color, #ffffff);
    }

    .url-input:focus {
      outline: 2px solid var(--df-upload-primary-color, #1d4ed8);
      outline-offset: -1px;
      border-color: var(--df-upload-primary-color, #1d4ed8);
    }

    .preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--df-upload-outline-color, #c6c6c6);
      border-radius: 8px;
      background: var(--df-upload-surface-color, #ffffff);
    }

    .thumbnail {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
      background: var(--df-upload-outline-color, #c6c6c6);
    }

    .preview-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .preview-url {
      font-size: 12px;
      color: var(--df-upload-disabled-color, #9ca3af);
      word-break: break-all;
    }

    .preview-status {
      font-size: 14px;
      font-weight: 500;
    }

    .preview-status.valid {
      color: #059669;
    }

    .preview-status.invalid {
      color: #dc2626;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: var(--df-upload-outline-color, #c6c6c6);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--df-upload-primary-color, #1d4ed8);
      transition: width 120ms ease;
    }

    .compact .container {
      padding: 8px;
      gap: 8px;
    }

    .compact .header {
      font-size: 12px;
    }

    .compact .mode-button {
      padding: 6px 12px;
      font-size: 12px;
    }

    .add-button {
      align-self: flex-start;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--df-upload-primary-color, #1d4ed8);
      background: var(--df-upload-surface-color, #ffffff);
      color: var(--df-upload-primary-color, #1d4ed8);
      cursor: pointer;
      font: inherit;
      transition: background-color 120ms ease;
    }

    .add-button:hover {
      background: var(--df-upload-primary-color, #1d4ed8);
      color: var(--df-upload-surface-color, #ffffff);
    }

    .add-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  private handleModeChange(mode: UploadMode) {
    setUploadMode(mode);
    this.dispatchChangeEvent();
  }

  private handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    setUploadFile(file);

    if (file) {
      const mockUploadUrl = `https://example.com/uploads/${file.name}`;
      setLinkUrl(mockUploadUrl);
    }

    this.dispatchChangeEvent();
  }

  private handleUrlChange(event: Event) {
    const input = event.target as HTMLInputElement;
    setLinkUrl(input.value);
    this.dispatchChangeEvent();
  }

  private handleAdd() {
    const state = uploadLinkState.get();

    this.dispatchEvent(
      new CustomEvent('wrong-upload-link-add', {
        detail: {
          mode: state.mode,
          linkUrl: state.linkUrl,
          isValid: state.isValid,
        },
        bubbles: true,
        composed: true,
      })
    );

    setUploadMode('none');
  }

  private dispatchChangeEvent() {
    const state = uploadLinkState.get();

    this.dispatchEvent(
      new CustomEvent<UploadLinkChangeEvent>('wrong-upload-link-change', {
        detail: {
          mode: state.mode,
          linkUrl: state.linkUrl,
          isValid: state.isValid,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const state = uploadLinkState.get();
    const {mode, linkUrl, fileName, isUploading, uploadProgress, isValid} = state;

    return html`
      <div class="container ${this.variant}">
        <div class="header">
          <span>${this.label}:</span>
          <div class="mode-selector" role="group" aria-label="Upload mode selection">
            <button
              type="button"
              class="mode-button"
              aria-pressed=${String(mode === 'none')}
              @click=${() => this.handleModeChange('none')}
            >
              None
            </button>
            <button
              type="button"
              class="mode-button"
              aria-pressed=${String(mode === 'upload')}
              @click=${() => this.handleModeChange('upload')}
            >
              Upload
            </button>
            <button
              type="button"
              class="mode-button"
              aria-pressed=${String(mode === 'url')}
              @click=${() => this.handleModeChange('url')}
            >
              URL
            </button>
          </div>
        </div>

        ${mode !== 'none' ? html`
          <div class="content">
            ${mode === 'upload' ? html`
              <div class="file-upload">
                <label class="file-label">
                  ${fileName}
                  <input
                    type="file"
                    class="file-input"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    @change=${this.handleFileChange}
                  />
                </label>
              </div>

              ${isUploading ? html`
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    style="width: ${uploadProgress}%"
                  ></div>
                </div>
              ` : ''}
            ` : ''}

            ${mode === 'url' ? html`
              <input
                type="url"
                class="url-input"
                placeholder="Enter URL..."
                .value=${linkUrl}
                @input=${this.handleUrlChange}
              />
            ` : ''}

            ${linkUrl && (mode === 'upload' || mode === 'url') ? html`
              <div class="preview">
                ${state.mediaType === 'image' ? html`
                  <img
                    class="thumbnail"
                    src=${linkUrl}
                    alt="Preview"
                    @error=${() => {}}
                  />
                ` : html`
                  <div class="thumbnail"></div>
                `}
                <div class="preview-info">
                  <div class="preview-status ${isValid ? 'valid' : 'invalid'}">
                    ${isValid ? 'Valid link' : 'Invalid link'}
                  </div>
                  <div class="preview-url">${linkUrl}</div>
                </div>
              </div>

              ${isValid ? html`
                <button
                  type="button"
                  class="add-button"
                  @click=${this.handleAdd}
                >
                  Add Link
                </button>
              ` : ''}
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wrong-upload-link': WrongUploadLink;
  }
}