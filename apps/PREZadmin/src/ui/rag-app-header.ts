import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/button/filled-button.js';
import { SignalWatcher } from '@lit-labs/signals';
import { isLoggedIn, signInWithGoogle, signOut, userSignal } from '../stores/auth';

/**
 * Shared app header component for RAG interface pages.
 * Provides consistent branding, authentication UI, and navigation.
 */
@customElement('rag-app-header')
export class RagAppHeader extends SignalWatcher(LitElement) {
  @property({ type: String })
  override title = 'PREZ';

  @property({ type: String })
  subtitle = 'RAG Interface';

  @property({ type: String })
  activePage = 'query';

  static override styles = css`
    :host {
      display: block;
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

  private navigateToPage(url: string) {
    window.location.href = url;
  }

  override render() {
    return html`
      <div class="app-header">
        <h1>${this.title}</h1>
        <h2>${this.subtitle}</h2>
        
        ${isLoggedIn.get()
          ? html`
            <div class="user-info">
              <span>Welcome, ${userSignal.get()?.displayName || userSignal.get()?.email || 'User'}</span>
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
              <md-primary-tab 
                ?active=${this.activePage === 'query'}
                @click=${() => this.navigateToPage('rag-query.html')}>
                Query & Chat
              </md-primary-tab>
              <md-primary-tab 
                ?active=${this.activePage === 'storage'}
                @click=${() => this.navigateToPage('rag-storage.html')}>
                Document Storage
              </md-primary-tab>
              <md-primary-tab 
                ?active=${this.activePage === 'editor'}
                @click=${() => this.navigateToPage('rag-editor.html')}>
                Document Editor
              </md-primary-tab>
              <md-primary-tab 
                ?active=${this.activePage === 'home'}
                @click=${() => this.navigateToPage('index.html')}>
                RAG Home
              </md-primary-tab>
            </md-tabs>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rag-app-header': RagAppHeader;
  }
}