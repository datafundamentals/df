import { LitElement } from 'lit';
import '@material/web/progress/circular-progress.js';
import '@material/web/textfield/outlined-text-field.js';
import './awr-sgmtd-button';
import { ResourcePageType, UrlMediaType } from '../types';
declare const AwrUploadLink_base: typeof LitElement;
export declare class AwrUploadLink extends AwrUploadLink_base {
    resourceLinkType: UrlMediaType;
    resourcePageType: ResourcePageType;
    linkUrl: string;
    imageValid: boolean;
    private showUrlContainer;
    private showUploader;
    private showContent;
    private showLinkInput;
    fileName: string;
    private generatedLink;
    disabledOptions: string[];
    static styles: import("lit").CSSResult;
    uploadFile(e: Event): Promise<void>;
    handleInput(event: Event): void;
    validateImage(): void;
    private isValidUrl;
    private handleSelectionChange;
    private triggerUpload;
    private triggerLink;
    private triggerAdd;
    private triggerNone;
    render(): import("lit-html").TemplateResult<1>;
}
export {};
//# sourceMappingURL=awr-upload-link.d.ts.map