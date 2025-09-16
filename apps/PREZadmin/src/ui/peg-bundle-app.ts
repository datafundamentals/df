import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { isLoggedIn, signInWithGoogle, signOut, userSignal } from '../stores/auth';
import './awr-upload-link';
import './peg-players-admin';
import './peg-bundle-electives-admin';
import './peg-player';
import { SignalWatcher } from '@lit-labs/signals';
import { player } from '../stores/player';
import { Player } from '../types';

@customElement('peg-bundle-app')
export class PegBundleApp extends SignalWatcher(LitElement) {
  @state() private playerGraph: Player | null = player.get();
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
          ? html`<p>Welcome, ${userSignal.get()?.displayName}</p>
              <button @click="${signOut}">Sign Out</button>
              ${this.playerGraph ? html` <div>${this.playerGraph.uid}</div>` : ''}
              <peg-player></peg-player>`
          : html` <button @click="${signInWithGoogle}">Sign in with Google</button>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'peg--bundle-app': PegBundleApp;
  }
}
