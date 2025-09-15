import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { isLoggedIn, signInWithGoogle, signOut, userSignal } from '../stores/auth';
import { PromptFragmentsSeeder } from '../services/prompt-fragments-seeder';
import '@material/web/button/filled-button.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';

// Import pure business components (will be created)
import './rag-query-component.js';
import './rag-storage-component.js';
import './rag-editor-component.js';

/**
 * RAG Authentication Wrapper Component
 * 
 * Follows the Authentication Wrapper Pattern:
 * - Handles ALL authentication concerns for RAG domain
 * - Provides consistent login/logout UI
 * - Contains pure business components with no auth logic
 * - Supports MPA architecture and dev environment
 */
@customElement('rag-bundle-app')
export class RagBundleApp extends SignalWatcher(LitElement) {
  @state() private activeTab: 'query' | 'storage' | 'editor' = 'query';

  override connectedCallback() {
    super.connectedCallback();
    
    // Initialize prompt fragments seed data
    this.initializeSeedData();
  }

  private async initializeSeedData() {
    try {
      await PromptFragmentsSeeder.initializeSeedData();
    } catch (error) {
      console.warn('Could not initialize prompt fragments seed data:', error);
      // App continues normally even if seeding fails
    }
  }

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
      text-align: center;
    }

    .app-header h1 {
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 8px;
      font-family: var(--md-sys-typescale-headline-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-headline-large-size, 32px);
      font-weight: var(--md-sys-typescale-headline-large-weight, 400);
      line-height: var(--md-sys-typescale-headline-large-line-height, 40px);
      letter-spacing: var(--md-sys-typescale-headline-large-tracking, 0px);
    }

    .app-header h2 {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 32px;
      font-family: var(--md-sys-typescale-title-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-large-size, 22px);
      font-weight: var(--md-sys-typescale-title-large-weight, 400);
      line-height: var(--md-sys-typescale-title-large-line-height, 28px);
      letter-spacing: var(--md-sys-typescale-title-large-tracking, 0px);
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

    .business-content {
      margin-top: 20px;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }
  `;

  private handleTabChange(tabName: 'query' | 'storage' | 'editor') {
    this.activeTab = tabName;
  }

  private handleSwitchTab(event: CustomEvent) {
    const { tab } = event.detail;
    if (tab && ['query', 'storage', 'editor'].includes(tab)) {
      this.activeTab = tab;
      
      // If switching to editor, trigger a check for localStorage data
      if (tab === 'editor') {
        this.updateComplete.then(() => {
          const editorComponent = this.shadowRoot?.querySelector('rag-editor-component');
          if (editorComponent && 'checkForDocumentData' in editorComponent) {
            (editorComponent as any).checkForDocumentData();
          }
        });
      }
    }
  }

  private renderAuthenticatedContent() {
    return html`
      <div class="user-info">
        <span>Welcome, ${userSignal.get()?.displayName || 'User'}</span>
        <md-filled-button @click="${signOut}">Sign Out</md-filled-button>
      </div>
      
      ${this.renderNavigation()}
      ${this.renderBusinessContent()}
    `;
  }

  private renderNavigation() {
    return html`
      <div class="navigation">
        <md-tabs>
          <md-primary-tab 
            ?active=${this.activeTab === 'query'}
            @click=${() => this.handleTabChange('query')}>
            Query & Chat
          </md-primary-tab>
          <md-primary-tab 
            ?active=${this.activeTab === 'storage'}
            @click=${() => this.handleTabChange('storage')}>
            Document Storage
          </md-primary-tab>
          <md-primary-tab 
            ?active=${this.activeTab === 'editor'}
            @click=${() => this.handleTabChange('editor')}>
            Document Editor
          </md-primary-tab>
        </md-tabs>
      </div>
    `;
  }

  private renderBusinessContent() {
    return html`
      <div class="business-content" @switch-tab=${this.handleSwitchTab}>
        <!-- Pure business components - NO authentication logic -->
        
        <div class="tab-content ${this.activeTab === 'query' ? 'active' : ''}">
          <rag-query-component></rag-query-component>
        </div>
        
        <div class="tab-content ${this.activeTab === 'storage' ? 'active' : ''}">
          <rag-storage-component></rag-storage-component>
        </div>
        
        <div class="tab-content ${this.activeTab === 'editor' ? 'active' : ''}">
          <rag-editor-component></rag-editor-component>
        </div>
      </div>
    `;
  }

  private renderLoginPrompt() {
    return html`
      <div class="login-prompt">
        <h2>Authentication Required</h2>
        <p>Please sign in to access the RAG system</p>
        <md-filled-button @click="${signInWithGoogle}">
          Sign in with Google
        </md-filled-button>
      </div>
    `;
  }

  override render() {
    return html`
      <div class="app-header">
        <h2>PREZ - Prompt Generator in Chief</h2>
      </div>
      
      ${isLoggedIn.get()
        ? this.renderAuthenticatedContent()
        : this.renderLoginPrompt()
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rag-bundle-app': RagBundleApp;
  }
}