import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getElectives } from '../stores/electives';
import { SignalWatcher } from '@lit-labs/signals';

@customElement('peg-bundle-elective-menu')
export class PegBundleElectiveMenu extends SignalWatcher(LitElement) {
  @state() electives: Array<{ id: string; name?: string; screenShot?: string; creationDate?: string; points?: number }> = [];
  static override styles = css`
    :host {
      display: block;
      margin: 5px;
      padding: 5px;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.loadElectives();
  }

  async loadElectives() {
    this.electives = await getElectives();
  }

  private navigateToPage(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selected = target.value;
    if (selected) {
      window.location.href = `/electives/${selected}/`;
    }
  }

  override render() {
    return html`
      <select @change=${this.navigateToPage}>
        <option value="">Navigate to an Elective</option>
        ${this.electives.map(elective => html`<option value="${elective.id}">${elective.name}</option>`)}
      </select>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'peg-bundle-elective-menu': PegBundleElectiveMenu;
  }
}
