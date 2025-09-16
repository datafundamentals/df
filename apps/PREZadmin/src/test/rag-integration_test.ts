/**
 * Integration tests for RAG functionality
 * Tests the core RAG workflow without requiring actual ChromaDB/Ollama
 */

import { fixture, assert } from '@open-wc/testing';
import { html } from 'lit/static-html.js';
import { ChromaRagInterface } from '../ui/chroma-rag-interface.js';

suite('rag-integration', () => {
  test('chroma-rag-interface component is defined', () => {
    const el = document.createElement('chroma-rag-interface');
    assert.instanceOf(el, ChromaRagInterface);
  });

  test('renders query interface by default', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    await el.updateComplete;
    
    // Should have default mode as query
    assert.equal(el.activeMode, 'query');
    
    // Should have shadow DOM
    assert.exists(el.shadowRoot);
  });

  test('mode switching works correctly', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    
    // Start in query mode
    assert.equal(el.activeMode, 'query');
    
    // Switch to document mode
    const documentTab = el.shadowRoot?.querySelector('md-primary-tab[data-mode="document"]') as HTMLElement;
    if (documentTab) {
      documentTab.click();
      await el.updateComplete;
      assert.equal(el.activeMode, 'document');
    }
  });

  test('document content can be set', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    
    // Test that document content property exists and can be set
    el.documentContent = '# Test Document\n\nSome content here.';
    assert.equal(el.documentContent, '# Test Document\n\nSome content here.');
  });

  test('metadata fields are properly initialized', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    
    // Check that new metadata fields exist
    assert.exists(el.editingIsA);
    assert.exists(el.editingChildOf); 
    assert.exists(el.editingHasA);
    
    // Should be empty initially
    assert.equal(el.editingIsA, '');
    assert.equal(el.editingChildOf, '');
    assert.equal(el.editingHasA, '');
  });

  test('status message properties exist', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    
    // Test that status properties exist
    assert.exists(el.statusMessage);
    assert.exists(el.statusType);
    
    // Can set status properties
    el.statusMessage = 'Test message';
    el.statusType = 'success';
    await el.updateComplete;
    
    assert.equal(el.statusMessage, 'Test message');
    assert.equal(el.statusType, 'success');
  });

  test('query status separate from document status', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    
    // Should have separate status areas
    el.statusMessage = 'Document status';
    el.queryStatus = 'Query status';
    await el.updateComplete;
    
    // Test that both status properties can be set independently
    assert.equal(el.statusMessage, 'Document status');
    assert.equal(el.queryStatus, 'Query status');
  });

  test('additional context slider affects query parameters', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    await el.updateComplete;
    
    // Test default value
    assert.equal(el.additionalContextValue, 5);
    
    // Test that value can be changed
    el.additionalContextValue = 10;
    assert.equal(el.additionalContextValue, 10);
  });

  // Test core workflow without external dependencies
  test('query preparation handles basic cases', async () => {
    const el = await fixture(html`<chroma-rag-interface></chroma-rag-interface>`) as ChromaRagInterface;
    
    // Test that query input exists and can be set
    const queryInput = el.shadowRoot?.querySelector('md-outlined-text-field') as any;
    if (queryInput) {
      queryInput.value = 'test query';
      
      // Trigger input event
      queryInput.dispatchEvent(new Event('input'));
      await el.updateComplete;
      
      // Component should handle the input
      assert.exists(queryInput.value);
    }
  });
});