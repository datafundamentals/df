import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/button/filled-button.js';
import { marked } from 'marked';
import './context-slider.js';
import './document-metadata.js';
import './relevance-group.js';
import './query-form.js';
import { SignalWatcher } from '@lit-labs/signals';
import { isLoggedIn, signInWithGoogle, signOut, userSignal } from '../stores/auth';
import { queryWithLLMAsync } from '../stores/chroma-rag';

@customElement('rag-query-interface')
export class RagQueryInterface extends SignalWatcher(LitElement) {
  @state() statusMessage = '';
  @state() statusType: 'info' | 'success' | 'error' = 'info';
  @state() queryStatus = '';
  @state() queryStatusType: 'info' | 'success' | 'error' = 'info';
  @state() showResults = false;
  @state() contextResults: any[] = [];
  @state() responseText = '';
  @state() isLoading = false;
  @state() isQuerying = false;
  @state() showVerboseOutput = false;
  @state() verboseMessages: Array<{type: string, text: string}> = [];
  @state() isCreatingNew = false;
  @state() newDocumentTitle = '';
  @state() newDocumentFilename = '';
  @state() showTitleInput = false;
  @state() additionalContextValue = 5;
  @state() queryText = '';

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

    .app-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .user-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding: 12px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
    }

    .user-info span {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 500);
    }

    .login-prompt {
      text-align: center;
      margin-top: 24px;
      padding: 32px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
    }

    .login-prompt p {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-large-size, 16px);
      margin-bottom: 16px;
    }

    h1 {
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-align: center;
      margin-bottom: 8px;
      font-family: var(--md-sys-typescale-headline-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-headline-large-size, 32px);
      font-weight: var(--md-sys-typescale-headline-large-weight, 400);
      line-height: var(--md-sys-typescale-headline-large-line-height, 40px);
      letter-spacing: var(--md-sys-typescale-headline-large-tracking, 0px);
    }

    h2 {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
      margin-bottom: 32px;
      font-family: var(--md-sys-typescale-title-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-large-size, 22px);
      font-weight: var(--md-sys-typescale-title-large-weight, 400);
      line-height: var(--md-sys-typescale-title-large-line-height, 28px);
      letter-spacing: var(--md-sys-typescale-title-large-tracking, 0px);
    }

    p {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
      margin-bottom: 24px;
      font-family: var(--md-sys-typescale-body-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-large-size, 16px);
      font-weight: var(--md-sys-typescale-body-large-weight, 400);
      line-height: var(--md-sys-typescale-body-large-line-height, 24px);
      letter-spacing: var(--md-sys-typescale-body-large-tracking, 0.5px);
    }

    .mode-selector {
      display: flex;
      justify-content: center;
      margin-bottom: 30px;
      border-bottom: 1px solid #ddd;
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


    .update-placeholder {
      text-align: center;
      padding: 40px 20px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
    }













    .navigation {
      margin-bottom: 20px;
      text-align: center;
    }

    .navigation md-tabs {
      --md-primary-tab-container-color: transparent;
      --md-primary-tab-active-indicator-color: var(--md-sys-color-primary, #6750a4);
      --md-primary-tab-label-text-color: var(--md-sys-color-on-surface, #1c1b1f);
      --md-primary-tab-active-label-text-color: var(--md-sys-color-primary, #6750a4);
    }

    .navigation md-primary-tab {
      cursor: pointer;
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
    const { queryText } = event.detail;
    // Don't set this.queryText - that should only contain the user's input text
    // queryText here is the full assembled query to send to the backend
    this.queryDocuments(queryText);
  }

  private handleContextChanged(event: CustomEvent) {
    this.additionalContextValue = event.detail.contextValue;
  }

  private async queryDocuments(query?: string) {
    const queryText = query || this.queryText;
    
    if (!queryText.trim()) {
      this.showQueryStatus('Please enter a question to search for.', 'error');
      return;
    }

    this.isQuerying = true;
    this.hideResults();
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

  private editDocument(item: any) {
    // Pass the complete document data to the editor via localStorage
    
    // Store document data in localStorage for the editor to pick up
    const documentData = {
      id: item.id || item.metadata?.id,
      document: item.document || item.text || '',
      metadata: item.metadata || {}
    };
    
    localStorage.setItem('editorPostData', JSON.stringify(documentData));
    
    // Navigate to editor
    window.location.href = 'rag-editor.html';
  }

  private navigateToPage(url: string) {
    window.location.href = url;
  }



  override render() {
    return html`
      <div class="app-header">
        <h2>PREZ - Prompt Generator in Chief</h2>
        
        ${isLoggedIn.get()
          ? html`
            <div class="user-info">
              <span>Welcome, ${userSignal.get()?.displayName || 'User'}</span>
              <md-filled-button @click="${signOut}">Sign Out</md-filled-button>
            </div>
          `
          : html`
            <div class="login-prompt">
              <p>Please sign in to access the RAG interface</p>
              <md-filled-button @click="${signInWithGoogle}">Sign in with Google</md-filled-button>
            </div>
          `
        }
        
        ${isLoggedIn.get() ? html`
          <div class="navigation">
            <md-tabs>
              <md-primary-tab active>Query & Chat</md-primary-tab>
              <md-primary-tab @click=${() => this.navigateToPage('rag-storage.html')}>Document Storage</md-primary-tab>
              <md-primary-tab @click=${() => this.navigateToPage('rag-editor.html')}>Document Editor</md-primary-tab>
              <md-primary-tab @click=${() => this.navigateToPage('index.html')}>RAG Home</md-primary-tab>
            </md-tabs>
          </div>
        ` : ''}
      </div>

      ${isLoggedIn.get() ? html`
        <!-- RAG Interface Content -->

      <!-- Query Mode -->
      <div class="mode-section active">
        <query-form
          .disabled=${this.isQuerying}
          .loading=${this.isQuerying}
          .queryText=${this.queryText}
          .contextValue=${this.additionalContextValue}
          @query-submit=${this.handleQuerySubmit}
          @context-changed=${this.handleContextChanged}>
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
      </div>

      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rag-query-interface': RagQueryInterface;
  }
}