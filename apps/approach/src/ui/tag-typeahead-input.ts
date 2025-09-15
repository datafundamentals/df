import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { createTagSearchComputed, tagListRefreshTrigger } from '../stores/tags';
import { createCategorySearchComputed } from '../stores/categories';
import { createConceptSearchComputed } from '../stores/ontology';

@customElement('tag-typeahead-input')
export class TagTypeaheadInput extends SignalWatcher(LitElement) {
  @property() label = 'Tags';
  @property() value = '';
  @property() placeholder = 'Enter tags...';
  @property() collectionType: 'tags' | 'categories' | 'ontology' = 'tags';
  
  @state() private isDropdownOpen = false;
  @state() private suggestions: string[] = [];
  @state() private selectedIndex = -1;
  @state() private searchPrefix = '';
  
  private searchComputed: any = null;
  private searchCache = new Map<string, string[]>();

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    .input-container {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .input-field {
      width: 100%;
      padding: 16px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 4px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      background-color: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      outline: none;
      transition: border-color 0.2s ease;
    }

    .input-field:focus {
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 15px; /* Adjust to maintain same visual size */
    }

    .input-label {
      position: absolute;
      left: 16px;
      top: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background-color: var(--md-sys-color-surface, #fffbfe);
      padding: 0 4px;
      pointer-events: none;
      transition: all 0.2s ease;
      transform-origin: left center;
    }

    .input-field:focus + .input-label,
    .input-field:not(:placeholder-shown) + .input-label {
      top: -8px;
      font-size: 12px;
      color: var(--md-sys-color-primary, #6750a4);
      transform: scale(0.9);
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background-color: var(--md-sys-color-surface, #fffbfe);
      border: 2px solid var(--md-sys-color-primary, #6750a4);
      border-radius: 12px;
      box-shadow: var(--md-sys-elevation-level3, 0 4px 8px rgba(0,0,0,0.15));
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      margin-top: 4px;
    }

    .dropdown.open {
      display: block;
      animation: dropdownFadeIn 0.15s ease-out;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .suggestion-item {
      padding: 14px 16px;
      cursor: pointer;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 500);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      transition: all 0.2s ease;
      position: relative;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-item:hover {
      background-color: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .suggestion-item.selected {
      background-color: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
    }

    .suggestion-item:first-child {
      border-radius: 10px 10px 0 0;
    }

    .suggestion-item:last-child {
      border-radius: 0 0 10px 10px;
    }

    .suggestion-item:first-child:last-child {
      border-radius: 10px;
    }

    .no-suggestions {
      padding: 14px 16px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-small-size, 12px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
      text-align: center;
    }

    .first-suggestion {
      position: relative;
    }

    .tab-hint {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background-color: var(--md-sys-color-tertiary-container, #ffd8e4);
      color: var(--md-sys-color-on-tertiary-container, #31111d);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('blur', this.handleBlur);
    document.addEventListener('click', this.handleDocumentClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const newValue = input.value;
    this.value = newValue;
    
    // Extract the current word being typed (after last comma)
    const lastCommaIndex = newValue.lastIndexOf(',');
    const currentWord = newValue.substring(lastCommaIndex + 1).trim();
    
    this.searchPrefix = currentWord;
    this.selectedIndex = -1;
    
    if (currentWord.length > 0) {
      this.isDropdownOpen = true; // Open dropdown immediately
      this.updateSuggestions(currentWord);
    } else {
      this.suggestions = [];
      this.isDropdownOpen = false;
    }
    
    this.dispatchChangeEvent();
  };

  private async updateSuggestions(prefix: string) {
    // Check cache first
    if (this.searchCache.has(prefix)) {
      this.suggestions = this.searchCache.get(prefix) || [];
      return;
    }
    
    // Create new search computed
    this.searchComputed = this.getSearchFunction(prefix);
    
    try {
      // Wait for the AsyncComputed to complete, then access value
      await this.searchComputed.complete;
      const results = this.searchComputed.value;
      if (results && Array.isArray(results)) {
        this.suggestions = results;
        // Cache the results
        this.searchCache.set(prefix, results);
        this.requestUpdate();
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      this.suggestions = [];
    }
  }


  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isDropdownOpen && e.key !== 'Tab') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (this.suggestions.length > 0) {
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.suggestions.length > 0) {
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0 && this.suggestions.length > 0) {
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        }
        break;
      case 'Tab':
        // Tab completion: complete with first suggestion if available
        if (this.isDropdownOpen && this.suggestions.length > 0) {
          e.preventDefault();
          this.selectSuggestion(this.suggestions[0]);
        }
        break;
      case 'Escape':
        this.isDropdownOpen = false;
        this.selectedIndex = -1;
        break;
    }
  };

  private selectSuggestion(suggestion: string) {
    const lastCommaIndex = this.value.lastIndexOf(',');
    const beforeCurrentWord = lastCommaIndex >= 0 ? this.value.substring(0, lastCommaIndex + 1) + ' ' : '';
    this.value = beforeCurrentWord + suggestion;
    
    this.isDropdownOpen = false;
    this.selectedIndex = -1;
    this.searchPrefix = '';
    
    // Focus back to input
    const input = this.shadowRoot?.querySelector('.input-field') as HTMLInputElement;
    if (input) {
      input.focus();
      // Move cursor to end
      setTimeout(() => {
        input.setSelectionRange(input.value.length, input.value.length);
      }, 0);
    }
    
    this.dispatchChangeEvent();
  }

  private handleSuggestionClick = (suggestion: string) => {
    this.selectSuggestion(suggestion);
  };

  private handleBlur = () => {
    // Delay closing to allow for click events on suggestions
    setTimeout(() => {
      this.isDropdownOpen = false;
      this.selectedIndex = -1;
    }, 150);
  };

  private handleDocumentClick = (e: Event) => {
    if (!this.contains(e.target as Node)) {
      this.isDropdownOpen = false;
      this.selectedIndex = -1;
    }
  };

  private dispatchChangeEvent() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this.value },
      bubbles: true
    }));
  }

  private getSearchFunction(prefix: string) {
    switch (this.collectionType) {
      case 'categories':
        return createCategorySearchComputed(prefix);
      case 'ontology':
        return createConceptSearchComputed(prefix);
      case 'tags':
      default:
        return createTagSearchComputed(prefix);
    }
  }

  override render() {
    // Watch for tag list refresh trigger and clear cache when it changes
    const refreshTrigger = tagListRefreshTrigger.get();
    if (refreshTrigger > 0) {
      this.searchCache.clear();
    }
    
    return html`
      <div class="input-container">
        <input
          class="input-field"
          type="text"
          .value=${this.value}
          placeholder=" "
          @input=${this.handleInput}
          @keydown=${this.handleKeyDown}
          @focus=${() => this.isDropdownOpen = this.searchPrefix.length > 0}
        />
        <label class="input-label">${this.label}</label>
        
        <div class="dropdown ${this.isDropdownOpen ? 'open' : ''}">
          ${this.suggestions.length > 0
            ? this.suggestions.map((suggestion, index) => html`
                <div 
                  class="suggestion-item ${index === this.selectedIndex ? 'selected' : ''} ${index === 0 ? 'first-suggestion' : ''}"
                  @click=${() => this.handleSuggestionClick(suggestion)}
                >
                  ${suggestion}
                  ${index === 0 ? html`<span class="tab-hint">Tab</span>` : ''}
                </div>
              `)
            : this.searchPrefix.length > 0
              ? html`<div class="no-suggestions">No existing ${this.collectionType} found</div>`
              : ''
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tag-typeahead-input': TagTypeaheadInput;
  }
}