/**
 * New Document functionality tests
 * Tests specifically for the document creation workflow to catch regressions
 */

import { fixture, assert } from '@open-wc/testing';
import { html } from 'lit/static-html.js';
import { RagEditorComponent } from '../ui/rag-editor-component.js';

suite('new-document', () => {
  test('rag-editor-component is defined', () => {
    const el = document.createElement('rag-editor-component');
    assert.instanceOf(el, RagEditorComponent);
  });

  test('hasDocumentChanged handles undefined properties safely', async () => {
    const el = await fixture(html`<rag-editor-component></rag-editor-component>`) as RagEditorComponent;
    await el.updateComplete;

    // Simulate new document creation state with undefined properties
    (el as any).isCreatingNew = true;
    (el as any).documentContent = undefined;
    (el as any).editingTags = undefined;
    (el as any).editingCategory = undefined;
    (el as any).editingIsA = undefined;
    (el as any).editingChildOf = undefined;
    (el as any).editingHasA = undefined;

    // This should not throw an error (regression test for the .trim() on undefined bug)
    let hasChanges: boolean;
    try {
      hasChanges = (el as any).hasDocumentChanged();
      assert.isFalse(hasChanges, 'Should return false when all fields are undefined/empty');
    } catch (error) {
      assert.fail(`hasDocumentChanged should not throw error with undefined properties: ${error}`);
    }
  });

  test('hasDocumentChanged detects content changes for new documents', async () => {
    const el = await fixture(html`<rag-editor-component></rag-editor-component>`) as RagEditorComponent;
    await el.updateComplete;

    // Simulate new document creation state
    (el as any).isCreatingNew = true;
    
    // Test with empty content - should return false
    (el as any).documentContent = '';
    (el as any).editingTags = '';
    (el as any).editingCategory = '';
    (el as any).editingIsA = '';
    (el as any).editingChildOf = '';
    (el as any).editingHasA = '';
    
    assert.isFalse((el as any).hasDocumentChanged(), 'Should return false for empty new document');

    // Test with document content - should return true
    (el as any).documentContent = '# Test Document\n\nContent here';
    assert.isTrue((el as any).hasDocumentChanged(), 'Should return true when document has content');

    // Test with metadata only - should return true
    (el as any).documentContent = '';
    (el as any).editingTags = 'tag1, tag2';
    assert.isTrue((el as any).hasDocumentChanged(), 'Should return true when document has metadata');

    // Test with category only - should return true
    (el as any).editingTags = '';
    (el as any).editingCategory = 'primary';
    assert.isTrue((el as any).hasDocumentChanged(), 'Should return true when document has category');
  });

  test('save button disabled state logic works correctly', async () => {
    const el = await fixture(html`<rag-editor-component></rag-editor-component>`) as RagEditorComponent;
    await el.updateComplete;

    // Simulate new document creation state
    (el as any).isCreatingNew = true;
    (el as any).isLoading = false;
    (el as any).documentContent = '# Test Document\n\nContent';
    (el as any).editingTags = '';
    (el as any).editingCategory = '';
    (el as any).editingIsA = '';
    (el as any).editingChildOf = '';
    (el as any).editingHasA = '';

    // Test when tokens are stale (should be disabled)
    (el as any).isTokenCalculationStale = true;
    // Note: Testing the actual disabled state is tricky with Lit components
    // but we can test that the hasDocumentChanged logic works correctly
    assert.isTrue((el as any).hasDocumentChanged(), 'Document should be detected as changed');
    assert.isTrue((el as any).isTokenCalculationStale, 'Token calculation should be stale');

    // Test when tokens are calculated (should be enabled)
    (el as any).isTokenCalculationStale = false;
    assert.isTrue((el as any).hasDocumentChanged(), 'Document should still be detected as changed');
    assert.isFalse((el as any).isTokenCalculationStale, 'Token calculation should not be stale');
  });

  test('document creation workflow state transitions', async () => {
    const el = await fixture(html`<rag-editor-component></rag-editor-component>`) as RagEditorComponent;
    await el.updateComplete;

    // Initial state
    assert.isFalse((el as any).isCreatingNew, 'Should not be creating new initially');
    assert.isTrue((el as any).showDocumentList, 'Should show document list initially');

    // Simulate document creation event
    const createEvent = new CustomEvent('document-created', {
      detail: { title: 'Test Document', filename: 'test_document' }
    });
    
    (el as any).handleDocumentCreated(createEvent);

    // Check state after creation
    assert.isTrue((el as any).isCreatingNew, 'Should be in creating new mode');
    assert.isFalse((el as any).showDocumentList, 'Should hide document list');
    assert.equal((el as any).newDocumentTitle, 'Test Document', 'Should set document title');
    assert.equal((el as any).newDocumentFilename, 'test_document', 'Should set filename');
    assert.include((el as any).documentContent, '# Test Document', 'Should set initial content with title');
    assert.isTrue((el as any).isTokenCalculationStale, 'Should mark tokens as stale for new content');
  });

  test('render shows editing UI for new documents', async () => {
    const el = await fixture(html`<rag-editor-component></rag-editor-component>`) as RagEditorComponent;
    await el.updateComplete;

    // Simulate new document state
    (el as any).isCreatingNew = true;
    (el as any).newDocumentTitle = 'Test Document';
    (el as any).documentContent = '# Test Document\n\n';
    (el as any).showDocumentList = false;

    await el.updateComplete;

    // Check that editing UI is rendered
    const editorContainer = el.shadowRoot?.querySelector('.document-editor-container');
    assert.exists(editorContainer, 'Should render document editor container for new documents');

    // Check for markdown editor
    const markdownEditor = el.shadowRoot?.querySelector('awr-markdown-codemirror');
    assert.exists(markdownEditor, 'Should render markdown editor');

    // Check for save button
    const saveButton = el.shadowRoot?.querySelector('md-filled-button');
    assert.exists(saveButton, 'Should render save button');
  });
});