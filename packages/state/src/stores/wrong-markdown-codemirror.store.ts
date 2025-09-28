import {computed, signal} from '@lit-labs/signals';
import type {
  WrongMarkdownCodemirrorConfig,
  WrongMarkdownCodemirrorInitOptions,
  WrongMarkdownCodemirrorSelection,
  WrongMarkdownCodemirrorTheme,
} from '@df/types';
import {
  clampSelectionIndexes,
  computeLineCount,
  countMarkdownWords,
  renderMarkdownToHtml,
} from '@df/utils';

const DEFAULT_ID = 'default';
const DEFAULT_PLACEHOLDER = 'Start writing Markdown...';

const editors = new Map<string, ReturnType<typeof createEditorSignals>>();
const editorStates = new Map<string, ReturnType<typeof createComputedState>>();

export function registerMarkdownEditor(options: WrongMarkdownCodemirrorInitOptions): void {
  const id = options.id || DEFAULT_ID;
  const editor = ensureEditor(id, options);
  if (options.initialValue !== undefined && editor.value.get() === '') {
    editor.value.set(options.initialValue);
  }
  if (options.placeholder !== undefined) {
    editor.placeholder.set(options.placeholder);
  }
  if (options.theme !== undefined) {
    editor.theme.set(options.theme);
  }
  if (options.readOnly !== undefined) {
    editor.readOnly.set(options.readOnly);
  }
  if (options.showPreview !== undefined) {
    editor.showPreview.set(options.showPreview);
  }
}

export function markdownCodemirrorState(id = DEFAULT_ID): ReturnType<typeof createComputedState> {
  ensureEditor(id);
  return ensureComputedState(id);
}

export function setMarkdownValue(id = DEFAULT_ID, value: string): void {
  const editor = ensureEditor(id);
  editor.value.set(value);
}

export function setMarkdownPlaceholder(id = DEFAULT_ID, placeholder: string): void {
  const editor = ensureEditor(id);
  editor.placeholder.set(placeholder);
}

export function setMarkdownTheme(id = DEFAULT_ID, theme: WrongMarkdownCodemirrorTheme): void {
  const editor = ensureEditor(id);
  editor.theme.set(theme);
}

export function setMarkdownReadOnly(id = DEFAULT_ID, readOnly: boolean): void {
  const editor = ensureEditor(id);
  editor.readOnly.set(readOnly);
}

export function setMarkdownSelection(id = DEFAULT_ID, selection: WrongMarkdownCodemirrorSelection): void {
  const editor = ensureEditor(id);
  const normalized = clampSelectionIndexes(
    selection.start,
    selection.end,
    editor.value.get().length,
  );
  editor.selection.set(normalized);
}

export function setMarkdownFocus(id = DEFAULT_ID, hasFocus: boolean): void {
  const editor = ensureEditor(id);
  editor.hasFocus.set(hasFocus);
}

export function setMarkdownPreview(id = DEFAULT_ID, showPreview: boolean): void {
  const editor = ensureEditor(id);
  editor.showPreview.set(showPreview);
}

export function resetMarkdownEditor(id = DEFAULT_ID): void {
  const editor = ensureEditor(id);
  editor.value.set('');
  editor.placeholder.set(DEFAULT_PLACEHOLDER);
  editor.theme.set('light');
  editor.readOnly.set(false);
  editor.hasFocus.set(false);
  editor.selection.set({start: 0, end: 0});
  editor.showPreview.set(true);
}

function ensureEditor(id: string, options?: Partial<WrongMarkdownCodemirrorInitOptions>) {
  const existing = editors.get(id);
  if (existing) {
    return existing;
  }

  const editorSignals = createEditorSignals(id, options);
  editors.set(id, editorSignals);
  return editorSignals;
}

function createEditorSignals(id: string, options?: Partial<WrongMarkdownCodemirrorInitOptions>) {
  return {
    id,
    value: signal(options?.initialValue ?? ''),
    placeholder: signal(options?.placeholder ?? DEFAULT_PLACEHOLDER),
    theme: signal<WrongMarkdownCodemirrorTheme>(options?.theme ?? 'light'),
    readOnly: signal(options?.readOnly ?? false),
    hasFocus: signal(false),
    selection: signal<WrongMarkdownCodemirrorSelection>({start: 0, end: 0}),
    showPreview: signal(options?.showPreview ?? true),
  };
}

function ensureComputedState(id: string) {
  let state = editorStates.get(id);
  if (!state) {
    state = createComputedState(id);
    editorStates.set(id, state);
  }
  return state;
}

function createComputedState(id: string) {
  return computed<WrongMarkdownCodemirrorConfig>(() => {
    const editor = ensureEditor(id);
    const value = editor.value.get();
    return {
      id,
      value,
      placeholder: editor.placeholder.get(),
      theme: editor.theme.get(),
      readOnly: editor.readOnly.get(),
      hasFocus: editor.hasFocus.get(),
      selection: editor.selection.get(),
      lineCount: computeLineCount(value),
      charCount: value.length,
      wordCount: countMarkdownWords(value),
      previewHtml: renderMarkdownToHtml(value),
      showPreview: editor.showPreview.get(),
    } satisfies WrongMarkdownCodemirrorConfig;
  });
}
