import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createElectives, getElectives, deleteElectives, updateElectives } from '../stores/electives';
import './awr-upload-link';
import { SignalWatcher } from '@lit-labs/signals';

@customElement('peg-bundle-electives-admin')
export class PegBundleElectivesAdmin extends SignalWatcher(LitElement) {
  @state() electives: Array<{ id: string; name?: string; screenShot?: string; creationDate?: string; points?: number }> = [];
  @state() fileName = 'No screenshot chosen';

  static override styles = css`
    :host {
      display: block;
      border: solid 20px darkorange;
      border-radius: 5px;
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
    this.loadElectives();
  }

  async loadElectives() {
    this.electives = await getElectives();
  }

  async handleCreate() {
    if (this.shadowRoot) {
      const name = (this.shadowRoot.getElementById('name') as HTMLInputElement).value;
      const screenShot = "(this.shadowRoot.getElementById('screenShot') as HTMLInputElement).value;";
      const creationDate = (this.shadowRoot.getElementById('creationDate') as HTMLInputElement).value;
      const points = parseInt((this.shadowRoot.getElementById('points') as HTMLInputElement).value);
      await createElectives({ name, screenShot, creationDate: creationDate, points });
      this.loadElectives();
    }
  }

  async handleUpdate(id: string) {
    const updatedData = { points: parseInt(prompt('Points:', '0') || '0') };
    await updateElectives(id, updatedData);
    // console.log(id);
    this.loadElectives();
  }

  async handleDelete(id: string) {
    await deleteElectives(id);
    // console.log(id);
    this.loadElectives();
  }

  override render() {
    return html`
      <h3>You Probbaly Dont Want to Create New Elective Here</h3>
      <p>
        Problem is, i think this competes with the 'src/util/synchElectives' functionality so you better test both and eliminate one - i
        think the other is dominant??? Check and see
      </p>
      <p>On the other hand, some portion of this may be useful. Again, more research before taking action.</p>
      <input id="name" placeholder="Name" />
      <input id="creationDate" type="date" placeholder="Creation Date" />
      <input id="points" type="number" placeholder="Points Awarded" />

      <input id="uploaded" placeholder="UploadedURL" />
      <uploaded-link resourceLinkType="image"></uploaded-link>
      <button @click="${this.handleCreate}">Create Electives</button>

      <h3>Electives List</h3>
      <ul>
        ${this.electives.map(
          electives => html`
            <li>
              ${electives.name} - Due: ${electives.creationDate}
              ${electives.screenShot ? '"' + electives.screenShot + '"' + ': Screen Shot' : ' '}- Points: ${electives.points}
              <button @click="${() => this.handleUpdate(electives.id)}">Update</button>
              <button @click="${() => this.handleDelete(electives.id)}">Delete</button>
            </li>
          `,
        )}
      </ul>
      <ul>
        ${this.electives.map(electives => html` <li><a href="/electives/${electives.id}">${electives.name} </a></li> `)}
      </ul>
    `;
  }
}
