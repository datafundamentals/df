import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import { SignalWatcher } from '@lit-labs/signals';
import { queryWithLLMAsync } from '../stores/chroma-rag';

// Import extracted components
import './query-form.js';
import './relevance-group.js';
import './concept-explorer.js';

/**
 * Pure RAG Query Business Component
 * 
 * Handles ONLY query functionality - NO authentication logic.
 * Authentication is handled by parent rag-bundle-app wrapper.
 */
@customElement('rag-query-component')
export class RagQueryComponent extends SignalWatcher(LitElement) {
  @state() private queryStatus = '';
  @state() private queryStatusType: 'info' | 'success' | 'error' = 'info';
  @state() private showResults = false;
  @state() private contextResults: any[] = [];
  @state() private responseText = '';
  @state() private isQuerying = false;
  @state() private additionalContextValue = 5;
  @state() private queryText = '';
  @state() private contextOnlyMode = true;
  @state() private showConceptExplorer = false;
  @state() private extractedConcepts: string[] = [];
  @state() private searchMode: 'semantic' | 'ontological' = 'semantic';
  @state() private relationshipType: 'is_a' | 'child_of' | 'has_a' = 'is_a';
  @state() private ontologicalConcept = '';

  static override styles = css`
    :host {
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

    .results-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
    }

    .results-section h3 {
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 16px;
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
      line-height: var(--md-sys-typescale-title-medium-line-height, 24px);
      letter-spacing: var(--md-sys-typescale-title-medium-tracking, 0.15px);
    }

    .response-display, .context-display {
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      letter-spacing: var(--md-sys-typescale-body-medium-tracking, 0.25px);
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    .response-display {
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
      background-color: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .context-display {
      border-left: 4px solid var(--md-sys-color-secondary, #625b71);
      background-color: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
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
      text-align: left !important;
    }

    .concept-explorer-section {
      margin-top: 24px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      overflow: hidden;
      background-color: var(--md-sys-color-surface, #fffbfe);
    }

    .explorer-toggle {
      width: 100%;
      padding: 16px 20px;
      background: none;
      border: none;
      font-family: inherit;
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background-color 0.2s ease;
    }

    .explorer-toggle:hover {
      background-color: var(--md-sys-color-surface-container-lowest, #f7f2fa);
    }

    .explorer-toggle-icon {
      transition: transform 0.2s ease;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .explorer-toggle-icon.expanded {
      transform: rotate(180deg);
    }

    .explorer-content {
      padding: 20px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      background-color: var(--md-sys-color-surface-container-lowest, #f7f2fa);
    }

    .concept-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }

    .concept-chip {
      padding: 4px 12px;
      border-radius: 16px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      background-color: var(--md-sys-color-surface-container, #f3edf7);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .concept-chip:hover {
      background-color: var(--md-sys-color-primary-container, #e8def8);
      color: var(--md-sys-color-on-primary-container, #21005d);
      border-color: var(--md-sys-color-primary, #6750a4);
    }

    .extraction-info {
      padding: 12px 16px;
      margin-bottom: 16px;
      background-color: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.4;
    }
  `;

  private showQueryStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.queryStatus = message;
    this.queryStatusType = type;
  }

  private hideResults() {
    this.showResults = false;
  }

  private groupResultsByRelevance(results: any[]) {
    const groups = {
      strong: [] as any[],      // distance < 0.50 (relevance > 0.50) 
      good: [] as any[],        // distance 0.50-0.90 (relevance 0.10-0.50)
      weak: [] as any[],        // distance 0.90-1.05 (relevance -0.05-0.10)
      poor: [] as any[]         // distance > 1.05 (relevance < -0.05)
    };

    results.forEach(item => {
      const distance = item.distance;
      if (distance === null || distance === undefined) {
        groups.poor.push(item);
      } else if (distance < 0.50) {
        groups.strong.push(item);
      } else if (distance < 0.90) {
        groups.good.push(item);
      } else if (distance < 1.05) {
        groups.weak.push(item);
      } else {
        groups.poor.push(item);
      }
    });

    return groups;
  }

  private applySemanticFiltering(allResults: any[], sliderValue: number): any[] {
    // Group all results by relevance
    const groups = this.groupResultsByRelevance(allResults);
    
    if (sliderValue <= -8) {
      // -10 to -8: No retrieved context at all
      return [];
    } else if (sliderValue >= -7 && sliderValue <= -4) {
      // -7 to -4: 1st group only (Strong matches)
      return [
        ...groups.strong
      ];
    } else if (sliderValue >= -3 && sliderValue <= -1) {
      // -3 to -1: 1st + 2nd group (Strong + Good matches)
      return [
        ...groups.strong,
        ...groups.good
      ];
    } else if (sliderValue === 0) {
      // 0: 1st through 3rd group (Strong + Good + Weak matches)
      return [
        ...groups.strong,
        ...groups.good,
        ...groups.weak
      ];
    } else {
      // Positive (1-50): 1st through 3rd + N poor matches (Strong + Good + Weak + N Poor)
      return [
        ...groups.strong,
        ...groups.good,
        ...groups.weak,
        ...groups.poor.slice(0, sliderValue)
      ];
    }
  }

  private getQueryStatusMessage(sliderValue: number, filteredResults: any[]): string {
    const groups = this.groupResultsByRelevance(filteredResults);
    
    if (sliderValue <= -8) {
      return "Requested: No context → Showing AI response only";
    } else if (sliderValue >= -7 && sliderValue <= -4) {
      return `Requested: Strong matches only → Found ${groups.strong.length} strong matches`;
    } else if (sliderValue >= -3 && sliderValue <= -1) {
      return `Requested: Strong + Good matches → Found ${groups.strong.length} strong + ${groups.good.length} good matches`;
    } else if (sliderValue === 0) {
      return `Requested: All relevant matches → Found ${groups.strong.length} strong + ${groups.good.length} good + ${groups.weak.length} weak matches`;
    } else {
      return `Requested: All relevant + ${sliderValue} poor → Found ${groups.strong.length} strong + ${groups.good.length} good + ${groups.weak.length} weak + ${groups.poor.length} poor matches`;
    }
  }

  private getRelevanceLabelAndColor(level: string): { label: string; color: string } {
    switch (level) {
      case 'strong': return { label: 'Strong Match', color: 'var(--md-sys-color-primary, #6750a4)' };
      case 'good': return { label: 'Good Match', color: 'var(--md-sys-color-secondary, #625b71)' };
      case 'weak': return { label: 'Weak Match', color: 'var(--md-sys-color-tertiary, #7d5260)' };
      case 'poor': return { label: 'Poor Match - Just in case...', color: 'var(--md-sys-color-outline, #79747e)' };
      default: return { label: 'Unknown', color: 'var(--md-sys-color-outline-variant, #c7c5d0)' };
    }
  }

  private renderMarkdown(markdownText: string) {
    try {
      const htmlContent = marked.parse(markdownText, { async: false }) as string;
      return html`<div class="markdown-content">${unsafeHTML(htmlContent)}</div>`;
    } catch (error) {
      return html`<div class="markdown-content">${markdownText}</div>`;
    }
  }

  private handleQuerySubmit(event: CustomEvent) {
    const { 
      queryText, 
      originalQuery, 
      searchMode, 
      relationshipType, 
      ontologicalConcept,
      contextValue,
      contextOnlyMode
    } = event.detail;
    
    // Store all the query parameters
    if (originalQuery) {
      this.queryText = originalQuery;
    }
    this.searchMode = searchMode || 'semantic';
    this.relationshipType = relationshipType || 'is_a';
    this.ontologicalConcept = ontologicalConcept || '';
    this.additionalContextValue = contextValue || this.additionalContextValue;
    this.contextOnlyMode = contextOnlyMode !== undefined ? contextOnlyMode : this.contextOnlyMode;
    
    // Route to appropriate query method based on search mode
    if (this.searchMode === 'ontological') {
      this.queryOntological();
    } else {
      // queryText here is the full assembled query to send to the backend
      this.queryDocuments(queryText);
    }
  }

  private handleContextChanged(event: CustomEvent) {
    this.additionalContextValue = event.detail.contextValue;
  }

  private handleContextModeChanged(event: CustomEvent) {
    this.contextOnlyMode = event.detail.contextOnlyMode;
  }

  private async queryDocuments(query?: string) {
    const queryText = query || this.queryText;
    
    if (!queryText.trim()) {
      this.showQueryStatus('Please enter a question to search for.', 'error');
      return;
    }

    this.isQuerying = true;
    this.hideResults();
    this.extractedConcepts = []; // Reset extracted concepts for new query
    this.showConceptExplorer = false; // Close explorer for new query
    this.showQueryStatus('Searching documents and generating response...', 'info');

    // Use the slider value directly
    const sliderValue = this.additionalContextValue;

    // Request a larger set initially to ensure we capture all relevant matches
    // We'll filter this down based on semantic relevance thresholds
    const requestBody: any = {
      action: 'query_rag',
      collection_name: 'rag-documents',
      query: query,
      n_results: Math.max(1, Math.min(this.additionalContextValue + 7, 10)), // Ensure positive, limit results to AI model
      contextOnlyMode: this.contextOnlyMode,
    };

    try {
      // Use store to query documents (standards compliant)
      const queryOperation = queryWithLLMAsync(requestBody);
      
      await queryOperation.complete;
      const result = queryOperation.value;
      
      const allResults = result.context || [];
      
      // Apply semantic filtering logic
      const filteredResults = this.applySemanticFiltering(allResults, sliderValue);
      
      // Update the UI with semantically filtered results
      this.contextResults = filteredResults;
      this.responseText = result.response || 'No response generated.';
      this.showResults = true;
      
      // Show summary reflecting what was requested and what was found
      this.showQueryStatus(this.getQueryStatusMessage(sliderValue, filteredResults), 'success');
    } catch (error: any) {
      console.error('Error querying documents:', error);
      this.showQueryStatus(`Error: ${error.message}`, 'error');
      this.hideResults();
    } finally {
      this.isQuerying = false;
    }
  }

  private async queryOntological() {
    if (!this.ontologicalConcept.trim()) {
      this.showQueryStatus('Please enter a concept to search for in ontological mode.', 'error');
      return;
    }

    this.isQuerying = true;
    this.hideResults();
    this.extractedConcepts = []; // Reset extracted concepts for new query
    this.showConceptExplorer = false; // Close explorer for new query
    
    // Map relationship type to backend action
    const actionMap = {
      'is_a': 'find_by_is_a',
      'child_of': 'find_by_parent_concept',
      'has_a': 'find_by_has_a'
    };
    
    const action = actionMap[this.relationshipType];
    this.showQueryStatus(`Searching for documents where ${this.relationshipType} contains "${this.ontologicalConcept}"...`, 'info');

    const requestBody = {
      action: action,
      collection_name: 'rag-documents',
      concept: this.ontologicalConcept.trim()
    };

    // Debug logging for visibility
    console.log(`🔍 Ontological Query Details:`, {
      action: action,
      relationshipType: this.relationshipType,
      concept: this.ontologicalConcept.trim(),
      searchMode: this.searchMode
    });

    try {
      const response = await fetch('/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      // Debug logging for backend response
      console.log(`📡 Backend Response:`, {
        success: result.success,
        count: result.count,
        totalResults: result.results?.length || 0
      });
      
      if (result.success && result.results) {
        // Limit results to a reasonable number (20 max)
        const limitedResults = result.results.slice(0, 20);
        
        // Transform the ontological results to match the expected format
        // Give ontological matches excellent relevance (distance 0.1 = very good match)
        const transformedResults = limitedResults.map((item: any) => ({
          document: item.document,
          metadata: item.metadata,
          id: item.id,
          distance: 0.1 // Ontological matches are excellent matches by definition
        }));
        
        this.contextResults = transformedResults;
        this.responseText = `Found ${result.count} total documents where ${this.relationshipType} contains "${this.ontologicalConcept}". ${limitedResults.length < result.count ? `Showing top ${limitedResults.length} results.` : ''}`;
        this.showResults = true;
        
        this.showQueryStatus(`Found ${result.count} documents with ${this.relationshipType} relationship to "${this.ontologicalConcept}"${limitedResults.length < result.count ? ` (showing top ${limitedResults.length})` : ''}`, 'success');
      } else {
        this.showQueryStatus(`No documents found where ${this.relationshipType} contains "${this.ontologicalConcept}"`, 'error');
        this.hideResults();
      }
    } catch (error: any) {
      console.error('Error in ontological query:', error);
      this.showQueryStatus(`Error: ${error.message}`, 'error');
      this.hideResults();
    } finally {
      this.isQuerying = false;
    }
  }

  private editDocument(item: any) {
    // Pass the complete document data to the editor via localStorage
    
    // Store document data in localStorage for the editor to pick up
    const documentData = {
      id: item.id || item.metadata?.id,
      document: item.document || item.text || '',
      metadata: item.metadata || {}
    };
    
    localStorage.setItem('editorPostData', JSON.stringify(documentData));
    
    // Dispatch event to parent to switch to editor tab
    this.dispatchEvent(new CustomEvent('switch-tab', {
      detail: { tab: 'editor' },
      bubbles: true
    }));
  }

  private toggleConceptExplorer() {
    this.showConceptExplorer = !this.showConceptExplorer;
    
    // Extract concepts from query results when first opening
    if (this.showConceptExplorer && this.extractedConcepts.length === 0) {
      this.extractConceptsFromResults();
    }
  }

  private extractConceptsFromResults() {
    const concepts = new Set<string>();
    
    // Extract from query text
    if (this.queryText) {
      const queryWords = this.queryText.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !/^(the|and|or|but|for|with|from|when|where|what|how|why)$/.test(word));
      queryWords.forEach(word => concepts.add(word));
    }
    
    // Extract from context results metadata
    this.contextResults.forEach(result => {
      if (result.metadata) {
        // Extract from tags
        if (result.metadata.tags) {
          result.metadata.tags.split(',')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0)
            .forEach((tag: string) => concepts.add(tag));
        }
        
        // Extract from category
        if (result.metadata.category) {
          concepts.add(result.metadata.category);
        }
        
        // Extract from ontological relationships
        ['isA', 'childOf', 'hasA'].forEach(field => {
          if (result.metadata[field]) {
            result.metadata[field].split(',')
              .map((concept: string) => concept.trim())
              .filter((concept: string) => concept.length > 0)
              .forEach((concept: string) => concepts.add(concept));
          }
        });
        
        // Extract from title
        if (result.metadata.title) {
          const titleWords = result.metadata.title.toLowerCase()
            .split(/\s+/)
            .filter((word: string) => word.length > 3);
          titleWords.forEach((word: string) => concepts.add(word));
        }
      }
    });
    
    // Convert to array and limit to most relevant concepts
    this.extractedConcepts = Array.from(concepts)
      .filter(concept => concept.length > 2)
      .sort()
      .slice(0, 20); // Limit to 20 most relevant concepts
  }

  private handleConceptClick(concept: string) {
    // Set the concept in the explorer and trigger exploration
    const explorerElement = this.shadowRoot?.querySelector('concept-explorer') as any;
    if (explorerElement) {
      explorerElement.concept = concept;
      explorerElement.exploreCurrentConcept?.();
    }
  }

  override render() {
    return html`
      <p>Ask questions and get AI-powered responses from your stored documents:</p>

      <query-form
        .disabled=${this.isQuerying}
        .loading=${this.isQuerying}
        .queryText=${this.queryText}
        .contextValue=${this.additionalContextValue}
        .contextOnlyMode=${this.contextOnlyMode}
        @query-submit=${this.handleQuerySubmit}
        @context-changed=${this.handleContextChanged}
        @context-mode-changed=${this.handleContextModeChanged}>
      </query-form>

      ${this.queryStatus ? html`
        <div class="status-message ${this.queryStatusType}">${this.queryStatus}</div>
      ` : ''}

      <!-- Results Display -->
      ${this.showResults ? html`
        <div class="results-section">
          <h3>AI Response:</h3>
          <div class="response-display">${this.renderMarkdown(this.responseText)}</div>

          <h3>Retrieved Context:</h3>
          <div class="context-display">
            ${this.contextResults.length > 0 ? (() => {
              const groups = this.groupResultsByRelevance(this.contextResults);
              const relevantGroups = [
                { key: 'strong', items: groups.strong },
                { key: 'good', items: groups.good },
                { key: 'weak', items: groups.weak },
                { key: 'poor', items: groups.poor }
              ].filter(group => group.items.length > 0);

              if (relevantGroups.length === 0) {
                // Check if user intentionally requested no context (slider <= -8)
                const message = this.additionalContextValue <= -8 
                  ? "No relevant context requested." 
                  : "No relevant context found.";
                return html`<div class="context-item">${message}</div>`;
              }

              return relevantGroups.map(group => {
                const { label } = this.getRelevanceLabelAndColor(group.key);
                return html`
                  <relevance-group
                    level="${group.key}"
                    label="${label}"
                    .items=${group.items}
                    @edit-document=${(e: CustomEvent) => this.editDocument(e.detail.item)}>
                  </relevance-group>
                `;
              });
            })() : html`<div class="context-item">No relevant context found.</div>`}
          </div>
        </div>
      ` : ''}

      <!-- Concept Explorer Section -->
      ${this.showResults ? html`
        <div class="concept-explorer-section">
          <button class="explorer-toggle" @click=${this.toggleConceptExplorer}>
            <span>🔍 Explore Related Concepts</span>
            <span class="explorer-toggle-icon ${this.showConceptExplorer ? 'expanded' : ''}">▼</span>
          </button>
          
          ${this.showConceptExplorer ? html`
            <div class="explorer-content">
              ${this.extractedConcepts.length > 0 ? html`
                <div class="extraction-info">
                  Found ${this.extractedConcepts.length} concepts from your query and results.
                  Click any concept below to explore its relationships:
                </div>
                
                <div class="concept-chips">
                  ${this.extractedConcepts.map(concept => html`
                    <span class="concept-chip" @click=${() => this.handleConceptClick(concept)}>
                      ${concept}
                    </span>
                  `)}
                </div>
              ` : html`
                <div class="extraction-info">
                  No concepts could be extracted from the current results.
                  Try performing a query first to discover concepts.
                </div>
              `}
              
              <concept-explorer
                .concept=${''}
                .explorationDepth=${2}
                .maxResults=${15}>
              </concept-explorer>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rag-query-component': RagQueryComponent;
  }
}