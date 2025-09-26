import {SignalWatcher} from '@lit-labs/signals';
import {css, html, LitElement, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {
  npmInfoWidgetState,
  setPackageName,
} from '@df/state';
import type {NpmInfoWidgetStatus, NpmPackage} from '@df/types';
import '@material/web/textfield/outlined-text-field.js';

@customElement('df-npm-info-widget')
export class DfNpmInfoWidget extends SignalWatcher(LitElement) {
  static override styles = css`
    :host {
      display: block;
      background: white;
      min-width: 300px;
      max-width: 500px;
      width: 100%;
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

  @property({type: String, attribute: 'default-package'})
  declare defaultPackage: string;

  constructor() {
    super();
    this.defaultPackage = '';
  }

  @property({type: String})
  set packageName(value: string) {
    if (value && value !== npmInfoWidgetState.get().packageName) {
      setPackageName(value);
    }
  }

  get packageName(): string {
    return npmInfoWidgetState.get().packageName;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Auto-load default package if provided and no package is currently loaded
    const state = npmInfoWidgetState.get();
    if (this.defaultPackage && state.status === 'idle' && !state.packageName) {
      setPackageName(this.defaultPackage);
    }
  }

  override render() {
    const state = npmInfoWidgetState.get();
    const {status, packageName, packageData, errorMessage} = state;

    return html`
      <div>
        <md-outlined-text-field
          label="NPM Package Name" 
          supporting-text="Enter a package name like lit, chalk, react, or vue"
          .value=${packageName} 
          @input=${this.handlePackageNameInput}
          @keydown=${this.handleKeydown}>
        </md-outlined-text-field>
      </div>
      <header>
        <h1>${packageName}</h1>
        ${logo}
      </header>
      <div>
        <p>${status}</p>
        ${this.renderPackageInfo(status, packageData, errorMessage)}
      </div>
    `;
  }

  private renderPackageInfo(status: NpmInfoWidgetStatus, packageData: NpmPackage | null, errorMessage: string | null) {
    switch (status) {
      case 'idle':
        return html`<span class="initial">When does this ever actually display? Enter a package name to display its npm info</span>`;
      case 'loading':
        return html`Loading npm info for <code>${npmInfoWidgetState.get().packageName}</code>`;
      case 'ready':
        if (!packageData) return nothing;
        return html`
          <h3>${packageData.description || 'No description available'}</h3>
          <h4>dist-tags:</h4>
          <ul>
            ${Object.keys(packageData['dist-tags'] || {}).map(
              tag => html`<li><pre>${tag}: ${(packageData['dist-tags'] as Record<string, string>)?.[tag]}</pre></li>`
            )}
          </ul>
        `;
      case 'error':
        return html`<span class="error">Error: ${errorMessage || 'Unknown error'}</span>`;
      default:
        return nothing;
    }
  }

  private handlePackageNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    setPackageName(input.value);
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const packageName = npmInfoWidgetState.get().packageName.trim();
      if (packageName) {
        this.dispatchEvent(
          new CustomEvent('df-npm-info-search', {
            detail: {packageName},
            bubbles: true,
            composed: true,
          }),
        );
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'df-npm-info-widget': DfNpmInfoWidget;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'df-npm-info-widget': DfNpmInfoWidget;
  }
}

const logo = html`<img id="logo" src="https://raw.githubusercontent.com/npm/logos/master/npm%20logo/npm-logo-red.svg" alt="npm logo" />`;

declare global {
  interface HTMLElementTagNameMap {
    'df-npm-info-widget': DfNpmInfoWidget;
  }
}