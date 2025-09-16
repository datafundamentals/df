import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';
import './awr-markdown-codemirror.js';
import './tag-typeahead-input.js';
import './new-document-creator.js';
import './document-list.js';
import './rag-app-header.js';
import { parseMarkdown, countTokens } from '../services/file-processing.js';
import { SignalWatcher } from '@lit-labs/signals';
import { isLoggedIn } from '../stores/auth';
import { saveAllMetadataTags } from '../stores/tags';
import { saveCategory, normalizeCategory } from '../stores/categories';
import { updateDocumentAsync, getDocumentByIdAsync, loadAllRAGFilesAsync } from '../stores/chroma-rag';

@customElement('rag-document-editor')
export class RagDocumentEditor extends SignalWatcher(LitElement) {
  @state() statusMessage = '';
  @state() statusType: 'info' | 'success' | 'error' = 'info';
  @state() isLoading = false;
  @state() editingDocument: any = null;
  @state() documentContent = '';
  @state() isTokenCalculationStale = false;
  @state() originalDocumentContent = '';
  @state() editingTags = '';
  @state() editingCategory = '';
  @state() editingIsA = '';
  @state() editingChildOf = '';
  @state() editingHasA = '';
  @state() allDocuments: any[] = [];
  @state() showDocumentList = true;
  @state() isCreatingNew = false;
  @state() newDocumentTitle = '';
  @state() newDocumentFilename = '';

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



    .button-container {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 20px 0;
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


    .document-editor-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      background-color: #fafafa;
    }

    .document-info h4 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .document-info p {
      margin: 5px 0;
      color: #666;
      text-align: left;
    }

    .metadata-editor {
      margin: 20px 0;
      padding: 15px;
      background-color: white;
      border: 1px solid #e9ecef;
      border-radius: 6px;
    }

    .metadata-label {
      display: block;
      font-weight: 500;
      margin: 15px 0 5px 0;
    }

    .metadata-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }

    tag-typeahead-input {
      margin-bottom: 15px;
    }


  `;

  override connectedCallback() {
    super.connectedCallback();
    this.checkForDocumentIdInUrl();
  }

  private async checkForDocumentIdInUrl() {
    // First check if document data was POSTed to this page
    const formData = this.getPostedDocumentData();
    if (formData) {
      this.loadDocumentFromPostData(formData);
      return;
    }
    
    // Fallback to URL parameter approach
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('docId');
    if (docId) {
      // Directly load the specific document by ID
      await this.loadDocumentById(docId);
    } else {
      // No specific document requested, load document list for selection
      this.loadDocuments();
    }
  }

  private getPostedDocumentData(): {id: string, document: string, metadata: any} | null {
    // Check if the page was loaded via POST with document data
    // This would typically be available in the request body, but since we're client-side,
    // we need to check if the referrer was a form submission
    
    // For now, let's check if there's POST data in localStorage (we'll set this in the form submission)
    const postData = localStorage.getItem('editorPostData');
    if (postData) {
      localStorage.removeItem('editorPostData'); // Clean up
      try {
        return JSON.parse(postData);
      } catch (error) {
        console.error('Error parsing POST data:', error);
        return null;
      }
    }
    return null;
  }

  private loadDocumentFromPostData(data: {id: string, document: string, metadata: any}) {
    try {
      // Parse metadata if it's a string
      const metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
      
      // Create a document object matching the expected format
      const document = {
        id: data.id,
        content: data.document,
        document: data.document,
        text: data.document,
        metadata: metadata
      };

      // Load the document directly
      this.editDocument(document);
      this.statusMessage = 'Document loaded successfully from POST data!';
      this.statusType = 'success';
    } catch (error) {
      console.error('Error loading document from POST data:', error);
      this.statusMessage = 'Error loading document from POST data';
      this.statusType = 'error';
      // Fall back to document list
      this.loadDocuments();
    }
  }

  private async loadDocumentById(docId: string) {
    try {
      this.statusMessage = 'Loading document...';
      this.statusType = 'info';

      const getDocOperation = getDocumentByIdAsync({ documentId: docId });
      await getDocOperation.complete;
      const result = getDocOperation.value;


      if (result && result.success && result.context && result.context.length > 0) {
        // Find the exact document by ID from the search results
        const document = result.context.find((doc: any) => doc.id === docId || doc.metadata?.id === docId);
        if (document) {
          this.editDocument(document);
          this.statusMessage = 'Document loaded successfully!';
          this.statusType = 'success';
        } else {
          this.statusMessage = `Document with ID "${docId}" not found in search results.`;
          this.statusType = 'error';
          // Fall back to document list view
          this.loadDocuments();
        }
      } else {
        this.statusMessage = `Document with ID "${docId}" not found.`;
        this.statusType = 'error';
        // Fall back to document list view
        this.loadDocuments();
      }
    } catch (error) {
      console.error('Error loading document by ID:', error);
      this.statusMessage = `Error loading document: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.statusType = 'error';
      // Fall back to document list view
      this.loadDocuments();
    }
  }

  private async loadDocuments() {
    try {
      const loadOperation = loadAllRAGFilesAsync({
        resetCollection: false,
        verbose: false
      });
      await loadOperation.complete;
      const result = loadOperation.value;

      if (result && result.success) {
        // Try different possible locations for the documents data
        this.allDocuments = result.data?.files || result.files || result.documents || [];
      } else {
        this.allDocuments = [];
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      this.statusMessage = 'Error loading documents';
      this.statusType = 'error';
      this.allDocuments = [];
    }
  }

  private editDocument(document: any) {
    this.editingDocument = document;
    this.documentContent = document.content || '';
    this.originalDocumentContent = document.content || '';
    this.showDocumentList = false;

    const metadata = document.metadata || {};
    this.editingTags = metadata.tags || '';
    this.editingCategory = metadata.category || '';
    this.editingIsA = metadata.isA || '';
    this.editingChildOf = metadata.childOf || '';
    this.editingHasA = metadata.hasA || '';

    this.statusMessage = '';
  }

  private cancelDocumentEdit() {
    const actionText = this.isCreatingNew ? 'Document creation' : 'Document editing';
    this.editingDocument = null;
    this.documentContent = '';
    this.originalDocumentContent = '';
    this.editingTags = '';
    this.editingCategory = '';
    this.editingIsA = '';
    this.editingChildOf = '';
    this.editingHasA = '';
    this.isCreatingNew = false;
    this.newDocumentTitle = '';
    this.newDocumentFilename = '';
    this.showDocumentList = true;
    this.statusMessage = `${actionText} cancelled.`;
    this.statusType = 'info';
  }

  private returnToDocumentList() {
    // Return to document list without showing "cancelled" message
    this.editingDocument = null;
    this.documentContent = '';
    this.originalDocumentContent = '';
    this.editingTags = '';
    this.editingCategory = '';
    this.editingIsA = '';
    this.editingChildOf = '';
    this.editingHasA = '';
    this.isCreatingNew = false;
    this.newDocumentTitle = '';
    this.newDocumentFilename = '';
    this.showDocumentList = true;
    // Don't change status message - leave the success message visible
  }

  private hasDocumentChanged(): boolean {
    // For new documents, consider any content or metadata as "changed"
    if (this.isCreatingNew) {
      return (this.documentContent || '').trim().length > 0 || 
             (this.editingTags || '').trim().length > 0 ||
             (this.editingCategory || '').trim().length > 0 ||
             (this.editingIsA || '').trim().length > 0 ||
             (this.editingChildOf || '').trim().length > 0 ||
             (this.editingHasA || '').trim().length > 0;
    }

    if (!this.editingDocument) return false;
    
    const contentChanged = this.documentContent !== this.originalDocumentContent;
    const metadataChanged = 
      this.editingTags !== (this.editingDocument.metadata?.tags || '') ||
      this.editingCategory !== (this.editingDocument.metadata?.category || '') ||
      this.editingIsA !== (this.editingDocument.metadata?.isA || '') ||
      this.editingChildOf !== (this.editingDocument.metadata?.childOf || '') ||
      this.editingHasA !== (this.editingDocument.metadata?.hasA || '');
    
    return contentChanged || metadataChanged;
  }

  private async saveDocumentUpdate() {
    // For new documents, we need to create the document object first
    if (this.isCreatingNew && !this.editingDocument) {
      const { generateId } = await import('../services/file-processing.js');
      const newId = generateId();
      
      // Create a temporary document object for new documents
      this.editingDocument = {
        id: newId,
        document: this.documentContent,
        text: this.documentContent,
        metadata: {
          title: this.newDocumentTitle || '', 
          tags: this.editingTags,
          category: this.editingCategory || 'primary',
          isA: this.editingIsA,
          childOf: this.editingChildOf,
          hasA: this.editingHasA,
        }
      };
    }

    if (!this.editingDocument) return;

    this.isLoading = true;
    this.statusMessage = 'Saving document changes...';
    this.statusType = 'info';

    try {
      const parsed = parseMarkdown(this.documentContent);
      const tokenCount = countTokens(this.documentContent);

      const metadata = {
        title: this.editingDocument.metadata?.title || this.editingDocument.id,
        tags: this.editingTags,
        category: this.editingCategory ? normalizeCategory(this.editingCategory) : '',
        isA: this.editingIsA,
        childOf: this.editingChildOf,
        hasA: this.editingHasA,
        tokenCount
      };

      await saveAllMetadataTags([
        this.editingTags,
        this.editingIsA,
        this.editingChildOf,
        this.editingHasA
      ]);

      // Save category to categories collection
      if (this.editingCategory) {
        try {
          await saveCategory(this.editingCategory);
        } catch (error) {
          console.error('Error saving category:', error);
          // Continue with document save even if category save fails
        }
      }

      const updateOperation = updateDocumentAsync({
        isCreatingNew: this.isCreatingNew,
        document: {
          id: this.editingDocument.id,
          text: parsed.content,
          metadata: {
            ...this.editingDocument.metadata,
            ...metadata,
            tokenCount,
          },
        },
        content: this.documentContent,
        filename: this.isCreatingNew ? this.newDocumentFilename : undefined,
      });

      await updateOperation.complete;

      if (updateOperation.value?.success) {
        const actionText = this.isCreatingNew ? 'created' : 'updated';
        this.statusMessage = `Document "${this.editingDocument.id}" ${actionText} successfully!`;
        this.statusType = 'success';
        
        // Reset creation state after successful save
        if (this.isCreatingNew) {
          this.isCreatingNew = false;
          this.newDocumentTitle = '';
          this.newDocumentFilename = '';
        }
        
        this.originalDocumentContent = this.documentContent;
        this.editingDocument.metadata = metadata;
        
        setTimeout(() => {
          this.returnToDocumentList();
          this.loadDocuments();
        }, 2000);
      } else {
        throw new Error(updateOperation.value?.error || 'Failed to update document');
      }

    } catch (error) {
      console.error('Error updating document:', error);
      this.statusMessage = `Error updating document: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.statusType = 'error';
    } finally {
      this.isLoading = false;
    }
  }

  private handleMarkdownUpdate(event: CustomEvent) {
    this.documentContent = event.detail.content;
  }

  private handleTokenCalculated() {
    this.isTokenCalculationStale = false;
  }

  private handleTokenStatusChanged(event: CustomEvent) {
    this.isTokenCalculationStale = event.detail.stale;
  }

  private handleTagsChange(event: CustomEvent) {
    this.editingTags = event.detail.value;
  }

  private handleCategoryChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.editingCategory = input.value;
  }

  private handleIsAChange(event: CustomEvent) {
    this.editingIsA = event.detail.value;
  }

  private handleChildOfChange(event: CustomEvent) {
    this.editingChildOf = event.detail.value;
  }

  private handleHasAChange(event: CustomEvent) {
    this.editingHasA = event.detail.value;
  }

  private handleDocumentCreated(event: CustomEvent) {
    const { title, filename } = event.detail;
    
    // Create a new document with the provided title and filename
    this.isCreatingNew = true;
    this.newDocumentTitle = title;
    this.newDocumentFilename = filename;
    this.showDocumentList = false;
    
    // Set up the editing state
    this.editingDocument = null;
    this.documentContent = `# ${title}\n\n`;
    this.originalDocumentContent = '';
    this.editingTags = '';
    this.editingCategory = '';
    this.editingIsA = '';
    this.editingChildOf = '';
    this.editingHasA = '';
    this.isTokenCalculationStale = true;
    
    this.statusMessage = 'Document ready for editing - start writing your content!';
    this.statusType = 'info';
  }

  private handleCreationCancelled() {
    this.isCreatingNew = false;
    this.newDocumentTitle = '';
    this.newDocumentFilename = '';
    this.showDocumentList = true;
  }


  private handleDocumentSelected(event: CustomEvent) {
    const { document } = event.detail;
    this.editDocument(document);
  }

  override render() {
    return html`
      <rag-app-header
        title="Document Editor"
        subtitle="Edit Documents in Your RAG System"
        activePage="editor">
      </rag-app-header>

      ${isLoggedIn.get() ? html`

      ${this.showDocumentList && !this.editingDocument && !this.isCreatingNew ? html`
        <new-document-creator
          .disabled=${this.isLoading}
          @document-created=${this.handleDocumentCreated}
          @creation-cancelled=${this.handleCreationCancelled}>
        </new-document-creator>
      ` : ''}

      ${this.showDocumentList && !this.isCreatingNew ? html`
        <document-list
          .documents=${this.allDocuments}
          .disabled=${this.isLoading}
          @document-selected=${this.handleDocumentSelected}>
        </document-list>
      ` : ''}

      ${this.editingDocument || this.isCreatingNew ? html`
        <div class="document-editor-container">
          <div class="document-info">
            <h4>
              ${this.isCreatingNew ? `Creating New Document: ${this.newDocumentTitle}` : `Editing Document: ${this.editingDocument.id}`}
              <md-filled-button @click=${this.cancelDocumentEdit}>
                Back to List
              </md-filled-button>
            </h4>
            ${this.editingDocument?.metadata?.title || this.newDocumentTitle ? html`
              <p><strong>Title:</strong> ${this.editingDocument?.metadata?.title || this.newDocumentTitle}</p>
            ` : ''}
            
            <div class="metadata-editor">
              <tag-typeahead-input
                label="Tags"
                collectionType="tags"
                .value=${this.editingTags}
                @change=${this.handleTagsChange}
                placeholder="keyword1, keyword2, keyword3"
                title="Comma-separated tags for organizing and categorizing this document">
              </tag-typeahead-input>
              
              <tag-typeahead-input
                label="Category"
                collectionType="categories"
                .value=${this.editingCategory}
                @change=${this.handleCategoryChange}
                placeholder="primary"
                title="Document category (e.g., primary, secondary, reference)">
              </tag-typeahead-input>
              
              <tag-typeahead-input
                label="Is A"
                collectionType="ontology"
                .value=${this.editingIsA}
                @change=${this.handleIsAChange}
                placeholder="concept1, concept2, concept3"
                title="Comma-separated is-a relationships">
              </tag-typeahead-input>
              
              <tag-typeahead-input
                label="Child Of"
                collectionType="ontology"
                .value=${this.editingChildOf}
                @change=${this.handleChildOfChange}
                placeholder="parent1, parent2"
                title="Comma-separated child-of relationships">
              </tag-typeahead-input>
              
              <tag-typeahead-input
                label="Has A"
                collectionType="ontology"
                .value=${this.editingHasA}
                @change=${this.handleHasAChange}
                placeholder="child1, child2"
                title="Comma-separated has-a relationships">
              </tag-typeahead-input>
            </div>
          </div>
          
          <awr-markdown-codemirror 
            .markdownContent=${this.documentContent}
            @markdown-updated=${this.handleMarkdownUpdate}
            @token-calculated=${this.handleTokenCalculated}
            @token-status-changed=${this.handleTokenStatusChanged}>
          </awr-markdown-codemirror>

          <div class="button-container">
            <md-filled-button 
              @click=${this.saveDocumentUpdate}
              ?disabled=${this.isLoading || this.isTokenCalculationStale || !this.hasDocumentChanged()}>
              ${this.isLoading ? 'Saving...' : 
                this.isTokenCalculationStale ? 'Preview Tokens First' : 
                !this.hasDocumentChanged() ? (this.isCreatingNew ? 'Add Content First' : 'No Changes to Save') : 
                (this.isCreatingNew ? 'Create Document' : 'Save Changes')}
            </md-filled-button>
            <md-filled-button 
              @click=${this.cancelDocumentEdit}
              ?disabled=${this.isLoading}>
              Cancel
            </md-filled-button>
          </div>
        </div>
      ` : ''}


        ${this.statusMessage ? html`
          <div class="status-message ${this.statusType}">${this.statusMessage}</div>
        ` : ''}
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rag-document-editor': RagDocumentEditor;
  }
}