import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A specialized slider for controlling context retrieval in RAG queries.
 * Features tooltip explanations and Material Design 3 theming.
 */
@customElement('context-slider')
export class ContextSlider extends LitElement {
  @property({ type: Number })
  value: number = 0;

  @property({ type: Number })
  min: number = -10;

  @property({ type: Number })
  max: number = 50;

  static override styles = css`
    :host {
      display: block;
    }

    .minimal-slider-container {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slider-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 8px;
      background-color: var(--md-sys-color-inverse-surface, #322f35);
      color: var(--md-sys-color-inverse-on-surface, #f4eff4);
      padding: 8px 12px;
      border-radius: 8px;
      font-family: var(--md-sys-typescale-body-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-small-size, 12px);
      white-space: nowrap;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      box-shadow: var(--md-sys-elevation-level2, 0px 2px 6px 2px rgba(0, 0, 0, 0.15));
    }

    .slider-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: var(--md-sys-color-inverse-surface, #322f35);
    }

    .minimal-slider-container:hover .slider-tooltip {
      opacity: 1;
    }

    .slider-input {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--md-sys-color-outline-variant, #c7c5d0);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    }

    .slider-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3));
    }

    .slider-input::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      border: none;
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3));
    }

    .slider-input::-webkit-slider-track {
      width: 100%;
      height: 6px;
      cursor: pointer;
      background: var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 3px;
    }

    .slider-input::-moz-range-track {
      width: 100%;
      height: 6px;
      cursor: pointer;
      background: var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 3px;
      border: none;
    }
  `;

  private getSliderExplanation(value: number): string {
    if (value <= -8) {
      return "No retrieved context (empty results)";
    } else if (value >= -7 && value <= -4) {
      return "Strong matches only (highest relevance)";
    } else if (value >= -3 && value <= -1) {
      return "Strong + Good matches (high relevance)";
    } else if (value === 0) {
      return "Strong + Good + Weak matches (all relevant)";
    } else {
      return `Strong + Good + Weak + ${value} Poor matches (comprehensive)`;
    }
  }

  private handleSliderChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = parseInt(input.value);
    
    // Dispatch custom event for parent component to listen to
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { value: this.value },
      bubbles: true
    }));
  }

  override render() {
    return html`
      <div class="minimal-slider-container">
        <div class="slider-tooltip">
          ${this.getSliderExplanation(this.value)}
        </div>
        <input 
          type="range" 
          class="slider-input"
          min="${this.min}" 
          max="${this.max}" 
          .value=${this.value.toString()}
          @input=${this.handleSliderChange}>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'context-slider': ContextSlider;
  }
}