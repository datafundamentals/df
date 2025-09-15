import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './awr-upload-link';
import './awr-markdown-codemirror';
import '@material/web/list/list.js';
import '@material/web/textfield/outlined-text-field.js';
import { UrlMediaType, ResourcePageType } from '../types';
import { SignalWatcher } from '@lit-labs/signals';
import { initializeResourceGraph } from '../stores/resource';
import { ResourceGraph } from '../types';

@customElement('awr-resource-documenter')
export class AwrResourceDocumenter extends SignalWatcher(LitElement) {
  @property() resourcePageType: ResourcePageType = 'void';
  @state() markdownText = '';
  @property({ attribute: false }) resourceGraph: ResourceGraph = initializeResourceGraph;

  private handleTextChange(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.dispatchEvent(new CustomEvent('text-change', { detail: { value: target.value, id: target.id } }));
  }

  private handleMarkdownUpdate(event: CustomEvent) {
    this.markdownText = event.detail.markdown;
    this.dispatchEvent(new CustomEvent('text-change', { detail: { value: this.markdownText, id: 'markdown' } }));
  }

  /** Handle setting URL as the primary/main item for this media type (replaces existing) */
  private handleSetPrimaryLink(linkType: UrlMediaType, url: URL) {
    this.dispatchEvent(new CustomEvent('link-make-add', { detail: { linkType: linkType, url: url, makeAdd: 'make' } }));
  }
  
  /** Handle adding URL to the collection for this media type (appends to existing) */
  private handleAddToLinkCollection(linkType: UrlMediaType, url: URL) {
    this.dispatchEvent(new CustomEvent('link-make-add', { detail: { linkType: linkType, url: url, makeAdd: 'add' } }));
  }

  static override styles = css`
    :host {
      display: block;
      margin: 10px;
      padding: 16px;
      border: solid 5px green;
      border-radius: 20px;
      --md-list-container-color: #f4fbfa;
      --md-list-item-label-text-color: #161d1d;
      --md-list-item-supporting-text-color: #3f4948;
      --md-list-item-trailing-supporting-text-color: #3f4948;
      --md-list-item-label-text-font: system-ui;
      --md-list-item-supporting-text-font: system-ui;
      --md-list-item-trailing-supporting-text-font: system-ui;
    }

    .link-container {
      box-shadow: 0 0 0 0.5px black;
      border-radius: 5px;
      border: solid 0.5px lightgrey;
      position: relative;
    }

    input,
    textarea,
    select {
      display: block;
      margin-bottom: 10px;
      border-radius: 5px;
    }

    md-list {
      border: solid 1px;
      margin: 3px;
      padding: 3px;
      border-radius: 5px;
    }

    button {
      margin: 5px;
    }

    .thumbnail {
      height: 50px;
      object-fit: contain;
      border-radius: 12px;
      display: block;
    }

    .link-display {
      display: flex;
      justify-content: flex-start;
      gap: 50px;
    }

    #markdown {
      margin-top: 10px;
      margin-bottom: 10px;
      width: 100%;
    }
  `;

  override render() {
    if (this.resourcePageType === 'void') {
      return html`<h1>No resourcePageType</h1>`;
    }
    return html`
      <md-outlined-text-field id="name" label="Name" value=${this.resourceGraph.name} @blur="${this.handleTextChange}">
      </md-outlined-text-field>
      <div class="link-container">
        <div class="link-display">
          ${this.resourceGraph.image?.map(
            linkUrl => html`
              <a href="${linkUrl}" target="_blank">
                <img class="thumbnail" src="${linkUrl}" />
              </a>
            `,
          )}
        </div>
        <uploaded-link
          resourceLinkType="image"
          resourcePageType=${this.resourcePageType}
          @upload-link-gather-url="${(e: CustomEvent) => this.handleSetPrimaryLink('image', e.detail.linkUrl)}"
          @upload-link-allocate="${(e: CustomEvent) => this.handleAddToLinkCollection('image', new URL(e.detail.linkUrl))}"
        >
        </uploaded-link>
      </div>
      <div class="link-container">
        <div class="link-display">
          ${this.resourceGraph.video?.map(
            linkUrl => html`
              <a href="${linkUrl}" target="_blank">
                <img class="thumbnail" src="${linkUrl}" />
              </a>
            `,
          )}
        </div>
        <uploaded-link
          resourceLinkType="video"
          resourcePageType="${this.resourcePageType}"
          @upload-link-gather-url="${(e: CustomEvent) => this.handleSetPrimaryLink('video', e.detail.linkUrl)}"
          @upload-link-allocate="${(e: CustomEvent) => this.handleAddToLinkCollection('video', new URL(e.detail.linkUrl))}"
        >
        </uploaded-link>
      </div>
      <div class="link-container">
        <div class="link-display">
          ${this.resourceGraph.site?.map(
            linkUrl => html`
              <a href="${linkUrl}" target="_blank">
                <img class="thumbnail" src="${linkUrl}" />
              </a>
            `,
          )}
        </div>
        <uploaded-link
          resourceLinkType="site"
          resourcePageType=${this.resourcePageType}
          @upload-link-gather-url="${(e: CustomEvent) => this.handleSetPrimaryLink('site', e.detail.linkUrl)}"
          @upload-link-allocate="${(e: CustomEvent) => this.handleAddToLinkCollection('site', new URL(e.detail.linkUrl))}"
        >
        </uploaded-link>
      </div>
      <awr-markdown-codemirror
        .markdownContent=${this.resourceGraph.markdown}
        @markdown-update=${this.handleMarkdownUpdate}
      ></awr-markdown-codemirror>
    `;
  }
}
