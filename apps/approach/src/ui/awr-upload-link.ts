// src/awr-upload-link.ts
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fileToUpload, fileUploadProgress, uploadFileTask } from '../stores/upload';
import '@material/web/progress/circular-progress.js';
import '@material/web/textfield/outlined-text-field.js';
import './awr-sgmtd-button';
import { isLoggedIn } from '../stores/auth';

import { SignalWatcher } from '@lit-labs/signals';
import { ResourcePageType, UrlMediaType } from '../types';

@customElement('uploaded-link')
export class AwrUploadLink extends SignalWatcher(LitElement) {
  @property() resourceLinkType: UrlMediaType = 'void';
  @property() resourcePageType: ResourcePageType = 'void';
  @property({ type: String }) linkUrl = '';
  @property({ type: Boolean }) imageValid = false;
  @state() private showUrlContainer = false;
  @state() private showUploader = false;
  @state() private showContent = false;
  @state() private showLinkInput = false;
  @state() fileName = 'Select File to Upload';
  @state() private generatedLink = '';
  @state() public disabledOptions: string[] = ['Add', '0'];
  static override styles = css`
    :host {
      display: block;
      padding: 10px;
      font-family: 'Roboto', sans-serif;
      margin-top: 3px;
      --md-sys-color-primary: #5f9ea0;
    }

    div:first-of-type {
      display: flex;
      flex-direction: row; /* Aligns children in a row */
      align-items: center; /* Aligns items vertically in the center */
      gap: 10px; /* Adds space between elements */
    }

    .file-input-wrapper {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      border-radius: 12px;
    }

    .file-label {
      height: 70px;
      border-radius: 12px;
      cursor: pointer;
      margin-right: 10px;
      font-size: 14px;
      white-space: nowrap;
      padding: 8px 16px;
      text-align: center;
      background-color: var(--md-sys-color-primary, #6200ea);
      color: var(--md-sys-color-on-primary, #ffffff);
      border: none;
      outline: none;
      line-height: 20px;
    }

    .file-input {
      display: none;
    }

    .input-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 350px;
    }

    .thumbnail {
      height: 50px;
      object-fit: contain;
      border-radius: 12px;
      display: block;
    }

    .thumbnail.hidden {
      display: none;
    }

    m3-segmented-button {
      display: inline-flex;
      flex-wrap: nowrap;
      white-space: nowrap;
      width: auto; /* Set width to auto to fit content */
    }
  `;

  async uploadFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file && isLoggedIn) {
      const uploadIdentifier = this.resourcePageType + '|' + this.resourceLinkType;
      this.fileName = file ? file.name : 'No screenshot chosen';
      fileToUpload.set(file);
      this.generatedLink = await uploadFileTask(uploadIdentifier);
      this.linkUrl = this.generatedLink;
      this.showUrlContainer = true;
      this.imageValid = true;
      this.disabledOptions = ['Site', 'Upload'];
      this.dispatchEvent(new CustomEvent('upload-link-gather-url', { detail: { linkUrl: this.linkUrl } }));
    } else {
      console.error('No file selected or user not authenticated.');
    }
  }

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.linkUrl = input.value;
    this.validateImage();
  }

  validateImage() {
    const img = new Image();
    img.src = this.linkUrl;
    img.onload = () => {
      this.imageValid = true;
      this.showUrlContainer = true;
      this.requestUpdate();
      this.disabledOptions = ['Site', 'Upload'];
      this.dispatchEvent(new CustomEvent('upload-link-gather-url', { detail: { linkUrl: this.linkUrl } }));
    };
    img.onerror = () => {
      console.error('ERROR ON IMAGE');
      this.imageValid = false;
      this.requestUpdate();
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      this.linkUrl = url;
      return true;
    } catch (e) {
      return false;
    }
  }

  private handleSelectionChange(event: CustomEvent) {
    const selectedOption = event.detail.selected;
    switch (selectedOption) {
      case 'Upload':
        this.triggerUpload();
        break;
      case 'Site':
        this.triggerLink();
        break;
      case 'Add':
        this.triggerAdd();
        break;
      default:
        this.triggerNone();
        break;
    }
  }

  private triggerUpload() {
    this.showContent = true;
    this.showUrlContainer = false;
    this.showUploader = true;
    this.showLinkInput = false;
  }

  private triggerLink() {
    this.showUrlContainer = true;
    this.showUploader = false;
    this.showContent = true;
    this.showLinkInput = true;
  }

  private triggerAdd() {
    this.dispatchEvent(new CustomEvent('upload-link-allocate', { detail: { linkUrl: this.linkUrl } }));
    this.disabledOptions = ['Add', '0'];
  }

  private triggerNone() {
    this.showUrlContainer = false;
    this.showUploader = false;
    this.showContent = false;
    this.showLinkInput = false;
    this.disabledOptions = ['Add', '0'];
  }

  override render() {
    this.showUrlContainer = this.isValidUrl(this.generatedLink);
    this.showUrlContainer = true;
    return html`
      <div>Gather [${this.resourceLinkType}s]:
        <m3-segmented-button
          @selection-change=${this.handleSelectionChange}
          .disabledOptions=${this.disabledOptions}
        ></m3-segmented-button>
        <div style="display: ${this.showContent ? 'flex' : 'none'};">
          <div style="display: ${this.showUploader ? 'block' : 'none'};">
            <label class="file-label">
              <span>${this.fileName}</span>
              <input type="file" class="file-input" @change="${this.uploadFile}"/>
            </label>
          </div>
          <a href="${this.generatedLink.valueOf()}" style="display: ${this.showUrlContainer ? 'block' : 'none'};"
             target="_blank"><img
            class="thumbnail" ${this.imageValid ? '' : 'hidden'}"
              src=${this.imageValid ? this.linkUrl : ''}
            /></a>
          <md-outlined-text-field
            style="display: ${this.showLinkInput ? 'block' : 'none'};"
            label="URL" .value=${this.linkUrl}
            @input=${this.handleInput}></md-outlined-text-field>
          <md-circular-progress four-color value="${fileUploadProgress.get()}"></md-circular-progress>
        </div>
      </div>
    `;
  }
}
