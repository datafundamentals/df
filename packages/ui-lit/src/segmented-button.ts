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
      display: block;
      font-family: 'Roboto', sans-serif;
    }

    .group {
      display: flex;
      border: 1px solid var(--md-sys-color-outline, #c6c6c6);
      border-radius: 12px;
      overflow: hidden;
    }

    button {
      flex: 1;
      padding: 2px 8px;
      text-align: center;
      cursor: pointer;
      background-color: var(--md-sys-color-surface, #ffffff);
      color: var(--md-sys-color-on-surface, #000000);
      border: none;
      outline: none;
      font-size: 14px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    button[aria-pressed='true'] {
      background-color: var(--md-sys-color-primary, #6200ea);
      color: var(--md-sys-color-on-primary, #ffffff);
    }

    button:not([aria-pressed='true']):hover {
      background-color: var(--md-sys-color-surface-variant, #f5f5f5);
    }

    button:not(:last-child) {
      border-right: 1px solid var(--md-sys-color-outline, #c6c6c6);
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
