/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { userSignal, isLoggedIn, signInWithGoogle } from '../stores/auth';
import './peg-players-admin';
import { SignalWatcher } from '@lit-labs/signals';

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('peg-bundle-admin')
export class PegBundleAdmin extends SignalWatcher(LitElement) {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }
  `;

  override render() {
    return html`
      <div>
        ${isLoggedIn.get()
          ? html`<p>Welcome, ${userSignal.get()?.displayName}</p>
              <players-admin></players-admin>`
          : html`<button @click="${signInWithGoogle}">Sign in with Google</button>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'peg-bundle-admin': PegBundleAdmin;
  }
}
