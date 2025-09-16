/**
 * Tests for file-processing utilities
 * Critical for RAG functionality - tests parsing, serialization, and ID generation
 */

import { assert } from '@open-wc/testing';
import { 
  parseMarkdown, 
  stringifyMarkdown, 
  generateId, 
  ensureDocumentId,
  countTokens
} from '../services/file-processing.js';

suite('file-processing', () => {
  test('parseMarkdown handles frontmatter correctly', () => {
    const markdown = `---
title: Test Document
tags: test, example
category: primary
---
# Test Content

This is test content.`;

    const result = parseMarkdown(markdown);
    
    assert.equal(result.data.title, 'Test Document');
    assert.equal(result.data.tags, 'test, example');
    assert.equal(result.data.category, 'primary');
    assert.include(result.content, '# Test Content');
    assert.include(result.content, 'This is test content.');
  });

  test('parseMarkdown handles content without frontmatter', () => {
    const markdown = `# Just Content
    
No frontmatter here.`;

    const result = parseMarkdown(markdown);
    
    assert.deepEqual(result.data, {});
    assert.include(result.content, '# Just Content');
  });

  test('stringifyMarkdown recreates valid markdown', () => {
    const parsed = {
      data: { title: 'Test', category: 'primary' },
      content: '# Content\n\nBody text.'
    };

    const result = stringifyMarkdown(parsed);
    
    assert.include(result, '---');
    assert.include(result, 'title: Test');
    assert.include(result, 'category: primary');
    assert.include(result, '# Content');
  });

  test('generateId creates valid unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    
    // Should be different
    assert.notEqual(id1, id2);
    
    // Should match expected format (timestamp-letter)
    assert.match(id1, /^\d{16}-[a-z]$/);
    assert.match(id2, /^\d{16}-[a-z]$/);
  });

  test('ensureDocumentId adds ID when missing', () => {
    const markdown = `---
title: No ID Document
---
Content here.`;

    const result = ensureDocumentId(markdown);
    
    assert.isTrue(result.wasModified);
    assert.isString(result.id);
    assert.include(result.text, `id: ${result.id}`);
  });

  test('ensureDocumentId preserves existing ID', () => {
    const existingId = 'existing-id-123';
    const markdown = `---
title: Has ID Document
id: ${existingId}
---
Content here.`;

    const result = ensureDocumentId(markdown);
    
    assert.isFalse(result.wasModified);
    assert.equal(result.id, existingId);
    assert.equal(result.text, markdown);
  });

  test('countTokens provides reasonable estimates', () => {
    const shortText = 'Hello world';
    const longText = 'This is a longer text with multiple words and punctuation! It should have more tokens.';
    
    assert.equal(countTokens(shortText), 2);
    assert.isAbove(countTokens(longText), countTokens(shortText));
    assert.equal(countTokens(''), 0);
  });

  test('frontmatter field ordering is consistent', () => {
    const parsed = {
      data: { 
        id: '123',
        title: 'Test',
        category: 'primary',
        tags: 'test',
        is_a: 'example',
        child_of: 'parent',
        has_a: 'property'
      },
      content: '# Content'
    };

    const result = stringifyMarkdown(parsed);
    
    // Check that title comes before tags (per our standards)
    const titleIndex = result.indexOf('title:');
    const tagsIndex = result.indexOf('tags:');
    assert.isBelow(titleIndex, tagsIndex);
    
    // Check that metadata fields appear before id
    const categoryIndex = result.indexOf('category:');
    const idIndex = result.indexOf('id:');
    assert.isBelow(categoryIndex, idIndex);
  });
});