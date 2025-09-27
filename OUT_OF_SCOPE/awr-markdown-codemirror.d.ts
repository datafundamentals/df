import { LitElement } from 'lit';
import { EditorView } from '@codemirror/view';
import '@material/web/button/filled-tonal-button.js';
export declare class AwrMarkdownCodeMirror extends LitElement {
    markdownContent: string;
    private tokenCount;
    private lastCalculatedContent;
    private isContentChanged;
    listener: never;
    editorView: EditorView | null;
    static styles: import("lit").CSSResult;
    firstUpdated(): void;
    private handleMarkdownBlur;
    private calculateTokenCount;
    private renderMarkdown;
    private getTokenCountStatus;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=awr-markdown-codemirror.d.ts.map