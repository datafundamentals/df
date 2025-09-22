export type MarkdownCodemirrorTheme = 'light' | 'dark';

export interface MarkdownCodemirrorSelection {
  start: number;
  end: number;
}

export interface MarkdownCodemirrorConfig {
  id: string;
  value: string;
  placeholder: string;
  theme: MarkdownCodemirrorTheme;
  readOnly: boolean;
  hasFocus: boolean;
  selection: MarkdownCodemirrorSelection;
  lineCount: number;
  charCount: number;
  wordCount: number;
  previewHtml: string;
  showPreview: boolean;
}

export interface MarkdownCodemirrorInitOptions {
  id: string;
  initialValue?: string;
  placeholder?: string;
  theme?: MarkdownCodemirrorTheme;
  readOnly?: boolean;
  showPreview?: boolean;
}

export interface MarkdownCodemirrorChangeDetail {
  id: string;
  value: string;
  charCount: number;
  wordCount: number;
}

export interface MarkdownCodemirrorFocusDetail {
  id: string;
  hasFocus: boolean;
}
