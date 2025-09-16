import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Displays document metadata in a consistent, styled format.
 * Used across RAG components for showing document information.
 */
@customElement('document-metadata')
export class DocumentMetadata extends LitElement {
  @property({ type: Object })
  metadata: Record<string, any> = {};

  @property({ type: Boolean })
  compact: boolean = false;

  static override styles = css`
    :host {
      display: block;
    }

    .context-metadata {
      background-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    .context-metadata.compact {
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    .metadata-item {
      margin-bottom: 8px;
      display: flex;
      gap: 12px;
      align-items: baseline;
    }

    .metadata-item:last-child {
      margin-bottom: 0;
    }

    .metadata-label {
      font-family: var(--md-sys-typescale-label-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-label-medium-size, 12px);
      font-weight: var(--md-sys-typescale-label-medium-weight, 500);
      line-height: var(--md-sys-typescale-label-medium-line-height, 16px);
      letter-spacing: var(--md-sys-typescale-label-medium-tracking, 0.5px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      min-width: 80px;
      flex-shrink: 0;
    }

    .metadata-value {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      letter-spacing: var(--md-sys-typescale-body-medium-tracking, 0.25px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      word-break: break-word;
    }
  `;

  private renderMetadataItem(label: string, value: string | undefined) {
    if (!value) return '';
    
    return html`
      <div class="metadata-item">
        <span class="metadata-label">${label}:</span>
        <span class="metadata-value">${value}</span>
      </div>
    `;
  }

  override render() {
    // Don't render if no metadata or empty metadata
    if (!this.metadata || Object.keys(this.metadata).length === 0) {
      return html``;
    }

    return html`
      <div class="context-metadata ${this.compact ? 'compact' : ''}">
        ${this.renderMetadataItem('Title', this.metadata.title)}
        ${this.renderMetadataItem('Category', this.metadata.category)}
        ${this.renderMetadataItem('Tags', this.metadata.tags)}
        ${this.renderMetadataItem('Is a', this.metadata.is_a)}
        ${this.renderMetadataItem('Child of', this.metadata.child_of)}
        ${this.renderMetadataItem('Has a', this.metadata.has_a)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'document-metadata': DocumentMetadata;
  }
}