import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Component for displaying and searching through a list of documents.
 * Provides search functionality and click-to-select behavior.
 */
@customElement('document-list')
export class DocumentList extends LitElement {
  @property({ type: Array })
  documents: any[] = [];

  @property({ type: Boolean })
  disabled: boolean = false;

  @state() private searchTerm = '';

  static override styles = css`
    :host {
      display: block;
    }

    .document-list {
      margin-bottom: 30px;
    }

    .document-list h3 {
      margin: 0 0 16px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-large-size, 22px);
      font-weight: var(--md-sys-typescale-title-large-weight, 500);
    }

    .search-box {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .document-list-container {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      max-height: 400px;
      overflow-y: auto;
    }

    .document-item {
      padding: 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .document-item:hover {
      background-color: #f8f9fa;
    }

    .document-item:last-child {
      border-bottom: none;
    }

    .document-title {
      font-weight: bold;
      margin-bottom: 5px;
      color: #333;
    }

    .document-meta {
      font-size: 12px;
      color: #666;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .editor-placeholder {
      text-align: center;
      padding: 40px 20px;
      color: #666;
      font-style: italic;
    }

    .editor-placeholder p {
      margin-bottom: 16px;
    }

    .editor-placeholder a {
      color: var(--md-sys-color-primary, #6750a4);
      text-decoration: none;
    }

    .editor-placeholder a:hover {
      text-decoration: underline;
    }
  `;

  private handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.requestUpdate();
  }

  private handleDocumentClick(document: any) {
    this.dispatchEvent(new CustomEvent('document-selected', {
      detail: { document },
      bubbles: true
    }));
  }

  private get filteredDocuments() {
    if (!this.searchTerm) return this.documents;
    
    return this.documents.filter(doc => 
      !this.searchTerm || 
      (doc.id?.toLowerCase().includes(this.searchTerm) ||
       doc.metadata?.title?.toLowerCase().includes(this.searchTerm) ||
       doc.metadata?.tags?.toLowerCase().includes(this.searchTerm))
    );
  }

  override render() {
    return html`
      <div class="document-list">
        <h3>Select a Document to Edit</h3>
        ${this.documents.length > 0 ? html`
          <input 
            type="text" 
            class="search-box"
            placeholder="Search documents by title, ID, or tags..."
            @input=${this.handleSearch}
            ?disabled=${this.disabled}>
          
          <div class="document-list-container">
            ${this.filteredDocuments.map(doc => html`
              <div class="document-item" @click=${() => this.handleDocumentClick(doc)}>
                <div class="document-title">
                  ${doc.metadata?.title || doc.id}
                </div>
                <div class="document-meta">
                  <span>ID: ${doc.id}</span>
                  <span>${doc.metadata?.tags ? `Tags: ${doc.metadata.tags}` : ''}</span>
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="editor-placeholder">
            <p>No documents found in your RAG system.</p>
            <p><a href="rag-storage.html">Create your first document</a> or <a href="rag-query.html">query existing documents</a> to edit them.</p>
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'document-list': DocumentList;
  }
}