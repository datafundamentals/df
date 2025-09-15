import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/switch/switch.js';
import './prompt-modifier-chips.js';

/**
 * Prompt Configuration Component
 * 
 * Unified component for all prompt building controls:
 * - Context-only mode toggle
 * - Prompt modifier chips
 * - Assembled prompt preview
 * 
 * Emits 'configuration-changed' event with complete prompt configuration
 */
@customElement('prompt-configuration')
export class PromptConfiguration extends LitElement {
  @property({ type: Boolean })
  contextOnlyMode: boolean = true;

  @property({ type: String })
  userQuery: string = '';

  @state()
  private promptModifiers: string = '';

  @state()
  private modifierChipsLoaded: boolean = false;

  static override styles = css`
    :host {
      display: block;
    }

    .configuration-container {
      background-color: var(--md-sys-color-surface-variant, #f3f0f4);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    .section-title {
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 16px;
    }

    .context-mode-toggle {
      margin-bottom: 20px;
      padding: 12px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toggle-label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      flex: 1;
    }

    .toggle-description {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 2px;
    }

    .modifiers-section {
      margin-bottom: 20px;
    }

    .modifiers-label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 8px;
      display: block;
    }

  `;

  override async connectedCallback() {
    super.connectedCallback();
    
    // Load prompt modifier chips dynamically
    try {
      await import('./prompt-modifier-chips.js');
      this.modifierChipsLoaded = true;
    } catch (e) {
      console.warn('Prompt modifier chips not available, continuing without them');
    }
  }

  private handleContextModeChanged(event: Event) {
    const toggle = event.target as any;
    this.contextOnlyMode = toggle.selected;
    this.emitConfigurationChanged();
  }

  private handlePromptModifiersChanged(event: CustomEvent) {
    this.promptModifiers = event.detail.assembledPrompt || '';
    this.emitConfigurationChanged();
  }

  private emitConfigurationChanged() {
    const assembledPrompt = this.getAssembledPrompt();
    
    this.dispatchEvent(new CustomEvent('configuration-changed', {
      detail: {
        contextOnlyMode: this.contextOnlyMode,
        promptModifiers: this.promptModifiers,
        assembledPrompt: assembledPrompt
      },
      bubbles: true
    }));
  }

  private getAssembledPrompt(): string {
    // Only return prompt modifiers - user query will be handled by query-form
    return this.promptModifiers.trim();
  }


  /**
   * Public API: Update user query for preview
   */
  public updateUserQuery(query: string) {
    this.userQuery = query;
    this.requestUpdate();
  }

  override render() {
    return html`
      <div class="configuration-container">
        <div class="section-title">Prompt Configuration</div>
        
        <div class="context-mode-toggle">
          <div class="toggle-label">
            Context-only mode 
            <div class="toggle-description">
              ${this.contextOnlyMode 
                ? 'AI will only use provided document context' 
                : 'AI can use general knowledge beyond documents'}
            </div>
          </div>
          <md-switch 
            ?selected=${this.contextOnlyMode}
            @change=${this.handleContextModeChanged}>
          </md-switch>
        </div>

        ${this.modifierChipsLoaded ? html`
          <div class="modifiers-section">
            <label class="modifiers-label">Prompt Modifiers (optional):</label>
            <prompt-modifier-chips
              @modifiers-changed=${this.handlePromptModifiersChanged}>
            </prompt-modifier-chips>
          </div>
        ` : ''}

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'prompt-configuration': PromptConfiguration;
  }
}