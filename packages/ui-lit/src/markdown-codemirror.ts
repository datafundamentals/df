import {SignalWatcher} from '@lit-labs/signals';
import {css, html, LitElement, nothing} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {
  markdownCodemirrorState,
  registerMarkdownEditor,
  setMarkdownFocus,
  setMarkdownPlaceholder,
  setMarkdownPreview,
  setMarkdownReadOnly,
  setMarkdownSelection,
  setMarkdownTheme,
  setMarkdownValue,
} from '@df/state';
import type {
  MarkdownCodemirrorChangeDetail,
  MarkdownCodemirrorConfig,
  MarkdownCodemirrorFocusDetail,
  MarkdownCodemirrorTheme,
} from '@df/types';

const DEFAULT_LABEL = 'Markdown';

@customElement('df-markdown-codemirror')
export class DfMarkdownCodemirror extends SignalWatcher(LitElement) {
  @property({type: String}) declare editorId: string;
  @property({type: String}) declare placeholder: string;
  @property({type: String}) declare theme: MarkdownCodemirrorTheme;
  @property({type: Boolean}) declare readOnly: boolean;
  @property({type: Boolean}) declare showPreview: boolean;
  @property({type: String}) declare initialValue: string;
  @property({type: String}) declare label: string;

  @query('.editor__textarea') private textareaElement?: HTMLTextAreaElement;
  @query('.editor__gutter') private gutterElement?: HTMLDivElement;

  constructor() {
    super();
    this.editorId = 'default';
    this.placeholder = 'Start writing Markdown...';
    this.theme = 'light';
    this.readOnly = false;
    this.showPreview = true;
    this.initialValue = '';
    this.label = DEFAULT_LABEL;
  }

  static override styles = css`
    :host {
      display: block;
      color: var(--df-markdown-foreground, #0f172a);
      font-family: var(--df-font-family, 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
    }

    .editor {
      border: 1px solid var(--df-markdown-border, #cbd5f5);
      border-radius: 12px;
      background: var(--df-markdown-surface, #ffffff);
      display: flex;
      flex-direction: column;
      box-shadow: var(--df-markdown-shadow, 0 16px 40px rgba(15, 23, 42, 0.08));
      overflow: hidden;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }

    .editor.is-focused {
      border-color: var(--df-markdown-primary, #2563eb);
      box-shadow:
        0 0 0 2px rgba(37, 99, 235, 0.16),
        var(--df-markdown-shadow, 0 16px 40px rgba(15, 23, 42, 0.08));
    }

    .editor.editor--dark {
      background: var(--df-markdown-surface-dark, #0f172a);
      border-color: var(--df-markdown-border-dark, #1e293b);
      color: var(--df-markdown-foreground-dark, #e2e8f0);
      box-shadow: 0 16px 40px rgba(2, 6, 23, 0.45);
    }

    .editor__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--df-markdown-header, #f8fafc);
      border-bottom: 1px solid var(--df-markdown-border, #cbd5f5);
      gap: 16px;
    }

    .editor.editor--dark .editor__header {
      background: var(--df-markdown-header-dark, #13213d);
      border-bottom-color: var(--df-markdown-border-dark, #1e293b);
    }

    .editor__label {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .editor__status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--df-markdown-muted, #475569);
    }

    .editor.editor--dark .editor__status {
      color: var(--df-markdown-muted-dark, #94a3b8);
    }

    .editor__stats {
      display: inline-flex;
      gap: 16px;
      align-items: center;
      font-size: 12px;
      color: var(--df-markdown-muted, #475569);
    }

    .editor.editor--dark .editor__stats {
      color: var(--df-markdown-muted-dark, #94a3b8);
    }

    .editor__toggle {
      border: 1px solid var(--df-markdown-border, #cbd5f5);
      background: transparent;
      color: inherit;
      border-radius: 8px;
      padding: 4px 12px;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
    }

    .editor__toggle:hover {
      background: rgba(59, 130, 246, 0.08);
      border-color: var(--df-markdown-primary, #2563eb);
    }

    .editor__toggle[aria-pressed='true'] {
      background: var(--df-markdown-primary, #2563eb);
      color: #ffffff;
      border-color: var(--df-markdown-primary, #2563eb);
    }

    .editor.editor--dark .editor__toggle:hover {
      background: rgba(148, 163, 184, 0.12);
      border-color: rgba(148, 163, 184, 0.5);
    }

    .editor.editor--dark .editor__toggle[aria-pressed='true'] {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .editor__body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      min-height: 320px;
    }

    .editor__body.editor__body--single {
      grid-template-columns: minmax(0, 1fr);
    }

    .editor__pane {
      display: grid;
      grid-template-columns: auto 1fr;
      min-height: 320px;
      position: relative;
    }

    .editor__gutter {
      background: var(--df-markdown-gutter, #f1f5f9);
      color: var(--df-markdown-gutter-text, #64748b);
      padding: 16px 12px;
      text-align: right;
      font-family: var(--df-code-font, 'Fira Code', 'SFMono-Regular', Consolas, monospace);
      font-size: 12px;
      line-height: 1.5;
      user-select: none;
      overflow: hidden;
    }

    .editor.editor--dark .editor__gutter {
      background: var(--df-markdown-gutter-dark, #111f3b);
      color: var(--df-markdown-gutter-text-dark, #7c8db2);
    }

    .editor__line-number {
      display: block;
      padding-right: 6px;
    }

    .editor__textarea {
      border: none;
      outline: none;
      resize: none;
      width: 100%;
      padding: 16px;
      min-height: 320px;
      font-family: var(--df-code-font, 'Fira Code', 'SFMono-Regular', Consolas, monospace);
      font-size: 14px;
      line-height: 1.5;
      background: var(--df-markdown-editor-bg, #ffffff);
      color: var(--df-markdown-editor-fg, #0f172a);
      caret-color: var(--df-markdown-primary, #2563eb);
      tab-size: 2;
    }

    .editor.editor--dark .editor__textarea {
      background: var(--df-markdown-editor-bg-dark, #101a33);
      color: var(--df-markdown-editor-fg-dark, #e2e8f0);
      caret-color: #3b82f6;
    }

    .editor__textarea::placeholder {
      color: var(--df-markdown-placeholder, #94a3b8);
    }

    .editor__textarea[readonly] {
      background: var(--df-markdown-editor-readonly, #f8fafc);
      color: var(--df-markdown-editor-fg, #0f172a);
      cursor: not-allowed;
    }

    .editor.editor--dark .editor__textarea[readonly] {
      background: rgba(15, 23, 42, 0.5);
    }

    .editor__preview {
      padding: 16px 20px;
      border-left: 1px solid var(--df-markdown-border, #cbd5f5);
      background: var(--df-markdown-preview-bg, #f8fafc);
      color: inherit;
      overflow-y: auto;
    }

    .editor.editor--dark .editor__preview {
      background: var(--df-markdown-preview-bg-dark, #101a33);
      border-left-color: var(--df-markdown-border-dark, #1e293b);
    }

    .editor__preview :is(h1, h2, h3, h4, h5, h6) {
      margin: 16px 0 8px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .editor__preview p {
      margin: 8px 0;
      line-height: 1.6;
    }

    .editor__preview pre {
      background: rgba(15, 23, 42, 0.08);
      padding: 12px 16px;
      border-radius: 10px;
      overflow-x: auto;
      font-family: var(--df-code-font, 'Fira Code', 'SFMono-Regular', Consolas, monospace);
      font-size: 13px;
    }

    .editor.editor--dark .editor__preview pre {
      background: rgba(148, 163, 184, 0.16);
    }

    .editor__preview code {
      font-family: var(--df-code-font, 'Fira Code', 'SFMono-Regular', Consolas, monospace);
      background: rgba(148, 163, 184, 0.18);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 12px;
    }

    .editor.editor--dark .editor__preview code {
      background: rgba(148, 163, 184, 0.22);
    }

    .editor__preview ul {
      margin: 8px 0 8px 20px;
      padding: 0;
      list-style-type: disc;
    }

    .editor__preview-empty {
      margin: 0;
      color: var(--df-markdown-muted, #64748b);
      font-style: italic;
    }

    .editor.editor--dark .editor__preview-empty {
      color: var(--df-markdown-muted-dark, #94a3b8);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    registerMarkdownEditor({
      id: this.editorId,
      initialValue: this.initialValue,
      placeholder: this.placeholder,
      theme: this.theme,
      readOnly: this.readOnly,
      showPreview: this.showPreview,
    });
    this.applyInitialValue();
    this.syncDerivedState();
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const editorChanged = changed.has('editorId');
    if (editorChanged) {
      registerMarkdownEditor({
        id: this.editorId,
        initialValue: this.initialValue,
        placeholder: this.placeholder,
        theme: this.theme,
        readOnly: this.readOnly,
        showPreview: this.showPreview,
      });
    }

    if (editorChanged || changed.has('placeholder')) {
      setMarkdownPlaceholder(this.editorId, this.placeholder);
    }

    if (editorChanged || changed.has('theme')) {
      setMarkdownTheme(this.editorId, this.theme);
    }

    if (editorChanged || changed.has('readOnly')) {
      setMarkdownReadOnly(this.editorId, this.readOnly);
    }

    if (editorChanged || changed.has('showPreview')) {
      setMarkdownPreview(this.editorId, this.showPreview);
    }

    if (editorChanged || changed.has('initialValue')) {
      this.applyInitialValue();
    }
  }

  override updated(): void {
    this.syncScrollPositions();
  }

  override render() {
    const state = markdownCodemirrorState(this.editorId).get();
    const lineNumbers = Array.from({length: state.lineCount}, (_, index) => index + 1);
    const wrapperClass = this.composeWrapperClass(state);

    return html`
      <div class=${wrapperClass} role="group" aria-label="Markdown editor">
        <header class="editor__header">
          <div>
            <div class="editor__label">${this.label}</div>
            <div class="editor__status">
              ${state.hasFocus ? 'Editing' : 'Idle'}
            </div>
          </div>
          <div class="editor__stats">
            <span>${state.wordCount} words</span>
            <span>${state.charCount} characters</span>
            <button
              type="button"
              class="editor__toggle"
              aria-pressed=${state.showPreview}
              @click=${this.handleTogglePreview}
            >
              Preview
            </button>
          </div>
        </header>

        <div class=${this.composeBodyClass(state)}>
          <div class="editor__pane">
            <div class="editor__gutter" aria-hidden="true">
              ${lineNumbers.map((line) => html`<span class="editor__line-number">${line}</span>`)}
            </div>
            <textarea
              class="editor__textarea"
              .value=${state.value}
              placeholder=${state.placeholder}
              ?readonly=${state.readOnly}
              spellcheck="true"
              @input=${this.handleInput}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
              @select=${this.handleSelection}
              @keydown=${this.handleKeydown}
              @scroll=${this.handleScroll}
              aria-multiline="true"
            ></textarea>
          </div>
          ${state.showPreview
            ? html`<div class="editor__preview" aria-live="polite">
                ${state.value
                  ? unsafeHTML(state.previewHtml)
                  : html`<p class="editor__preview-empty">Live preview appears here as you type.</p>`}
              </div>`
            : nothing}
        </div>
      </div>
    `;
  }

  private handleInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const state = markdownCodemirrorState(this.editorId).get();
    if (state.readOnly) {
      return;
    }
    setMarkdownValue(this.editorId, textarea.value);
    this.syncSelectionFromTextarea(textarea);
    this.dispatchChangeEvent();
  }

  private handleFocus() {
    setMarkdownFocus(this.editorId, true);
    this.dispatchFocusEvent(true);
  }

  private handleBlur() {
    setMarkdownFocus(this.editorId, false);
    this.dispatchFocusEvent(false);
  }

  private handleSelection(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.syncSelectionFromTextarea(textarea);
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') {
      return;
    }

    const state = markdownCodemirrorState(this.editorId).get();
    if (state.readOnly) {
      return;
    }

    const textarea = event.target as HTMLTextAreaElement;
    event.preventDefault();

    const value = textarea.value;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const insertion = '  ';
    const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;

    setMarkdownValue(this.editorId, nextValue);
    const position = start + insertion.length;
    requestAnimationFrame(() => {
      textarea.selectionStart = position;
      textarea.selectionEnd = position;
      this.syncSelectionFromTextarea(textarea);
    });
    this.dispatchChangeEvent();
  }

  private handleScroll(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    if (!this.gutterElement) {
      return;
    }
    this.gutterElement.scrollTop = textarea.scrollTop;
  }

  private handleTogglePreview() {
    const state = markdownCodemirrorState(this.editorId).get();
    setMarkdownPreview(this.editorId, !state.showPreview);
  }

  private syncSelectionFromTextarea(textarea: HTMLTextAreaElement) {
    setMarkdownSelection(this.editorId, {
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? 0,
    });
  }

  private syncScrollPositions() {
    if (!this.textareaElement || !this.gutterElement) {
      return;
    }
    this.gutterElement.scrollTop = this.textareaElement.scrollTop;
  }

  private composeWrapperClass(state: MarkdownCodemirrorConfig): string {
    const classes = ['editor'];
    if (state.theme === 'dark') {
      classes.push('editor--dark');
    }
    if (state.hasFocus) {
      classes.push('is-focused');
    }
    if (state.readOnly) {
      classes.push('is-readonly');
    }
    return classes.join(' ');
  }

  private composeBodyClass(state: MarkdownCodemirrorConfig): string {
    const classes = ['editor__body'];
    if (!state.showPreview) {
      classes.push('editor__body--single');
    }
    return classes.join(' ');
  }

  private dispatchChangeEvent() {
    const state = markdownCodemirrorState(this.editorId).get();
    const detail: MarkdownCodemirrorChangeDetail = {
      id: state.id,
      value: state.value,
      charCount: state.charCount,
      wordCount: state.wordCount,
    };
    this.dispatchEvent(
      new CustomEvent<MarkdownCodemirrorChangeDetail>('df-markdown-codemirror-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private dispatchFocusEvent(hasFocus: boolean) {
    const detail: MarkdownCodemirrorFocusDetail = {
      id: this.editorId,
      hasFocus,
    };
    this.dispatchEvent(
      new CustomEvent<MarkdownCodemirrorFocusDetail>('df-markdown-codemirror-focus', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private applyInitialValue() {
    if (!this.initialValue) {
      return;
    }
    const state = markdownCodemirrorState(this.editorId).get();
    if (state.value !== '') {
      return;
    }
    setMarkdownValue(this.editorId, this.initialValue);
    setMarkdownSelection(this.editorId, {
      start: this.initialValue.length,
      end: this.initialValue.length,
    });
  }

  private syncDerivedState() {
    setMarkdownPlaceholder(this.editorId, this.placeholder);
    setMarkdownTheme(this.editorId, this.theme);
    setMarkdownReadOnly(this.editorId, this.readOnly);
    setMarkdownPreview(this.editorId, this.showPreview);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'df-markdown-codemirror': DfMarkdownCodemirror;
  }
}
