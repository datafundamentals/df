export type WrongMarkdownCodemirrorTheme = 'light' | 'dark';

export interface WrongMarkdownCodemirrorSelection {
  start: number;
  end: number;
}

export interface WrongMarkdownCodemirrorConfig {
  id: string;
  value: string;
  placeholder: string;
  theme: WrongMarkdownCodemirrorTheme;
  readOnly: boolean;
  hasFocus: boolean;
  selection: WrongMarkdownCodemirrorSelection;
  lineCount: number;
  charCount: number;
  wordCount: number;
  previewHtml: string;
  showPreview: boolean;
}

export interface WrongMarkdownCodemirrorInitOptions {
  id: string;
  initialValue?: string;
  placeholder?: string;
  theme?: WrongMarkdownCodemirrorTheme;
  readOnly?: boolean;
  showPreview?: boolean;
}

export interface WrongMarkdownCodemirrorChangeDetail {
  id: string;
  value: string;
  charCount: number;
  wordCount: number;
}

export interface WrongMarkdownCodemirrorFocusDetail {
  id: string;
  hasFocus: boolean;
}
