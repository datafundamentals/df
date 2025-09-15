import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { isLoggedIn, signInWithGoogle } from '../stores/auth';
import './awr-upload-link';
import './awr-resource-documenter';
import { SignalWatcher } from '@lit-labs/signals';
import '@material/web/button/filled-tonal-button.js';
import { pageAuthor, renderAsyncComputed } from '../stores/page-author';
import { MakeAdd, UrlMediaType } from '../types';

@customElement('bwp-page-author')
export class BwpPageAuthor extends SignalWatcher(LitElement) {
  private _pageAuthorState = pageAuthor;
  @property() resourcePageType = 'void';

  static override styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
    }
  `;

  private handleTextChange(value: string, id: string) {
    switch (id) {
      case 'name':
        this._pageAuthorState.resourceName = value;
        break;
      case 'markdown':
        this._pageAuthorState.markdown = value;
        break;
    }
  }

  private handleLink(urlMediaType: UrlMediaType, url: URL, makeAdd: MakeAdd) {
    if (urlMediaType && url && makeAdd) {
      this._pageAuthorState.linkResource = { urlMediaType, url, makeAdd };
    } else {
      console.error('INCOMPLETE LINK RESOURCE');
    }
  }

  override render() {
    return html`
      <div>
        ${isLoggedIn.get()
          ? html`
              ${renderAsyncComputed(this._pageAuthorState.persisted, {
                initial: () => html`<span> If you see this then this is initial renderAsyncComputed. </span>`,
                pending: () => html`<span>If you see this then this is pendng renderAsyncComputed.</span>`,
                complete: () => html`
                  <awr-resource-documenter
                    @text-change="${(e: CustomEvent) => this.handleTextChange(e.detail.value, e.detail.id)}"
                    @link-make-add="${(e: CustomEvent) => this.handleLink(e.detail.linkType, e.detail.url, e.detail.makeAdd)}"
                    .resourceGraph="${this._pageAuthorState.pageAuthor.resourceGraph}"
                    resourcePageType="pageAuthor"
                  >
                  </awr-resource-documenter>
                `,
                error: e => html`<span>Error: ${e}</span>`,
              })}

              <awr-resource-documenter .resourceGraph="${this._pageAuthorState.pageAuthor.resourceGraph}" resourcePageType="pageAuthor">
              </awr-resource-documenter>
              <md-filled-tonal-button @click="${() => (window.location.href = '/dev/webpage.html?resourcePageType="pageAuthor.page')}"
                >Add Page
              </md-filled-tonal-button>
            `
          : html` <button @click="${signInWithGoogle}">Sign in with Google</button>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bwp-page-author': BwpPageAuthor;
  }
}
