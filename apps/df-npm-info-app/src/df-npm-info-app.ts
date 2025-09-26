import {SignalWatcher} from '@lit-labs/signals';
import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import '@df/ui-lit/df-npm-info-widget.js';
import {loadNpmPackageInfo, npmInfoWidgetState, resetNpmInfoWidget} from '@df/state';

@customElement('df-npm-info-app')
export class DfNpmInfoApp extends SignalWatcher(LitElement) {
  static override styles = css`
    :host {
      display: grid;
      gap: 24px;
      width: min(960px, 100%);
      background: rgba(255, 255, 255, 0.92);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
    }

    header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    h1 {
      margin: 0;
      font-size: 1.8rem;
    }

    p {
      margin: 0;
      color: rgba(71, 85, 105, 0.95);
    }

    main {
      display: grid;
      gap: 24px;
    }

    .panel {
      border-radius: 16px;
      padding: 16px;
      background: rgba(15, 23, 42, 0.05);
      border: 1px solid rgba(148, 163, 184, 0.4);
    }

    pre {
      margin: 0;
      background: rgba(15, 23, 42, 0.75);
      color: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      font-size: 0.85rem;
      max-height: 280px;
      overflow: auto;
    }

    button {
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font: inherit;
      cursor: pointer;
      background: #2563eb;
      color: #ffffff;
      transition: background-color 120ms ease;
    }

    button:hover {
      background: #1d4ed8;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .demo-packages {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .demo-packages button {
      background: rgba(37, 99, 235, 0.12);
      color: rgba(37, 99, 235, 0.9);
      font-size: 0.9rem;
      padding: 6px 12px;
    }

    .demo-packages button:hover {
      background: rgba(37, 99, 235, 0.2);
    }
  `;

  override render() {
    const snapshot = npmInfoWidgetState.get();

    return html`
      <header>
        <h1>NPM Package Info - Runtime Harness</h1>
        <p>Explore how a Lit component consumes signal-driven state for NPM registry data.</p>
        <div class="demo-packages">
          <span style="color: rgba(71, 85, 105, 0.95); margin-right: 8px;">Try these packages:</span>
          <button @click=${() => this.handleLoadPackage('lit')}>lit</button>
          <button @click=${() => this.handleLoadPackage('react')}>react</button>
          <button @click=${() => this.handleLoadPackage('vue')}>vue</button>
          <button @click=${() => this.handleLoadPackage('svelte')}>svelte</button>
          <button @click=${() => this.handleLoadPackage('@lit-labs/signals')}>@lit-labs/signals</button>
        </div>
      </header>

      <main>
        <df-npm-info-widget 
          @df-npm-info-search=${this.handlePackageSearch}
          @df-npm-info-reset=${this.handlePackageReset}>
        </df-npm-info-widget>

        <section class="panel" aria-label="store-state">
          <h2>Store snapshot</h2>
          <pre>${JSON.stringify(snapshot, null, 2)}</pre>
          <div class="actions">
            <button @click=${this.handleRefresh}>Reload current package</button>
            <button @click=${this.handleReset}>Reset store</button>
          </div>
        </section>
      </main>
    `;
  }

  private handleLoadPackage(packageName: string) {
    void loadNpmPackageInfo(packageName);
  }

  private handlePackageSearch(event: CustomEvent) {
    const {packageName} = event.detail;
    if (packageName) {
      void loadNpmPackageInfo(packageName);
    }
  }

  private handlePackageReset(_event: CustomEvent) {
    // Event handled by widget's internal logic
  }

  private handleRefresh() {
    const currentPackage = npmInfoWidgetState.get().packageName;
    if (currentPackage) {
      void loadNpmPackageInfo(currentPackage);
    }
  }

  private handleReset() {
    resetNpmInfoWidget();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'df-npm-info-app': DfNpmInfoApp;
  }
}