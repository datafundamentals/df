import {SignalWatcher} from '@lit-labs/signals';
import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {
  disableSegments,
  resetSegments,
  segmentedButtonState,
  selectSegment,
  setOptions,
} from '@df/state';
import type {SegmentedButtonOption} from '@df/types';

@customElement('df-segmented-button')
export class DfSegmentedButton extends SignalWatcher(LitElement) {
  static override styles = css`
    :host {
      display: inline-flex;
      font-family: var(--df-font-family, 'Roboto', sans-serif);
    }

    .group {
      display: inline-flex;
      border: 1px solid var(--df-segmented-outline-color, #c6c6c6);
      border-radius: 9999px;
      overflow: hidden;
      background: var(--df-segmented-surface-color, #ffffff);
    }

    button {
      border: none;
      background: transparent;
      padding: 6px 16px;
      font: inherit;
      cursor: pointer;
      color: var(--df-segmented-text-color, #1f1f1f);
      transition: background-color 120ms ease, color 120ms ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
    }

    button:not(:last-of-type) {
      border-right: 1px solid var(--df-segmented-outline-color, #c6c6c6);
    }

    button[aria-pressed='true'] {
      background: var(--df-segmented-primary-color, #1d4ed8);
      color: var(--df-segmented-primary-text-color, #ffffff);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  `;

  set options(value: SegmentedButtonOption[] | null | undefined) {
    if (!value || value.length === 0) {
      resetSegments();
      return;
    }
    setOptions(value);
  }

  get options(): SegmentedButtonOption[] {
    return segmentedButtonState.get().options;
  }

  set disabled(ids: string[] | null | undefined) {
    disableSegments(ids ?? []);
  }

  get disabled(): string[] {
    return segmentedButtonState.get().disabledIds ?? [];
  }

  set selected(id: string | null | undefined) {
    if (typeof id === 'string' && id.length > 0) {
      selectSegment(id);
      return;
    }
    const fallback = this.options[0]?.id;
    if (fallback) {
      selectSegment(fallback);
    }
  }

  get selected(): string | null | undefined {
    return segmentedButtonState.get().selectedId ?? null;
  }

  override render() {
    const {options, selectedId, disabledIds = []} = segmentedButtonState.get();

    return html`
      <div class="group" role="group" aria-label="Segmented control">
        ${options.map((option) => {
          const isSelected = option.id === selectedId;
          const isDisabled = disabledIds.includes(option.id);
          return html`
            <button
              type="button"
              aria-pressed=${String(isSelected)}
              ?disabled=${isDisabled}
              @click=${() => this.handleSelect(option.id)}
            >
              ${option.label}
            </button>
          `;
        })}
      </div>
    `;
  }

  private handleSelect(id: string) {
    selectSegment(id);
    this.dispatchEvent(
      new CustomEvent('df-segmented-button-change', {
        detail: {id},
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'df-segmented-button': DfSegmentedButton;
  }
}
