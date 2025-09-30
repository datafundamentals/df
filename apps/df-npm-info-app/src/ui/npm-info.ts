import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { npmInfoWidgetState, setPackageName, loadNpmPackageInfo } from '@df/state';
import type { NpmInfoWidgetState } from '@df/types';
import '@material/web/textfield/outlined-text-field.js';

@customElement('npm-info')
export class NpmInfoElement extends SignalWatcher(LitElement) {
  override render() {
    const state = npmInfoWidgetState.get();

    return html`
      <div>
        <md-outlined-text-field
          label="NPM Package Name"
          supporting-text="Enter a package name like lit, chalk, react, or vue"
          .value=${state.packageName}
          @input=${this._onChange}
          @keydown=${this._onKeydown}>
        </md-outlined-text-field>
      </div>
      <header>
        <h1>${state.packageName}</h1>
        ${logo}
      </header>
      <div>
        <p>${state.status}</p>
        ${this._renderState(state)}
      </div>
    `;
  }

  private _renderState(state: NpmInfoWidgetState) {
    switch (state.status) {
      case 'idle':
        return html`<span class="initial">Enter a package name to display its npm info</span>`;
      case 'loading':
        return html`Loading npm info for <code>${state.packageName}</code>`;
      case 'ready':
        if (state.packageData) {
          const distTags = state.packageData['dist-tags'];
          return html`
            <h3>${state.packageData.description || 'No description available'}</h3>
            ${distTags ? html`
              <h4>dist-tags:</h4>
              <ul>
                ${Object.keys(distTags).map(
                  tag =>
                    html` <li>
                      <pre>${tag}: ${distTags[tag as keyof typeof distTags]}</pre>
                    </li>`,
                )}
              </ul>
            ` : ''}
          `;
        }
        return html`<span class="initial">No package data available</span>`;
      case 'error':
        return html`<span class="error">Error: ${state.errorMessage}</span>`;
      default:
        return html`<span class="initial">Enter a package name to display its npm info</span>`;
    }
  }

  private _onChange(e: Event) {
    const value = (e.target as any).value;
    setPackageName(value);
  }

  private _onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      loadNpmPackageInfo();
    }
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
