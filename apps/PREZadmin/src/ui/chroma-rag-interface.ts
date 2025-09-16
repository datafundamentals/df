import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import { marked } from 'marked';
import './awr-markdown-codemirror.js';
import './tag-typeahead-input.js';
import { ensureDocumentId, parseMarkdown, countTokens } from '../services/file-processing.js';
import { SignalWatcher } from '@lit-labs/signals';
import { isLoggedIn, signInWithGoogle, signOut, userSignal } from '../stores/auth';
import { saveAllMetadataTags } from '../stores/tags';
import { saveCategory, normalizeCategory } from '../stores/categories';
import { saveDocumentAsync, queryWithLLMAsync, updateDocumentAsync, loadAllRAGFilesAsync } from '../stores/chroma-rag';

@customElement('chroma-rag-interface')
export class ChromaRagInterface extends SignalWatcher(LitElement) {
  @state() activeMode: 'document' | 'query' | 'update' = 'query';
  @state() statusMessage = '';
  @state() statusType: 'info' | 'success' | 'error' = 'info';
  @state() queryStatus = '';
  @state() queryStatusType: 'info' | 'success' | 'error' = 'info';
  @state() showResults = false;
  @state() contextResults: any[] = [];
  @state() responseText = '';
  @state() isLoading = false;
  @state() isQuerying = false;
  @state() editingDocument: any = null;
  @state() documentContent = '';
  @state() ragDirectory = '';
  @state() showVerboseOutput = false;
  @state() verboseMessages: Array<{type: string, text: string}> = [];
  @state() isTokenCalculationStale = false;
  @state() originalDocumentContent = '';
  @state() editingTags = '';
  @state() editingCategory = '';
  @state() editingIsA = '';
  @state() editingChildOf = '';
  @state() editingHasA = '';
  @state() isCreatingNew = false;
  @state() newDocumentTitle = '';
  @state() newDocumentFilename = '';
  @state() showTitleInput = false;
  @state() additionalContextValue = 5;

  static override styles = css`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .app-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .user-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding: 12px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
    }

    .user-info span {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 500);
    }

    .login-prompt {
      text-align: center;
      margin-top: 24px;
      padding: 32px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
    }

    .login-prompt p {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-large-size, 16px);
      margin-bottom: 16px;
    }

    h1 {
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-align: center;
      margin-bottom: 8px;
      font-family: var(--md-sys-typescale-headline-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-headline-large-size, 32px);
      font-weight: var(--md-sys-typescale-headline-large-weight, 400);
      line-height: var(--md-sys-typescale-headline-large-line-height, 40px);
      letter-spacing: var(--md-sys-typescale-headline-large-tracking, 0px);
    }

    h2 {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
      margin-bottom: 32px;
      font-family: var(--md-sys-typescale-title-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-large-size, 22px);
      font-weight: var(--md-sys-typescale-title-large-weight, 400);
      line-height: var(--md-sys-typescale-title-large-line-height, 28px);
      letter-spacing: var(--md-sys-typescale-title-large-tracking, 0px);
    }

    p {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
      margin-bottom: 24px;
      font-family: var(--md-sys-typescale-body-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-large-size, 16px);
      font-weight: var(--md-sys-typescale-body-large-weight, 400);
      line-height: var(--md-sys-typescale-body-large-line-height, 24px);
      letter-spacing: var(--md-sys-typescale-body-large-tracking, 0.5px);
    }

    .mode-selector {
      display: flex;
      justify-content: center;
      margin-bottom: 30px;
      border-bottom: 1px solid #ddd;
    }

    .mode-section {
      display: none;
    }

    .mode-section.active {
      display: block;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group md-outlined-text-field {
      width: 100%;
    }

    .button-container {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }

    .status-message {
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      margin-top: 16px;
      min-height: 20px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      letter-spacing: var(--md-sys-typescale-body-medium-tracking, 0.25px);
    }

    .status-message.success {
      background-color: var(--md-sys-color-tertiary-container, #d4edda);
      color: var(--md-sys-color-on-tertiary-container, #155724);
      border: 1px solid var(--md-sys-color-tertiary, #4caf50);
    }

    .status-message.error {
      background-color: var(--md-sys-color-error-container, #fce4ec);
      color: var(--md-sys-color-on-error-container, #b71c1c);
      border: 1px solid var(--md-sys-color-error, #f44336);
    }

    .status-message.info {
      background-color: var(--md-sys-color-primary-container, #e3f2fd);
      color: var(--md-sys-color-on-primary-container, #0d47a1);
      border: 1px solid var(--md-sys-color-primary, #2196f3);
    }

    .query-options {
      background-color: var(--md-sys-color-surface-variant, #f3f0f4);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    .filter-row {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .filter-group {
      flex: 1;
    }

    .results-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
    }

    .results-section h3 {
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 16px;
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
      line-height: var(--md-sys-typescale-title-medium-line-height, 24px);
      letter-spacing: var(--md-sys-typescale-title-medium-tracking, 0.15px);
    }

    .response-display, .context-display {
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      letter-spacing: var(--md-sys-typescale-body-medium-tracking, 0.25px);
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    .response-display {
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
      background-color: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .context-display {
      border-left: 4px solid var(--md-sys-color-secondary, #625b71);
      background-color: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }

    .context-item {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .context-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .context-score {
      font-family: var(--md-sys-typescale-label-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-label-small-size, 11px);
      font-weight: var(--md-sys-typescale-label-small-weight, 500);
      line-height: var(--md-sys-typescale-label-small-line-height, 16px);
      letter-spacing: var(--md-sys-typescale-label-small-tracking, 0.5px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 8px;
    }

    .context-metadata {
      background-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15));
    }

    .metadata-item {
      margin-bottom: 8px;
      display: flex;
      gap: 12px;
      align-items: baseline;
    }

    .metadata-label {
      font-family: var(--md-sys-typescale-label-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-label-medium-size, 12px);
      font-weight: var(--md-sys-typescale-label-medium-weight, 500);
      line-height: var(--md-sys-typescale-label-medium-line-height, 16px);
      letter-spacing: var(--md-sys-typescale-label-medium-tracking, 0.5px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      min-width: 80px;
      flex-shrink: 0;
    }

    .metadata-value {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      letter-spacing: var(--md-sys-typescale-body-medium-tracking, 0.25px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      flex: 1;
    }

    .markdown-content {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-align: left !important;
    }

    .markdown-content * {
      text-align: left !important;
    }

    .markdown-content h1, .markdown-content h2, .markdown-content h3, 
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-align: left !important;
    }

    .markdown-content p {
      margin-bottom: 16px;
      text-align: left !important;
    }

    .markdown-content pre {
      background-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
    }

    .markdown-content code {
      background-color: var(--md-sys-color-surface-container-high, #ece6f0);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    .markdown-content blockquote {
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
      margin: 16px 0;
      padding: 8px 16px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      font-style: italic;
      text-align: left !important;
    }

    .context-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .edit-button {
      --md-filled-button-container-color: var(--md-sys-color-tertiary, #7d5260);
      --md-filled-button-label-text-color: var(--md-sys-color-on-tertiary, #ffffff);
    }

    .update-placeholder {
      text-align: center;
      padding: 40px 20px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
    }

    .document-editor-container {
      margin-top: 20px;
    }

    .document-info {
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .document-info h4 {
      margin: 0 0 8px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
    }

    .document-info p {
      margin: 4px 0;
      text-align: left;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .metadata-editor {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tags-label {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
    }

    .tags-input {
      padding: 12px 16px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      width: 100%;
      box-sizing: border-box;
    }

    .tags-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container, #eaddff);
    }

    .tags-input::placeholder {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.7;
    }

    .metadata-input {
      padding: 12px 16px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 16px;
    }

    .metadata-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container, #eaddff);
    }

    .metadata-input::placeholder {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.7;
    }

    .metadata-label {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      display: block;
      margin-bottom: 8px;
    }

    .filename-field {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .filename-label {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      min-width: 80px;
      flex-shrink: 0;
    }

    .filename-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      box-sizing: border-box;
    }

    .filename-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container, #eaddff);
    }

    .filename-input::placeholder {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.7;
    }

    .filename-extension {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: 500;
    }

    .title-input-section {
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      text-align: center;
    }

    .title-input {
      width: 100%;
      max-width: 400px;
      padding: 16px 20px;
      border: 2px solid var(--md-sys-color-outline, #79747e);
      border-radius: 12px;
      background-color: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-headline-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-headline-small-size, 24px);
      font-weight: var(--md-sys-typescale-headline-small-weight, 400);
      line-height: var(--md-sys-typescale-headline-small-line-height, 32px);
      text-align: center;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      box-sizing: border-box;
      margin-bottom: 16px;
    }

    .title-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 3px var(--md-sys-color-primary-container, #eaddff);
    }

    .title-input::placeholder {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.8;
    }

    .title-prompt {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: var(--md-sys-typescale-body-large-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-large-size, 16px);
      font-weight: var(--md-sys-typescale-body-large-weight, 400);
      line-height: var(--md-sys-typescale-body-large-line-height, 24px);
      margin-bottom: 16px;
    }

    .new-document-section {
      margin-bottom: 24px;
      padding: 16px;
      background-color: var(--md-sys-color-surface-container-lowest, #fef7ff);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .filename-field {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filename-label {
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 400);
    }

    .filename-input {
      padding: 12px 16px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px 0 0 8px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface, #1d1b20);
      font-family: 'Courier New', monospace;
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      flex: 1;
      box-sizing: border-box;
    }

    .filename-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container, #eaddff);
    }

    .filename-input::placeholder {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.7;
    }

    .filename-extension {
      background-color: var(--md-sys-color-surface-container, #e7e0ec);
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-left: none;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-family: 'Courier New', monospace;
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      display: flex;
      align-items: center;
    }

    .filename-field > div {
      display: flex;
    }

    .storage-option {
      margin-bottom: 32px;
      padding: 20px;
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 12px;
    }

    .storage-option h4 {
      margin: 0 0 16px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 500);
    }

    .file-upload-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .file-status {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .server-browser-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .server-file-list {
      margin-top: 16px;
    }

    .server-file-list h5 {
      margin: 0 0 12px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-small-size, 14px);
      font-weight: var(--md-sys-typescale-title-small-weight, 500);
    }

    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 12px;
      background-color: var(--md-sys-color-surface, #fef7ff);
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: var(--md-sys-color-surface-container, #f3edf7);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .file-item:hover {
      background-color: var(--md-sys-color-surface-container-high, #ede7f1);
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .file-item md-icon {
      color: var(--md-sys-color-primary, #6750a4);
    }

    .file-name {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      word-break: break-all;
    }

    .option-description {
      font-size: var(--md-sys-typescale-body-small-size, 12px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 8px 0 16px 0;
      text-align: left;
    }

    .bulk-loader-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .processing-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
      padding: 16px;
      background-color: var(--md-sys-color-surface-container, #f3edf7);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
    }

    .processing-options label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-left: 8px;
      cursor: pointer;
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .option-row input[type="checkbox"] {
      margin: 0;
    }

    .verbose-output {
      margin-top: 16px;
      background-color: var(--md-sys-color-surface-container, #f3edf7);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      padding: 16px;
    }

    .verbose-output h5 {
      margin: 0 0 12px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-family: var(--md-sys-typescale-title-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-small-size, 14px);
      font-weight: var(--md-sys-typescale-title-small-weight, 500);
    }

    .verbose-log {
      max-height: 300px;
      overflow-y: auto;
      background-color: var(--md-sys-color-surface, #fef7ff);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 4px;
      padding: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
    }

    .verbose-line {
      margin-bottom: 2px;
      padding: 2px 0;
    }

    .verbose-line.processing {
      color: var(--md-sys-color-primary, #6750a4);
    }

    .verbose-line.skipped {
      color: var(--md-sys-color-tertiary, #7d5260);
      font-style: italic;
    }

    .verbose-line.summary {
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-weight: bold;
      margin-top: 8px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      padding-top: 8px;
    }

    .verbose-line.error {
      color: var(--md-sys-color-error, #ba1a1a);
    }

    .relevance-group {
      margin-bottom: 48px;
      border: 2px solid var(--group-color, var(--md-sys-color-primary, #6750a4));
      border-radius: 16px;
      background-color: var(--md-sys-color-surface, #fffbfe);
      box-shadow: var(--md-sys-elevation-level2, 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3));
      overflow: hidden;
    }

    .relevance-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0;
      padding: 20px 24px;
      background: linear-gradient(135deg, var(--group-color, var(--md-sys-color-primary, #6750a4)), var(--group-color-light, var(--md-sys-color-primary-container, #eaddff)));
      color: white;
      font-weight: bold;
    }

    .relevance-group-title {
      font-family: var(--md-sys-typescale-headline-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-headline-small-size, 24px);
      font-weight: var(--md-sys-typescale-headline-small-weight, 600);
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .relevance-group-count {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 600);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(4px);
    }

    .relevance-group-content {
      padding: 24px;
    }

    .relevance-group.strong {
      --group-color: var(--md-sys-color-primary, #6750a4);
      --group-color-light: var(--md-sys-color-primary-container, #eaddff);
    }

    .relevance-group.good {
      --group-color: var(--md-sys-color-secondary, #625b71);
      --group-color-light: var(--md-sys-color-secondary-container, #e8def8);
    }

    .relevance-group.weak {
      --group-color: var(--md-sys-color-tertiary, #7d5260);
      --group-color-light: var(--md-sys-color-tertiary-container, #ffd8e4);
    }

    .relevance-group.poor {
      --group-color: var(--md-sys-color-outline, #79747e);
      --group-color-light: var(--md-sys-color-surface-container, #f3edf7);
    }

    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .slider-label {
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      font-weight: var(--md-sys-typescale-body-medium-weight, 500);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .slider-value {
      font-family: var(--md-sys-typescale-title-medium-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 16px);
      font-weight: var(--md-sys-typescale-title-medium-weight, 600);
      color: var(--md-sys-color-primary, #6750a4);
      background-color: var(--md-sys-color-primary-container, #eaddff);
      padding: 8px 16px;
      border-radius: 12px;
      min-width: 40px;
      text-align: center;
    }

    .slider-input {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--md-sys-color-outline-variant, #c7c5d0);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    }

    .slider-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3));
      transition: all 0.2s ease;
    }

    .slider-input::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: var(--md-sys-elevation-level2, 0px 2px 6px 2px rgba(0, 0, 0, 0.15));
    }

    .slider-input::-moz-range-thumb {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      border: none;
      box-shadow: var(--md-sys-elevation-level1, 0px 1px 2px 0px rgba(0, 0, 0, 0.3));
      transition: all 0.2s ease;
    }

    .slider-input::-moz-range-thumb:hover {
      transform: scale(1.1);
      box-shadow: var(--md-sys-elevation-level2, 0px 2px 6px 2px rgba(0, 0, 0, 0.15));
    }

    .slider-scale {
      display: flex;
      justify-content: space-between;
      font-family: var(--md-sys-typescale-body-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-small-size, 12px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 4px;
    }

    .slider-supporting-text {
      font-family: var(--md-sys-typescale-body-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-small-size, 12px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      line-height: var(--md-sys-typescale-body-small-line-height, 16px);
      margin-top: 8px;
    }

    .minimal-slider-container {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slider-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 8px;
      background-color: var(--md-sys-color-inverse-surface, #322f35);
      color: var(--md-sys-color-inverse-on-surface, #f4eff4);
      padding: 8px 12px;
      border-radius: 8px;
      font-family: var(--md-sys-typescale-body-small-font, 'Roboto', sans-serif);
      font-size: var(--md-sys-typescale-body-small-size, 12px);
      white-space: nowrap;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      box-shadow: var(--md-sys-elevation-level2, 0px 2px 6px 2px rgba(0, 0, 0, 0.15));
    }

    .slider-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: var(--md-sys-color-inverse-surface, #322f35);
    }

    .minimal-slider-container:hover .slider-tooltip {
      opacity: 1;
    }

  `;

  private handleTabChange(event: Event) {
    const tabs = event.target as any;
    const activeTabIndex = tabs.activeTabIndex;
    
    if (activeTabIndex === 0) {
      this.activeMode = 'query';
    } else if (activeTabIndex === 1) {
      this.activeMode = 'document';
    } else if (activeTabIndex === 2) {
      this.activeMode = 'update';
    }
    
    this.hideResults();
    
    if (this.activeMode === 'document') {
      this.showStatus('Ready to save text to ChromaDB. Make sure ChromaDB server is running on port 8000.', 'info');
    } else if (this.activeMode === 'query') {
      this.showQueryStatus('Ready to ask questions about your stored documents.', 'info');
    } else if (this.activeMode === 'update') {
      this.showStatus('Document Editor mode - create new documents or edit existing ones.', 'info');
    }
  }

  private showStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.statusMessage = message;
    this.statusType = type;
  }

  private showQueryStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.queryStatus = message;
    this.queryStatusType = type;
  }

  private hideResults() {
    this.showResults = false;
  }

  private groupResultsByRelevance(results: any[]) {
    const groups = {
      strong: [] as any[],      // distance < 0.50 (relevance > 0.50) 
      good: [] as any[],        // distance 0.50-0.90 (relevance 0.10-0.50)
      weak: [] as any[],        // distance 0.90-1.05 (relevance -0.05-0.10)
      poor: [] as any[]         // distance > 1.05 (relevance < -0.05)
    };

    results.forEach(item => {
      const distance = item.distance;
      if (distance === null || distance === undefined) {
        groups.poor.push(item);
      } else if (distance < 0.50) {
        groups.strong.push(item);
      } else if (distance < 0.90) {
        groups.good.push(item);
      } else if (distance < 1.05) {
        groups.weak.push(item);
      } else {
        groups.poor.push(item);
      }
    });

    return groups;
  }

  private applySemanticFiltering(allResults: any[], sliderValue: number): any[] {
    // Group all results by relevance
    const groups = this.groupResultsByRelevance(allResults);
    
    if (sliderValue <= -8) {
      // -10 to -8: No retrieved context at all
      return [];
    } else if (sliderValue >= -7 && sliderValue <= -4) {
      // -7 to -4: 1st group only (Strong matches)
      return [
        ...groups.strong
      ];
    } else if (sliderValue >= -3 && sliderValue <= -1) {
      // -3 to -1: 1st + 2nd group (Strong + Good matches)
      return [
        ...groups.strong,
        ...groups.good
      ];
    } else if (sliderValue === 0) {
      // 0: 1st through 3rd group (Strong + Good + Weak matches)
      return [
        ...groups.strong,
        ...groups.good,
        ...groups.weak
      ];
    } else {
      // Positive (1-50): 1st through 3rd + N poor matches (Strong + Good + Weak + N Poor)
      return [
        ...groups.strong,
        ...groups.good,
        ...groups.weak,
        ...groups.poor.slice(0, sliderValue)
      ];
    }
  }

  private getQueryStatusMessage(sliderValue: number, filteredResults: any[]): string {
    const groups = this.groupResultsByRelevance(filteredResults);
    
    if (sliderValue <= -8) {
      return "Requested: No context → Showing AI response only";
    } else if (sliderValue >= -7 && sliderValue <= -4) {
      return `Requested: Strong matches only → Found ${groups.strong.length} strong matches`;
    } else if (sliderValue >= -3 && sliderValue <= -1) {
      return `Requested: Strong + Good matches → Found ${groups.strong.length} strong + ${groups.good.length} good matches`;
    } else if (sliderValue === 0) {
      return `Requested: All relevant matches → Found ${groups.strong.length} strong + ${groups.good.length} good + ${groups.weak.length} weak matches`;
    } else {
      return `Requested: All relevant + ${sliderValue} poor → Found ${groups.strong.length} strong + ${groups.good.length} good + ${groups.weak.length} weak + ${groups.poor.length} poor matches`;
    }
  }

  private getSliderExplanation(value: number): string {
    if (value <= -8) {
      return "No retrieved context (empty results)";
    } else if (value >= -7 && value <= -4) {
      return "Strong matches only (highest relevance)";
    } else if (value >= -3 && value <= -1) {
      return "Strong + Good matches (high relevance)";
    } else if (value === 0) {
      return "Strong + Good + Weak matches (all relevant)";
    } else {
      return `Strong + Good + Weak + ${value} Poor matches (comprehensive)`;
    }
  }

  private getRelevanceLabelAndColor(level: string): { label: string; color: string } {
    switch (level) {
      case 'strong': return { label: 'Strong Match', color: 'var(--md-sys-color-primary, #6750a4)' };
      case 'good': return { label: 'Good Match', color: 'var(--md-sys-color-secondary, #625b71)' };
      case 'weak': return { label: 'Weak Match', color: 'var(--md-sys-color-tertiary, #7d5260)' };
      case 'poor': return { label: 'Poor Match - Just in case...', color: 'var(--md-sys-color-outline, #79747e)' };
      default: return { label: 'Unknown', color: 'var(--md-sys-color-outline-variant, #c7c5d0)' };
    }
  }

  private renderMarkdown(markdownText: string) {
    try {
      const htmlContent = marked.parse(markdownText, { async: false }) as string;
      return html`<div class="markdown-content">${unsafeHTML(htmlContent)}</div>`;
    } catch (error) {
      return html`<div class="markdown-content">${markdownText}</div>`;
    }
  }

  private async saveDocument() {
    const textInput = this.shadowRoot?.querySelector('#textInput') as any;
    const text = textInput?.value?.trim();
    
    if (!text) {
      this.showStatus('Please enter some text to save.', 'error');
      return;
    }

    this.isLoading = true;
    this.showStatus('Saving to ChromaDB via proxy...', 'info');

    try {
      // Use file processing utilities for proper ID generation and parsing
      const { text: processedText, id: documentId } = ensureDocumentId(text);
      const parsed = parseMarkdown(processedText);
      const tokenCount = countTokens(parsed.content);

      // Use the store to save document (standards compliant)
      const saveOperation = saveDocumentAsync({
        documentId,
        content: parsed.content,
        metadata: {
          ...parsed.data,
          tokenCount,
        },
      });

      await saveOperation.complete;

      this.showStatus(`Successfully saved document with ID: ${documentId}`, 'success');
      textInput.value = '';
    } catch (error: any) {
      console.error('Error saving to ChromaDB:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private async queryDocuments() {
    const queryInput = this.shadowRoot?.querySelector('#queryInput') as any;
    const query = queryInput?.value?.trim();
    
    if (!query) {
      this.showQueryStatus('Please enter a question to search for.', 'error');
      return;
    }

    this.isQuerying = true;
    this.hideResults();
    this.showQueryStatus('Searching documents and generating response...', 'info');

    // Use the slider value directly
    const sliderValue = this.additionalContextValue;

    // Request a larger set initially to ensure we capture all relevant matches
    // We'll filter this down based on semantic relevance thresholds
    const requestBody: any = {
      action: 'query_rag',
      collection_name: 'rag-documents',
      query: query,
      n_results: Math.max(1, Math.min(this.additionalContextValue + 7, 10)), // Ensure positive, limit results to AI model
    };

    try {
      // Use store to query documents (standards compliant)
      const queryOperation = queryWithLLMAsync(requestBody);
      
      await queryOperation.complete;
      const result = queryOperation.value;
      
      const allResults = result.context || [];
      
      // Apply semantic filtering logic
      const filteredResults = this.applySemanticFiltering(allResults, sliderValue);
      
      // Update the UI with semantically filtered results
      this.contextResults = filteredResults;
      this.responseText = result.response || 'No response generated.';
      this.showResults = true;
      
      // Show summary reflecting what was requested and what was found
      this.showQueryStatus(this.getQueryStatusMessage(sliderValue, filteredResults), 'success');
    } catch (error: any) {
      console.error('Error querying documents:', error);
      this.showQueryStatus(`Error: ${error.message}`, 'error');
      this.hideResults();
    } finally {
      this.isQuerying = false;
    }
  }

  private editDocument(item: any) {
    this.isCreatingNew = false; // Reset creation state when editing existing document
    this.editingDocument = item;
    this.documentContent = item.document || item.text || '';
    this.originalDocumentContent = this.documentContent; // Store original content
    this.editingTags = item.metadata?.tags || ''; // Initialize metadata for editing
    this.editingCategory = item.metadata?.category || '';
    this.editingIsA = item.metadata?.is_a || '';
    this.editingChildOf = item.metadata?.child_of || '';
    this.editingHasA = item.metadata?.has_a || '';
    this.isTokenCalculationStale = false; // No changes yet, so tokens are valid
    this.activeMode = 'update';
    this.showStatus('Document loaded for editing.', 'success');
  }

  private handleMarkdownUpdate(event: CustomEvent) {
    this.documentContent = event.detail.markdown;
  }

  private handleTokenCalculated(_event: CustomEvent) {
    this.isTokenCalculationStale = false;
  }

  private handleTokenStatusChanged(event: CustomEvent) {
    this.isTokenCalculationStale = event.detail.stale;
  }

  private hasDocumentChanged(): boolean {
    // For new documents, consider any content or metadata as "changed"
    if (this.isCreatingNew) {
      return this.documentContent.trim().length > 0 || 
             this.editingTags.trim().length > 0 ||
             this.editingCategory.trim().length > 0 ||
             this.editingIsA.trim().length > 0 ||
             this.editingChildOf.trim().length > 0 ||
             this.editingHasA.trim().length > 0;
    }
    
    // For existing documents, check for actual changes
    const contentChanged = this.documentContent !== this.originalDocumentContent;
    const tagsChanged = this.editingTags !== (this.editingDocument?.metadata?.tags || '');
    const categoryChanged = this.editingCategory !== (this.editingDocument?.metadata?.category || '');
    const isAChanged = this.editingIsA !== (this.editingDocument?.metadata?.is_a || '');
    const childOfChanged = this.editingChildOf !== (this.editingDocument?.metadata?.child_of || '');
    const hasAChanged = this.editingHasA !== (this.editingDocument?.metadata?.has_a || '');
    
    return contentChanged || tagsChanged || categoryChanged || isAChanged || childOfChanged || hasAChanged;
  }

  private handleTagsChange(event: CustomEvent) {
    this.editingTags = event.detail.value;
  }

  private handleCategoryChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.editingCategory = input.value;
  }

  private handleIsAChange(event: CustomEvent) {
    this.editingIsA = event.detail.value;
  }

  private handleChildOfChange(event: CustomEvent) {
    this.editingChildOf = event.detail.value;
  }

  private handleHasAChange(event: CustomEvent) {
    this.editingHasA = event.detail.value;
  }

  private handleFilenameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Allow typing underscores and valid characters, only sanitize invalid ones
    value = value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')  // Replace non-alphanumeric with underscores
      .replace(/_+/g, '_');         // Collapse multiple underscores only
    
    this.newDocumentFilename = value;
    
    // Update the input field with the sanitized value if it changed
    if (input.value !== value) {
      input.value = value;
    }
  }

  private handleFilenameBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Clean up on blur - remove leading/trailing underscores
    value = value.replace(/^_+|_+$/g, '');
    
    this.newDocumentFilename = value;
    input.value = value;
  }

  private handleTitleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.newDocumentTitle = input.value;
  }

  private handleAdditionalContextChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.additionalContextValue = parseInt(input.value);
  }

  private continueFromTitle() {
    if (!this.newDocumentTitle.trim()) {
      this.showStatus('Please enter a title first.', 'error');
      return;
    }

    // Auto-populate all fields from title
    const title = this.newDocumentTitle.trim();
    
    // Generate filename from title
    this.newDocumentFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')    // Remove special chars
      .trim()
      .replace(/\s+/g, '_');          // Spaces to underscores
    
    // Pre-populate markdown content with H1 heading
    this.documentContent = `# ${title}\n\n`;
    this.originalDocumentContent = this.documentContent;
    
    // Set metadata fields to empty initially
    this.editingTags = '';
    this.editingCategory = '';
    this.editingIsA = '';
    this.editingChildOf = '';
    this.editingHasA = '';
    
    // Hide title input and show full form
    this.showTitleInput = false;
    this.isTokenCalculationStale = true; // Force preview before saving
    
    this.showStatus('Document template created from title. Add your content below.', 'success');
  }

  private validateFilename(filename: string): { isValid: boolean; error?: string } {
    if (!filename) {
      return { isValid: false, error: 'Filename is required' };
    }
    
    if (!/^[a-z0-9_]+$/.test(filename)) {
      return { isValid: false, error: 'Filename must contain only lowercase letters, numbers, and underscores' };
    }
    
    if (filename.length < 2) {
      return { isValid: false, error: 'Filename must be at least 2 characters long' };
    }
    
    if (filename.length > 50) {
      return { isValid: false, error: 'Filename must be 50 characters or less' };
    }
    
    return { isValid: true };
  }


  private startNewDocument() {
    this.isCreatingNew = true;
    this.showTitleInput = true;
    this.editingDocument = null;
    this.documentContent = '';
    this.originalDocumentContent = '';
    this.editingTags = '';
    this.newDocumentTitle = '';
    this.newDocumentFilename = '';
    this.isTokenCalculationStale = true; // Force preview before saving new docs
    this.activeMode = 'update';
    this.showStatus('Enter a title to get started with your new document.', 'info');
  }

  private async saveDocumentUpdate() {
    if (!this.documentContent.trim()) {
      this.showStatus('No document content to save.', 'error');
      return;
    }

    // For new documents, validate filename first
    if (this.isCreatingNew) {
      const filenameValidation = this.validateFilename(this.newDocumentFilename);
      if (!filenameValidation.isValid) {
        this.showStatus(`Invalid filename: ${filenameValidation.error}`, 'error');
        return;
      }
    }

    // For new documents, we need to generate an ID
    if (this.isCreatingNew && !this.editingDocument) {
      const { generateId } = await import('../services/file-processing.js');
      const newId = generateId();
      
      // Create a temporary document object for new documents
      this.editingDocument = {
        id: newId,
        document: this.documentContent,
        text: this.documentContent,
        metadata: {
          title: this.newDocumentTitle || '', // Include title from title input
          tags: this.editingTags,
          category: this.editingCategory ? normalizeCategory(this.editingCategory) : 'primary', // Use edited value or default
          is_a: this.editingIsA,
          child_of: this.editingChildOf,
          has_a: this.editingHasA,
        }
      };
    }

    this.isLoading = true;
    const actionText = this.isCreatingNew ? 'Saving new document to ChromaDB...' : 'Updating document in ChromaDB...';
    this.showStatus(actionText, 'info');

    try {
      // Use file processing utilities for proper parsing and token counting
      const parsed = parseMarkdown(this.documentContent);
      const tokenCount = countTokens(parsed.content);

      // Use store to update document (standards compliant)
      const updateOperation = updateDocumentAsync({
        isCreatingNew: this.isCreatingNew,
        document: {
          id: this.editingDocument.id,
          text: parsed.content,
          metadata: {
            ...this.editingDocument.metadata,
            ...parsed.data,
            tags: this.editingTags, // Include all edited metadata
            category: this.editingCategory ? normalizeCategory(this.editingCategory) : '',
            is_a: this.editingIsA,
            child_of: this.editingChildOf,
            has_a: this.editingHasA,
            last_updated: new Date().toISOString(),
            length: parsed.content.length,
            tokenCount,
          },
        },
        content: this.documentContent,
        filename: this.isCreatingNew ? this.newDocumentFilename : undefined,
      });

      await updateOperation.complete;
      const result = updateOperation.value;
      
      // Show enhanced status message based on bi-directional save result
      const actionText = this.isCreatingNew ? 'created' : 'updated';
      let statusMessage = `Document ${this.editingDocument.id} ${actionText} successfully in ChromaDB`;
      
      if (result.fileWrite) {
        if (result.fileWrite.error) {
          statusMessage += `, but filesystem write failed: ${result.fileWrite.error}`;
        } else {
          statusMessage += ` and saved to filesystem (${result.fileWrite.tokenCount} tokens)`;
        }
      }
      
      this.showStatus(statusMessage, 'success');
        
        // Save tags to Firestore (fire-and-forget)
        try {
          await saveAllMetadataTags([
            this.editingTags,
            this.editingIsA,
            this.editingChildOf,
            this.editingHasA
          ]);
          
          // Save category to categories collection
          if (this.editingCategory) {
            await saveCategory(this.editingCategory);
          }
        } catch (error) {
          console.error('Error saving tags:', error);
          // Error already handled by saveAllMetadataTags with alert
        }
        
        // Reset creation state after successful save
        if (this.isCreatingNew) {
          this.isCreatingNew = false;
          this.originalDocumentContent = this.documentContent; // Update baseline for future edits
        }
        
        // Trigger the markdown editor's render to show the saved result
        this.triggerMarkdownRender();
    } catch (error: any) {
      console.error('Error updating document:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private cancelDocumentEdit() {
    const actionText = this.isCreatingNew ? 'Document creation' : 'Document editing';
    this.editingDocument = null;
    this.documentContent = '';
    this.editingTags = '';
    this.isCreatingNew = false;
    this.originalDocumentContent = '';
    this.showStatus(`${actionText} cancelled.`, 'info');
  }

  private triggerMarkdownRender() {
    // Trigger the markdown editor's built-in render functionality
    const markdownEditor = this.shadowRoot?.querySelector('awr-markdown-codemirror') as any;
    if (markdownEditor && markdownEditor.renderMarkdown) {
      markdownEditor.renderMarkdown();
      // Scroll the editor's output into view
      this.updateComplete.then(() => {
        const outputElement = markdownEditor.shadowRoot?.querySelector('#output');
        if (outputElement) {
          outputElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }


  private async loadAllRagFiles() {
    this.isLoading = true;
    const bulkLoaderStatus = this.shadowRoot?.querySelector('#bulkLoaderStatus') as HTMLElement;
    
    // Get processing options
    const resetCollection = (this.shadowRoot?.querySelector('#resetCollectionOption') as HTMLInputElement)?.checked || false;
    const verbose = (this.shadowRoot?.querySelector('#verboseOption') as HTMLInputElement)?.checked || false;
    
    console.log('Frontend options:', { resetCollection, verbose });
    
    // Setup verbose output area
    this.showVerboseOutput = verbose;
    this.verboseMessages = [];
    
    if (bulkLoaderStatus) {
      bulkLoaderStatus.textContent = 'Loading all RAG files...';
    }

    this.showStatus('Processing all RAG files from configured directory...', 'info');

    try {
      // Use store to load files (standards compliant)
      const loadOperation = loadAllRAGFilesAsync({
        resetCollection,
        verbose,
      });

      await loadOperation.complete;
      const result = loadOperation.value;
      
      this.ragDirectory = result.directory || '';
      
      // Display verbose messages if available
      if (result.verboseMessages && result.verboseMessages.length > 0) {
        this.verboseMessages = result.verboseMessages;
      }
      
      if (bulkLoaderStatus) {
        const summary = `Processed ${result.filesProcessed || 0} files from ${this.ragDirectory}`;
        const details = result.addedCount !== undefined ? 
          ` (Added: ${result.addedCount}, Updated: ${result.updatedCount}, Skipped: ${result.skippedCount})` : '';
        bulkLoaderStatus.textContent = summary + details;
      }
      
      this.showStatus(`Successfully processed ${result.filesProcessed || 0} RAG files!`, 'success');
    } catch (error: any) {
      console.error('Error loading RAG files:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
      
      if (bulkLoaderStatus) {
        bulkLoaderStatus.textContent = 'Error loading RAG files';
      }
    } finally {
      this.isLoading = false;
    }
  }

  override render() {
    return html`
      <div class="app-header">
        <h2>PREZ - Prompt Generator in Chief</h2>
        
        ${isLoggedIn.get()
          ? html`
            <div class="user-info">
              <span>Welcome, ${userSignal.get()?.displayName || 'User'}</span>
              <md-filled-button @click="${signOut}">Sign Out</md-filled-button>
            </div>
          `
          : html`
            <div class="login-prompt">
              <p>Please sign in to access the RAG interface</p>
              <md-filled-button @click="${signInWithGoogle}">Sign in with Google</md-filled-button>
            </div>
          `
        }
      </div>

      ${isLoggedIn.get() ? html`
        <!-- RAG Interface Content -->

      <!-- Mode Selector -->
      <div class="mode-selector">
        <md-tabs @change=${this.handleTabChange}>
          <md-primary-tab ?active=${this.activeMode === 'query'}>Query & Chat</md-primary-tab>
          <md-primary-tab ?active=${this.activeMode === 'document'}>Document Storage</md-primary-tab>
          <md-primary-tab ?active=${this.activeMode === 'update'}>Document Editor</md-primary-tab>
        </md-tabs>
      </div>

      <!-- Document Storage Mode -->
      <div class="mode-section ${this.activeMode === 'document' ? 'active' : ''}">
        <p>Save documents as embeddings in ChromaDB:</p>

        <!-- Bulk RAG Loader Section -->
        <div class="storage-option">
          <h4>Load All RAG Files:</h4>
          <p class="option-description">Process all markdown files from the configured RAG directory (${this.ragDirectory || 'DEFAULT_MARKDOWN_SOURCE_DIR'})</p>
          
          <div class="bulk-loader-container">
            <md-filled-button 
              @click=${this.loadAllRagFiles}
              ?disabled=${this.isLoading}>
              Load All RAG Files
            </md-filled-button>
            <span id="bulkLoaderStatus" class="file-status"></span>
          </div>

          <!-- Verbose Output Area -->
          ${this.showVerboseOutput ? html`
            <div class="verbose-output">
              <h5>Processing Details:</h5>
              <div class="verbose-log" id="verboseLog">
                ${this.verboseMessages.map(msg => html`<div class="verbose-line ${msg.type}">${msg.text}</div>`)}
              </div>
            </div>
          ` : ''}

          <!-- Processing Options -->
          <div class="processing-options">
            <div class="option-row">
              <input 
                type="checkbox" 
                id="resetCollectionOption"
                ?disabled=${this.isLoading}>
              <label for="resetCollectionOption">Reset collection (--reset-collection)</label>
            </div>
            
            <div class="option-row">
              <input 
                type="checkbox" 
                id="verboseOption"
                ?disabled=${this.isLoading}>
              <label for="verboseOption">Verbose output (--verbose)</label>
            </div>
          </div>
        </div>

        <!-- Manual Text Input Section -->
        <div class="storage-option">
          <h4>Or Enter Text Manually:</h4>
          <div class="form-group">
            <md-outlined-text-field 
              id="textInput" 
              label="Enter your text here..." 
              type="textarea"
              rows="8">
            </md-outlined-text-field>
          </div>
          <div class="button-container">
            <md-filled-button 
              @click=${this.saveDocument}
              ?disabled=${this.isLoading}>
              ${this.isLoading ? 'Saving...' : 'Save to ChromaDB'}
            </md-filled-button>
          </div>
        </div>

        ${this.statusMessage ? html`
          <div class="status-message ${this.statusType}">${this.statusMessage}</div>
        ` : ''}
      </div>

      <!-- Query Mode -->
      <div class="mode-section ${this.activeMode === 'query' ? 'active' : ''}">
        <p>Ask questions about your stored documents:</p>

        <div class="form-group">
          <md-outlined-text-field 
            id="queryInput" 
            label="Ask a question about your documents..." 
            type="textarea"
            rows="3">
          </md-outlined-text-field>
        </div>

        <!-- Query Options -->
        <div class="query-options">
          <div class="filter-row">
            <div class="filter-group">
              <div class="minimal-slider-container">
                <div class="slider-tooltip">
                  ${this.getSliderExplanation(this.additionalContextValue)}
                </div>
                <input 
                  type="range" 
                  class="slider-input"
                  min="-10" 
                  max="50" 
                  .value=${this.additionalContextValue.toString()}
                  @input=${this.handleAdditionalContextChange}>
              </div>
            </div>
          </div>
        </div>

        <div class="button-container">
          <md-filled-button 
            @click=${this.queryDocuments}
            ?disabled=${this.isQuerying}>
            ${this.isQuerying ? 'Processing...' : 'Ask Question'}
          </md-filled-button>
        </div>

        ${this.queryStatus ? html`
          <div class="status-message ${this.queryStatusType}">${this.queryStatus}</div>
        ` : ''}

        <!-- Results Display -->
        ${this.showResults ? html`
          <div class="results-section">
            <h3>AI Response:</h3>
            <div class="response-display">${this.renderMarkdown(this.responseText)}</div>

            <h3>Retrieved Context:</h3>
            <div class="context-display">
              ${this.contextResults.length > 0 ? (() => {
                const groups = this.groupResultsByRelevance(this.contextResults);
                const relevantGroups = [
                  { key: 'strong', items: groups.strong },
                  { key: 'good', items: groups.good },
                  { key: 'weak', items: groups.weak },
                  { key: 'poor', items: groups.poor }
                ].filter(group => group.items.length > 0);

                if (relevantGroups.length === 0) {
                  // Check if user intentionally requested no context (slider <= -8)
                  const message = this.additionalContextValue <= -8 
                    ? "No relevant context requested." 
                    : "No relevant context found.";
                  return html`<div class="context-item">${message}</div>`;
                }

                return relevantGroups.map(group => {
                  const { label } = this.getRelevanceLabelAndColor(group.key);
                  return html`
                    <div class="relevance-group ${group.key}">
                      <div class="relevance-group-header">
                        <div class="relevance-group-title">${label}</div>
                        <div class="relevance-group-count">${group.items.length} document${group.items.length === 1 ? '' : 's'}</div>
                      </div>
                      <div class="relevance-group-content">
                        ${group.items.map((item) => html`
                          <div class="context-item">
                            <div class="context-header">
                            <div class="context-score">
                              Distance: ${item.distance?.toFixed(4) || 'N/A'} | 
                              Relevance: ${item.distance ? (1 - item.distance).toFixed(3) : 'N/A'}
                            </div>
                            <md-filled-button 
                              class="edit-button"
                              @click=${() => this.editDocument(item)}>
                              Edit Document
                            </md-filled-button>
                          </div>
                          ${item.metadata && Object.keys(item.metadata).length > 0 ? html`
                            <div class="context-metadata">
                              ${item.metadata.title ? html`
                                <div class="metadata-item">
                                  <span class="metadata-label">Title:</span>
                                  <span class="metadata-value">${item.metadata.title}</span>
                                </div>
                              ` : ''}
                              ${item.metadata.category ? html`
                                <div class="metadata-item">
                                  <span class="metadata-label">Category:</span>
                                  <span class="metadata-value">${item.metadata.category}</span>
                                </div>
                              ` : ''}
                              ${item.metadata.tags ? html`
                                <div class="metadata-item">
                                  <span class="metadata-label">Tags:</span>
                                  <span class="metadata-value">${item.metadata.tags}</span>
                                </div>
                              ` : ''}
                              ${item.metadata.is_a ? html`
                                <div class="metadata-item">
                                  <span class="metadata-label">Is a:</span>
                                  <span class="metadata-value">${item.metadata.is_a}</span>
                                </div>
                              ` : ''}
                              ${item.metadata.child_of ? html`
                                <div class="metadata-item">
                                  <span class="metadata-label">Child of:</span>
                                  <span class="metadata-value">${item.metadata.child_of}</span>
                                </div>
                              ` : ''}
                              ${item.metadata.has_a ? html`
                                <div class="metadata-item">
                                  <span class="metadata-label">Has a:</span>
                                  <span class="metadata-value">${item.metadata.has_a}</span>
                                </div>
                              ` : ''}
                            </div>
                          ` : ''}
                            ${this.renderMarkdown(item.document || item.text || 'No content')}
                          </div>
                        `)}
                      </div>
                    </div>
                  `;
                });
              })() : html`<div class="context-item">No relevant context found.</div>`}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Document Editor Mode -->
      <div class="mode-section ${this.activeMode === 'update' ? 'active' : ''}">
        <p>Document Editor - Create new documents or edit existing ones:</p>

        <!-- New Document Button - Hidden when editing existing document -->
        ${!this.editingDocument && !this.isCreatingNew ? html`
          <div class="new-document-section">
            <md-filled-button 
              @click=${this.startNewDocument}
              ?disabled=${this.isLoading}>
              New Document
            </md-filled-button>
          </div>
        ` : ''}

        ${this.editingDocument || this.isCreatingNew ? html`
          ${this.isCreatingNew && this.showTitleInput ? html`
            <!-- Title Input Phase -->
            <div class="title-input-section">
              <div class="title-prompt">
                What would you like to call your new document?
              </div>
              <input 
                type="text" 
                class="title-input"
                .value=${this.newDocumentTitle}
                @input=${this.handleTitleChange}
                placeholder="Enter document title..."
                title="This will become the H1 heading, filename, and metadata title">
              <md-filled-button 
                @click=${this.continueFromTitle}
                ?disabled=${!this.newDocumentTitle.trim()}>
                Continue with "${this.newDocumentTitle}"
              </md-filled-button>
            </div>
          ` : html`
            <!-- Full Document Editor -->
            <div class="document-editor-container">
              <div class="document-info">
                <h4>${this.isCreatingNew ? `Creating: ${this.newDocumentTitle || 'New Document'}` : `Editing Document: ${this.editingDocument?.id || 'Unknown ID'}`}</h4>
                ${this.editingDocument?.metadata?.title ? html`
                  <p><strong>Title:</strong> ${this.editingDocument.metadata.title}</p>
                ` : ''}
                
                <div class="metadata-editor">
                  ${this.isCreatingNew ? html`
                    <div class="filename-field">
                      <label class="filename-label" for="filename-input">
                        <strong>Filename:</strong>
                      </label>
                      <input 
                        id="filename-input"
                        type="text" 
                        class="filename-input"
                        .value=${this.newDocumentFilename}
                        @input=${this.handleFilenameChange}
                        @blur=${this.handleFilenameBlur}
                        placeholder="my_document_name"
                        title="Filename in lower_snake_case format (no .md extension needed)">
                      <span class="filename-extension">.md</span>
                    </div>
                  ` : ''}
                  
                  <tag-typeahead-input
                    label="Tags"
                    collectionType="tags"
                    .value=${this.editingTags}
                    @change=${this.handleTagsChange}
                    placeholder="keyword1, keyword2, keyword3"
                    title="Comma-separated tags for organizing and categorizing this document">
                  </tag-typeahead-input>
                  
                  <tag-typeahead-input
                    label="Category"
                    collectionType="categories"
                    .value=${this.editingCategory}
                    @change=${this.handleCategoryChange}
                    placeholder="primary"
                    title="Document category (e.g., primary, secondary, reference)">
                  </tag-typeahead-input>
                  
                  <tag-typeahead-input
                    label="Is A"
                    collectionType="ontology"
                    .value=${this.editingIsA}
                    @change=${this.handleIsAChange}
                    placeholder="concept1, concept2, concept3"
                    title="Comma-separated is-a relationships">
                  </tag-typeahead-input>
                  
                  <tag-typeahead-input
                    label="Child Of"
                    collectionType="ontology"
                    .value=${this.editingChildOf}
                    @change=${this.handleChildOfChange}
                    placeholder="parent1, parent2"
                    title="Comma-separated child-of relationships">
                  </tag-typeahead-input>
                  
                  <tag-typeahead-input
                    label="Has A"
                    collectionType="ontology"
                    .value=${this.editingHasA}
                    @change=${this.handleHasAChange}
                    placeholder="child1, child2"
                    title="Comma-separated has-a relationships">
                  </tag-typeahead-input>
                </div>
              </div>
              
              <awr-markdown-codemirror 
                .markdownContent=${this.documentContent}
                @markdown-updated=${this.handleMarkdownUpdate}
                @token-calculated=${this.handleTokenCalculated}
                @token-status-changed=${this.handleTokenStatusChanged}>
              </awr-markdown-codemirror>

              <div class="button-container">
                <md-filled-button 
                  @click=${this.saveDocumentUpdate}
                  ?disabled=${this.isLoading || this.isTokenCalculationStale || !this.hasDocumentChanged()}>
                  ${this.isLoading ? 'Saving...' : 
                    this.isTokenCalculationStale ? 'Preview Tokens First' : 
                    !this.hasDocumentChanged() ? (this.isCreatingNew ? 'Add Content First' : 'No Changes to Save') : 
                    (this.isCreatingNew ? 'Create Document' : 'Save Changes')}
                </md-filled-button>
                <md-filled-button 
                  @click=${this.cancelDocumentEdit}
                  ?disabled=${this.isLoading}>
                  Cancel
                </md-filled-button>
              </div>
            </div>
          `}
        ` : html`
          <div class="update-placeholder">
            <p>If you would like to modify an existing document, go the Query & Chat tab, make a query, scroll down to the results at the bottom, select that document to edit by clicking the "Edit Document" button in the Query results.</p>
          </div>
        `}

        ${this.statusMessage && this.activeMode === 'update' ? html`
          <div class="status-message ${this.statusType}">${this.statusMessage}</div>
        ` : ''}
      </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chroma-rag-interface': ChromaRagInterface;
  }
}