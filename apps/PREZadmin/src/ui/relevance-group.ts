import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import '@material/web/button/filled-button.js';
import './document-metadata.js';

/**
 * Displays a group of documents organized by relevance level.
 * Used in RAG query results to show strong, good, weak, and poor matches.
 */
@customElement('relevance-group')
export class RelevanceGroup extends LitElement {
  @property({ type: String })
  level: string = '';

  @property({ type: String })
  label: string = '';

  @property({ type: Array })
  items: any[] = [];

  static override styles = css`
    :host {
      display: block;
      margin-bottom: 48px;
    }

    .relevance-group {
      border: 2px solid var(--group-color, var(--md-sys-color-primary, #6750a4));
      border-radius: 16px;
      background-color: var(--group-color-light, var(--md-sys-color-primary-container, #eaddff));
      overflow: hidden;
    }

    .relevance-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, var(--group-color, var(--md-sys-color-primary, #6750a4)), color-mix(in srgb, var(--group-color, var(--md-sys-color-primary, #6750a4)) 80%, white));
      padding: 20px 24px;
      color: white;
      font-weight: bold;
    }

    .relevance-group-title {
      font-family: var(--md-sys-typescale-headline-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-headline-small-size, 24px);
      font-weight: var(--md-sys-typescale-headline-small-weight, 600);
      line-height: var(--md-sys-typescale-headline-small-line-height, 32px);
      letter-spacing: var(--md-sys-typescale-headline-small-tracking, 0px);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .relevance-group-count {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: var(--md-sys-typescale-label-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-label-medium-size, 12px);
      font-weight: var(--md-sys-typescale-label-medium-weight, 500);
      backdrop-filter: blur(4px);
    }

    .relevance-group-content {
      padding: 24px;
    }

    .relevance-group.strong {
      --group-color: var(--md-sys-color-primary, #6750a4);
      --group-color-light: var(--md-sys-color-primary-container, #eaddff);
    }

    .relevance-group.good {
      --group-color: var(--md-sys-color-secondary, #625b71);
      --group-color-light: var(--md-sys-color-secondary-container, #e8def8);
    }

    .relevance-group.weak {
      --group-color: var(--md-sys-color-tertiary, #7d5260);
      --group-color-light: var(--md-sys-color-tertiary-container, #ffd8e4);
    }

    .relevance-group.poor {
      --group-color: var(--md-sys-color-outline, #79747e);
      --group-color-light: var(--md-sys-color-surface-container, #f3edf7);
    }

    .context-item {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .context-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .context-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .context-score {
      font-family: var(--md-sys-typescale-label-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-label-small-size, 11px);
      font-weight: var(--md-sys-typescale-label-small-weight, 500);
      line-height: var(--md-sys-typescale-label-small-line-height, 16px);
      letter-spacing: var(--md-sys-typescale-label-small-tracking, 0.5px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 8px;
    }

    .edit-button {
      --md-filled-button-container-color: var(--md-sys-color-tertiary, #7d5260);
      --md-filled-button-label-text-color: var(--md-sys-color-on-tertiary, #ffffff);
    }

    .markdown-content {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-align: left !important;
    }

    .markdown-content * {
      text-align: left !important;
    }

    .markdown-content h1, .markdown-content h2, .markdown-content h3, 
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-align: left !important;
    }

    .markdown-content p {
      margin-bottom: 16px;
      text-align: left !important;
    }

    .markdown-content pre {
      background-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
    }

    .markdown-content code {
      background-color: var(--md-sys-color-surface-container-high, #ece6f0);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    .markdown-content blockquote {
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
      margin: 16px 0;
      padding: 8px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      font-style: italic;
    }

    .markdown-content ul, .markdown-content ol {
      margin-left: 24px;
      margin-bottom: 16px;
    }

    .markdown-content li {
      margin-bottom: 8px;
    }
  `;

  private handleEditDocument(item: any) {
    // Dispatch custom event for parent to handle
    this.dispatchEvent(new CustomEvent('edit-document', {
      detail: { item },
      bubbles: true
    }));
  }

  private renderMarkdown(markdownText: string) {
    try {
      const htmlContent = marked.parse(markdownText, { async: false }) as string;
      return html`<div class="markdown-content">${unsafeHTML(htmlContent)}</div>`;
    } catch (error) {
      return html`<div class="markdown-content">${markdownText}</div>`;
    }
  }

  override render() {
    if (!this.items || this.items.length === 0) {
      return html``;
    }

    return html`
      <div class="relevance-group ${this.level}">
        <div class="relevance-group-header">
          <div class="relevance-group-title">${this.label}</div>
          <div class="relevance-group-count">${this.items.length} document${this.items.length === 1 ? '' : 's'}</div>
        </div>
        <div class="relevance-group-content">
          ${this.items.map((item) => html`
            <div class="context-item">
              <div class="context-header">
                <div class="context-score">
                  Distance: ${item.distance?.toFixed(4) || 'N/A'} | 
                  Relevance: ${item.distance ? (1 - item.distance).toFixed(3) : 'N/A'}
                </div>
                <md-filled-button 
                  class="edit-button"
                  @click=${() => this.handleEditDocument(item)}>
                  Edit Document
                </md-filled-button>
              </div>
              <document-metadata .metadata=${item.metadata || {}}></document-metadata>
              ${this.renderMarkdown(item.document || item.text || 'No content')}
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'relevance-group': RelevanceGroup;
  }
}