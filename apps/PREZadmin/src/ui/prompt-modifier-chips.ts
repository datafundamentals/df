import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { SignalWatcher } from '@lit-labs/signals';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/input-chip.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import { 
  PromptFragment,
  loadPromptFragmentsAsync, 
  savePromptFragmentAsync 
} from '../stores/prompt-fragments';

/**
 * Multi-select chip component for prompt modifiers
 * 
 * Allows users to:
 * - Select from existing prompt modifiers (key-value pairs)
 * - Create new prompt modifiers on the fly
 * - Remove selected modifiers
 * 
 * Emits 'modifiers-changed' event with selected modifiers
 */
@customElement('prompt-modifier-chips')
export class PromptModifierChips extends SignalWatcher(LitElement) {
  @property({ type: Array })
  availableFragments: PromptFragment[] = [];

  @property({ type: Array })
  selectedKeys: string[] = [];

  @state()
  private inputValue = '';

  @state()
  private showValueInput = false;

  @state()
  private pendingKey = '';

  @state()
  private valueInputValue = '';

  @state()
  private loadingFragments = false;

  @state()
  private savingFragment = false;

  static override styles = css`
    :host {
      display: block;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chip-container {
      min-height: 48px;
      padding: 8px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
    }

    .input-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .input-container md-filled-text-field {
      flex: 1;
    }

    .help-text {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 4px;
    }

    .available-fragments {
      max-height: 120px;
      overflow-y: auto;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 4px;
      padding: 8px;
      background-color: var(--md-sys-color-surface, #fffbfe);
    }

    .available-fragments:empty::before {
      content: "No fragments available. Type to create new ones.";
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
    }

    .fragment-option {
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
    }

    .fragment-option:hover {
      background-color: var(--md-sys-color-surface-container, #f3f0f4);
    }

    .fragment-option.selected {
      background-color: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .fragment-key {
      font-weight: 500;
    }

    .fragment-value {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 2px;
    }

    .value-input-dialog {
      margin-top: 12px;
      padding: 16px;
      border: 2px solid var(--md-sys-color-primary, #6750a4);
      border-radius: 8px;
      background-color: var(--md-sys-color-primary-container, #eaddff);
    }

    .value-input-title {
      font-weight: 500;
      color: var(--md-sys-color-on-primary-container, #21005d);
      margin-bottom: 8px;
    }

    .value-input-buttons {
      margin-top: 12px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .value-input-buttons md-filled-text-field {
      flex: 1;
      margin-right: 12px;
    }

    .modifiers-label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 8px;
      display: block;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.loadFragments();
  }

  private async loadFragments() {
    this.loadingFragments = true;
    
    try {
      // Check if Firebase is available before trying to load
      const { db } = await import('../firebase/firebase-config');
      if (!db) {
        this.availableFragments = [];
        return;
      }
      
      const loadOperation = loadPromptFragmentsAsync();
      await loadOperation.complete;
      
      if (loadOperation.value?.success) {
        this.availableFragments = loadOperation.value.fragments || [];
      } else {
        // Silently handle errors in non-production environments
        this.availableFragments = [];
      }
    } catch (error) {
      // Silently handle errors and continue with empty fragments list
      this.availableFragments = [];
    } finally {
      this.loadingFragments = false;
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const trimmedValue = input.value.trim();

    if (event.key === 'Enter' && trimmedValue) {
      event.preventDefault();
      this.addFragment(trimmedValue);
      input.value = '';
      this.inputValue = '';
    }
  }

  private addFragment(keyInput: string) {
    // Check if this is an existing fragment key
    const existingFragment = this.availableFragments.find(f => f.key === keyInput);
    
    if (existingFragment) {
      // Add existing fragment if not already selected
      if (!this.selectedKeys.includes(keyInput)) {
        this.selectedKeys = [...this.selectedKeys, keyInput];
        this.emitModifiersChanged();
      }
    } else {
      // For new fragments, show value input dialog
      this.pendingKey = keyInput;
      this.valueInputValue = keyInput; // Pre-populate with key as default
      this.showValueInput = true;
    }
  }

  private async createFragmentWithValue() {
    if (!this.pendingKey || !this.valueInputValue.trim()) return;

    this.savingFragment = true;

    try {
      // Check if Firebase is available before trying to save
      const { db } = await import('../firebase/firebase-config');
      if (!db) {
        // If Firebase not available, create fragment locally only
        const mockFragment = {
          id: Date.now().toString(),
          key: this.pendingKey,
          value: this.valueInputValue.trim()
        };
        
        this.availableFragments = [mockFragment, ...this.availableFragments];
        this.selectedKeys = [...this.selectedKeys, this.pendingKey];
        this.emitModifiersChanged();
        this.cancelValueInput();
        return;
      }

      const saveOperation = savePromptFragmentAsync({
        key: this.pendingKey,
        value: this.valueInputValue.trim()
      });
      
      await saveOperation.complete;
      
      if (saveOperation.value?.success) {
        const savedFragment = saveOperation.value.fragment!;
        
        // Add to available fragments
        this.availableFragments = [savedFragment, ...this.availableFragments];
        
        // Add to selected
        this.selectedKeys = [...this.selectedKeys, this.pendingKey];
        
        // Emit event for external listeners
        this.dispatchEvent(new CustomEvent('fragment-created', {
          detail: { fragment: savedFragment },
          bubbles: true
        }));
        
        this.emitModifiersChanged();
        this.cancelValueInput();
      } else {
        // Handle error - show user feedback
        alert(`Error creating fragment: ${saveOperation.value?.error}`);
      }
    } catch (error) {
      // Create fragment locally as fallback
      const mockFragment = {
        id: Date.now().toString(),
        key: this.pendingKey,
        value: this.valueInputValue.trim()
      };
      
      this.availableFragments = [mockFragment, ...this.availableFragments];
      this.selectedKeys = [...this.selectedKeys, this.pendingKey];
      this.emitModifiersChanged();
      this.cancelValueInput();
    } finally {
      this.savingFragment = false;
    }
  }

  private cancelValueInput() {
    this.showValueInput = false;
    this.pendingKey = '';
    this.valueInputValue = '';
  }

  private removeFragment(key: string) {
    this.selectedKeys = this.selectedKeys.filter(k => k !== key);
    this.emitModifiersChanged();
  }

  private selectExistingFragment(key: string) {
    if (!this.selectedKeys.includes(key)) {
      this.selectedKeys = [...this.selectedKeys, key];
      this.emitModifiersChanged();
    }
  }

  private emitModifiersChanged() {
    // Get the full modifier objects for selected keys
    const selectedModifiers = this.selectedKeys.map(key => 
      this.availableFragments.find(f => f.key === key)
    ).filter(Boolean) as PromptFragment[];

    // Assemble prompt text from selected modifiers
    const assembledPrompt = this.assemblePromptText(selectedModifiers);

    this.dispatchEvent(new CustomEvent('modifiers-changed', {
      detail: { selectedModifiers, assembledPrompt },
      bubbles: true
    }));
  }

  /**
   * Phase 3: Prompt Assembly Logic
   * Combines selected prompt fragments into final prompt text
   */
  private assemblePromptText(fragments: PromptFragment[]): string {
    if (fragments.length === 0) return '';
    
    // Join fragment values with double newlines for clear separation
    return fragments.map(fragment => fragment.value.trim()).join('\n\n');
  }

  /**
   * Public API: Get the currently assembled prompt text
   * This is the text that should be inserted into the query
   */
  public getAssembledPrompt(): string {
    const selectedFragments = this.selectedKeys.map(key => 
      this.availableFragments.find(f => f.key === key)
    ).filter(Boolean) as PromptFragment[];
    
    return this.assemblePromptText(selectedFragments);
  }

  private getAvailableUnselectedFragments(): PromptFragment[] {
    return this.availableFragments.filter(f => !this.selectedKeys.includes(f.key));
  }

  private handleInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.inputValue = input.value;
  }

  private handleValueInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.valueInputValue = input.value;
  }

  private handleValueInputKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.createFragmentWithValue();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelValueInput();
    }
  }

  override render() {
    const selectedFragments = this.selectedKeys.map(key => 
      this.availableFragments.find(f => f.key === key)
    ).filter(Boolean) as PromptFragment[];

    const unselectedFragments = this.getAvailableUnselectedFragments();

    return html`
      <div class="container">
        <div class="help-text">
          ${this.loadingFragments ? 'Loading saved fragments...' : 
            'Select from existing fragments below or create new ones.'}
        </div>

        ${this.showValueInput ? html`
          <div class="value-input-dialog">
            <div class="value-input-title">
              Set prompt fragment text for "${this.pendingKey}":
            </div>
            <md-filled-text-field
              label="Prompt text"
              type="textarea"
              rows="3"
              .value=${this.valueInputValue}
              @input=${this.handleValueInputChange}
              @keydown=${this.handleValueInputKeyDown}
              placeholder="Enter the actual prompt text that will be inserted..."
            ></md-filled-text-field>
            <div class="value-input-buttons">
              <md-text-button @click=${this.cancelValueInput} ?disabled=${this.savingFragment}>
                Cancel
              </md-text-button>
              <md-filled-button @click=${this.createFragmentWithValue} ?disabled=${this.savingFragment}>
                ${this.savingFragment ? 'Creating...' : 'Create Prompt Fragment'}
              </md-filled-button>
            </div>
          </div>
        ` : ''}

        ${unselectedFragments.length > 0 ? html`
          <div class="available-fragments">
            ${repeat(
              unselectedFragments,
              (fragment) => fragment.key,
              (fragment) => html`
                <div 
                  class="fragment-option"
                  @click=${() => this.selectExistingFragment(fragment.key)}
                >
                  <div class="fragment-key">${fragment.key}</div>
                  <div class="fragment-value">${fragment.value}</div>
                </div>
              `
            )}
          </div>
        ` : ''}

        <div class="modifiers-section">
          <label class="modifiers-label">Additional Prompt Fragment Needed?</label>
            <div class="input-container">
              <md-filled-text-field
                label="Add short key-name"
                .value=${this.inputValue}
                @input=${this.handleInputChange}
                @keydown=${this.handleKeyDown}
                placeholder="Type short name like 'be-concise', 'explain-simple'..."
              ></md-filled-text-field>
            </div>
        </div>
        <div class="chip-container">
          <md-chip-set>
            ${repeat(
              selectedFragments,
              (fragment) => fragment.key,
              (fragment) => html`
                <md-input-chip
                  label=${fragment.key}
                  @remove=${() => this.removeFragment(fragment.key)}
                >
                </md-input-chip>
              `
            )}
          </md-chip-set>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'prompt-modifier-chips': PromptModifierChips;
  }
}