import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { NpmInfo, NpmPackage, renderAsyncComputed } from '../stores/npm-info';
import '@material/web/textfield/outlined-text-field.js';

@customElement('npm-info')
export class NpmInfoElement extends SignalWatcher(LitElement) {
  // This object is built with signals, including an AsyncComputed that fetched
  // from the npm registry
  private _npmInfo = new NpmInfo();

  override render() {
    return html`
      <div>
        <md-outlined-text-field
          label="NPM Package Name" 
          supporting-text="Enter a package name like lit, chalk, react, or vue"
          .value=${this._npmInfo.packageName} 
          @input=${this._onChange}>
        </md-outlined-text-field>
      </div>
      <header>
        <h1>${this._npmInfo.packageName}</h1>
        ${logo}
      </header>
      <div>
        <p>${this._npmInfo.info.status}</p>
        ${renderAsyncComputed(this._npmInfo.info, {
          initial: () =>
            html`<span class="initial"> When does this ever actually display? Enter a package name to display its npm info </span>`,
          pending: () => html`Loading npm info for <code>${this._npmInfo.packageName}</code>`,
          complete: (pkg: NpmPackage) => html`
            <h3>${pkg.description}</h3>
            <h4>dist-tags:</h4>
            <ul>
              ${Object.keys(pkg['dist-tags']).map(
                tag =>
                  html` <li>
                    <pre>${tag}: ${pkg['dist-tags'][tag]}</pre>
                  </li>`,
              )}
            </ul>
          `,
          error: e => html`<span class="error"> Error: ${(e as Error).message} </span>`,
        })}
      </div>
    `;
  }

  private _onChange(e: Event) {
    this._npmInfo.packageName = (e.target as any).value;
  }

  static override styles = css`
    :host {
      display: block;
      background: white;
      min-width: 300px;
      border-radius: 5px;
      border: solid 1px #aaa;
      padding: 20px;
    }

    header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    #logo {
      height: 38px;
      width: auto;
    }

    .initial {
      font-style: italic;
    }

    .error {
      color: red;
    }
  `;
}

const logo = html`<img id="logo" src="https://raw.githubusercontent.com/npm/logos/master/npm%20logo/npm-logo-red.svg" alt="npm logo" />`;
