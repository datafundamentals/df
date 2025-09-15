import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { isLoggedIn, signInWithGoogle, signOut, userSignal } from '../stores/auth';
import './awr-upload-link';
import './bwp-page-author';
import '@material/web/fab/fab.js';
import { SignalWatcher } from '@lit-labs/signals';

@customElement('bwp-bundle-app')
export class BwpBundleApp extends SignalWatcher(LitElement) {
  static override styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
    }
  `;

  override render() {
    return html`
      <div>
        ${isLoggedIn.get()
          ? html`<p>Welcome, ${userSignal.get()?.displayName} ${userSignal.get()?.uid} ${userSignal.get()?.email}</p>
              <md-fab @click="${signOut}" label="Sign Out" aria-label="Sign Out"> </md-fab>
              <bwp-page-author> </bwp-page-author> `
          : html`
              <md-fab @click="${signInWithGoogle}" label="Sign in with Google" aria-label="Sign in with Google">
                <md-icon slot="icon">^</md-icon>
              </md-fab>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'awr--bundle-app': BwpBundleApp;
  }
}
