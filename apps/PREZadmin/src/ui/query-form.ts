import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import './context-slider.js';
import './prompt-configuration.js';

/**
 * Query form component for RAG document searching.
 * Handles query input, filtering options, context controls, and submission.
 */
@customElement('query-form')
export class QueryForm extends LitElement {
  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: Boolean })
  loading: boolean = false;

  @property({ type: String })
  queryText: string = '';

  @property({ type: Number })
  contextValue: number = 5;

  @property({ type: Boolean })
  contextOnlyMode: boolean = true;

  @property({ type: String })
  searchMode: 'semantic' | 'ontological' = 'semantic';

  @property({ type: String })
  relationshipType: 'is_a' | 'child_of' | 'has_a' = 'is_a';

  @property({ type: String })
  ontologicalConcept: string = '';

  @state()
  private assembledPrompt: string = '';

  @state()
  private lastQuerySent: string = '';

  @state()
  private currentAssembledQuery: string = '';

  static override styles = css`
    :host {
      display: block;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group md-outlined-text-field {
      width: 100%;
    }

    .query-options {
      background-color: var(--md-sys-color-surface-variant, #f3f0f4);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    .filter-row {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .filter-group {
      flex: 1;
    }

    .filter-group md-outlined-text-field {
      width: 100%;
    }

    .filter-group md-outlined-select {
      width: 100%;
    }

    .search-mode-toggle {
      margin-bottom: 16px;
      padding: 12px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ontological-options {
      margin-top: 16px;
      padding: 16px;
      background-color: var(--md-sys-color-primary-container, #e8def8);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
    }

    .ontological-options.hidden {
      display: none;
    }

    .button-container {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }

    .description {
      margin-bottom: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
    }

    .context-mode-toggle {
      margin-bottom: 16px;
      padding: 12px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toggle-label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      flex: 1;
    }

    .toggle-description {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-left: 4px;
    }

    .actual-query-section {
      margin-top: 16px;
      padding: 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
    }

    .actual-query-label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 500);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 8px;
      display: block;
    }

    .actual-query-box {
      background-color: var(--md-sys-color-surface-container-high, #ece6f0);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      white-space: pre-wrap;
      word-wrap: break-word;
      min-height: 40px;
      max-height: 150px;
      overflow-y: auto;
    }

    .query-empty {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
    }

  `;

  override connectedCallback() {
    super.connectedCallback();
    // Initialize the current assembled query preview after component is ready
    this.updateComplete.then(() => {
      this.updateCurrentAssembledQuery();
    });
  }

  private handleQueryInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.queryText = input.value;
    
    // Clear last query sent to show real-time preview
    this.lastQuerySent = '';
    
    // Update prompt configuration preview with new query
    this.updatePromptConfigurationUserQuery();
    
    // Update real-time assembled query preview
    this.updateCurrentAssembledQuery();
    
    this.dispatchEvent(new CustomEvent('query-changed', {
      detail: { queryText: this.queryText },
      bubbles: true
    }));
  }


  private handleContextValueChanged(event: CustomEvent) {
    this.contextValue = event.detail.value;
    
    this.dispatchEvent(new CustomEvent('context-changed', {
      detail: { contextValue: this.contextValue },
      bubbles: true
    }));
  }

  private handlePromptConfigurationChanged(event: CustomEvent) {
    const { contextOnlyMode, assembledPrompt } = event.detail;
    this.contextOnlyMode = contextOnlyMode;
    this.assembledPrompt = assembledPrompt;
    
    // Clear last query sent to show real-time preview
    this.lastQuerySent = '';
    
    // Update the prompt configuration component with current user query
    this.updatePromptConfigurationUserQuery();
    
    // Update real-time assembled query preview
    this.updateCurrentAssembledQuery();
    
    this.dispatchEvent(new CustomEvent('context-mode-changed', {
      detail: { contextOnlyMode: this.contextOnlyMode },
      bubbles: true
    }));
  }

  private updatePromptConfigurationUserQuery() {
    const promptConfig = this.shadowRoot?.querySelector('prompt-configuration') as any;
    if (promptConfig && 'updateUserQuery' in promptConfig) {
      promptConfig.updateUserQuery(this.queryText);
    }
  }

  private updateCurrentAssembledQuery() {
    // Update the current assembled query for real-time preview
    const newQuery = this.assembleFinalQuery();
    this.currentAssembledQuery = newQuery;
  }

  private handleSearchModeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchMode = input.checked ? 'ontological' : 'semantic';
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('search-mode-changed', {
      detail: { searchMode: this.searchMode },
      bubbles: true
    }));
  }

  private handleRelationshipTypeChange(event: Event) {
    const select = event.target as any;
    this.relationshipType = select.value as 'is_a' | 'child_of' | 'has_a';
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('relationship-type-changed', {
      detail: { relationshipType: this.relationshipType },
      bubbles: true
    }));
  }

  private handleOntologicalConceptInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.ontologicalConcept = input.value;
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('ontological-concept-changed', {
      detail: { ontologicalConcept: this.ontologicalConcept },
      bubbles: true
    }));
  }

  private handleSubmit() {
    if (!this.queryText.trim()) {
      return;
    }

    // Assemble final query with prompt fragments inserted between context mode and user query
    const finalQuery = this.assembleFinalQuery();
    
    // Store the exact query being sent for transparency
    this.lastQuerySent = finalQuery;

    this.dispatchEvent(new CustomEvent('query-submit', {
      detail: {
        queryText: finalQuery,
        originalQueryText: this.queryText,
        contextValue: this.contextValue,
        contextOnlyMode: this.contextOnlyMode,
        searchMode: this.searchMode,
        relationshipType: this.relationshipType,
        ontologicalConcept: this.ontologicalConcept
      },
      bubbles: true
    }));
  }

  private assembleFinalQuery(): string {
    // Build context instruction part
    const contextInstruction = this.contextOnlyMode 
      ? `You must answer the user's question using ONLY the information provided in the context documents below. Do not use any external knowledge. If the context contains relevant information, use it to answer the question directly and completely.

Context Documents:
[Retrieved documents will be inserted here by the server]`
      : `Please answer the user's question using the provided context documents as your primary source, but you may also use your general knowledge to provide a comprehensive answer.

Context Documents:
[Retrieved documents will be inserted here by the server]`;
    
    // Build the final parts with proper structure
    const finalParts = [contextInstruction];
    
    // Add prompt modifiers (without "Question:" prefix)
    const modifiers = this.assembledPrompt.trim();
    if (modifiers) {
      finalParts.push(modifiers);
    }
    
    // Add user question with "Question:" prefix
    const userQuery = this.queryText.trim();
    if (userQuery) {
      finalParts.push(`Question: ${userQuery}`);
    } else {
      finalParts.push('Question: [Your question will appear here]');
    }
    
    return finalParts.join('\n\n');
  }

  private handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  override render() {
    return html`
      <div class="description">
        Ask questions about your stored documents:
      </div>

      <prompt-configuration
        .contextOnlyMode=${this.contextOnlyMode}
        .userQuery=${this.queryText}
        @configuration-changed=${this.handlePromptConfigurationChanged}>
      </prompt-configuration>
      
      <div class="form-group">
        <md-outlined-text-field 
          label="Ask a question about your documents..." 
          type="textarea"
          rows="3"
          .value=${this.queryText}
          ?disabled=${this.disabled}
          @input=${this.handleQueryInput}
          @keypress=${this.handleKeyPress}>
        </md-outlined-text-field>
      </div>

      <div class="actual-query-section">
        <label class="actual-query-label">
          ${this.lastQuerySent ? 'Query Sent to AI Model:' : 'Query Preview (will be sent to AI):'}
        </label>
        <div class="actual-query-box">
          ${this.lastQuerySent || this.currentAssembledQuery || html`<span class="query-empty">Your assembled query will appear here as you type...</span>`}
        </div>
      </div>

      <div class="query-options">
        <div class="search-mode-toggle">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              .checked=${this.searchMode === 'ontological'}
              @change=${this.handleSearchModeChange} />
            Ontological Search
            <span class="toggle-description">
              Search by semantic relationships (is_a, child_of, has_a)
            </span>
          </label>
        </div>

        <div class="ontological-options ${this.searchMode === 'semantic' ? 'hidden' : ''}">
          <div class="filter-row">
            <div class="filter-group">
              <md-outlined-select 
                label="Relationship Type"
                .value=${this.relationshipType}
                @change=${this.handleRelationshipTypeChange}>
                <md-select-option value="is_a">
                  <div slot="headline">Is A</div>
                  <div slot="supporting-text">Find documents that are examples of this concept</div>
                </md-select-option>
                <md-select-option value="child_of">
                  <div slot="headline">Child Of</div>
                  <div slot="supporting-text">Find specific instances under this broader concept</div>
                </md-select-option>
                <md-select-option value="has_a">
                  <div slot="headline">Has A</div>
                  <div slot="supporting-text">Find documents containing this property/attribute</div>
                </md-select-option>
              </md-outlined-select>
            </div>
            <div class="filter-group">
              <md-outlined-text-field
                label="Concept to search for"
                .value=${this.ontologicalConcept}
                placeholder="e.g., teacher, domain, teachers"
                @input=${this.handleOntologicalConceptInput}>
              </md-outlined-text-field>
            </div>
          </div>
        </div>

        <div class="filter-row ${this.searchMode === 'ontological' ? 'hidden' : ''}">
          <div class="filter-group">
            <context-slider
              .value=${this.contextValue}
              min="-10"
              max="50"
              @value-changed=${this.handleContextValueChanged}>
            </context-slider>
          </div>
        </div>
      </div>

      <div class="button-container">
        <md-filled-button 
          @click=${this.handleSubmit}
          ?disabled=${this.disabled || this.loading || !this.queryText.trim()}>
          ${this.loading ? 'Querying...' : 'Query Documents'}
        </md-filled-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'query-form': QueryForm;
  }
}