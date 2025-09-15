import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { isLoggedIn, signInWithGoogle } from '../stores/auth';
import './awr-upload-link';
import './awr-resource-documenter';
import '@material/web/fab/fab.js';
import { SignalWatcher } from '@lit-labs/signals';

@customElement('bwp-page')
export class BwpPage extends SignalWatcher(LitElement) {
  @state() isDocumenterVisible = false;
  @property() isAdd = true;
  @property() resourcePageType = 'void';

  static override styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
    }
  `;


  handleSiteInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.isDocumenterVisible = inputElement.value.length >= 3;
  }

  handleTargetSiteEntry(event: Event): void {
    const target = event.target as HTMLSelectElement;
    console.log('WHOULD HAVE USED ' + target.value);
    // this.isDocumenterVisible = true;
    // try {
    //   this.page = updatePageTargetSite(this.page.id, target.value);
    // } catch (error) {
    //   if (error instanceof Error) {
    //     console.error("An error occurred:", error.message);
    //   } else {
    //     console.error("An unknown error occurred.");
    //   }
    // }
  }

  initId = () => {
    const getRandomLowercaseLetter = (): string => {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      return alphabet[Math.floor(Math.random() * alphabet.length)];
    };
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2); // Last two digits of the year
    const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
    const dd = now.getDate().toString().padStart(2, '0'); // Day (01-31)
    const HH = now.getHours().toString().padStart(2, '0'); // Hours (00-23)
    const MM = now.getMinutes().toString().padStart(2, '0'); // Minutes (00-59)
    return `${yy}${mm}${dd}${HH}${MM}${getRandomLowercaseLetter()}`;
  };

  private handleUpsert(event: Event): void {
    const target = event.target as HTMLSelectElement;
    console.log('TYPESCRIPT REQUIRES THIS', target.value);
  }

  override render() {
    console.log('bwp_page PAGE TYPE OF ' + this.resourcePageType);
    return html`
      <div>
        ${isLoggedIn.get()
          ? html`
              <md-outlined-text-field id="site" label="Target Site" @blur="${this.handleTargetSiteEntry}"> </md-outlined-text-field>
              ${this.isDocumenterVisible
                ? html` <awr-resource-documenter resourcePageType=${this.resourcePageType}></awr-resource-documenter>`
                : ''}
              <div>
                <md-fab @click="${this.handleUpsert}" label="Submit" aria-label=${this.isAdd ? 'Create Project' : 'Update Project'}>
                  <md-icon slot="icon">^</md-icon>
                </md-fab>
              </div>
            `
          : html` <button @click="${signInWithGoogle}">Sign in with Google</button>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'awr--page': BwpPage;
  }
}
