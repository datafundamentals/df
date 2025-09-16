import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getPlayers } from '../stores/players';
import { SignalWatcher } from '@lit-labs/signals';

@customElement('players-admin')
export class PegPlayersAdmin extends SignalWatcher(LitElement) {
  @state() players: Array<{
    userId?: string;
    id: string;
    displayName?: string;
  }> = [];

  static override styles = css`
    :host {
      display: block;
      border: solid 2px darkred;
      margin: 10px;
      padding: 16px;
    }
    input {
      display: block;
      margin-bottom: 10px;
      button {
        margin: 5px;
      }
      input {
        margin: 5px;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.loadPlayers();
  }

  async loadPlayers() {
    this.players = await getPlayers();
  }

  override render() {
    return html`
      <h3>Players List</h3>
      <ul>
        ${this.players.map(players => html` <li>${players.displayName} - ${players.userId}</li> `)}
      </ul>
    `;
  }
}
