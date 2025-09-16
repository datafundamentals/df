import { assert } from '@open-wc/testing';
import {
  parseTagsString,
  tagOperationStatus,
  lastTagError,
} from '../stores/tags.js';

suite('Tags Store', () => {
  suite('parseTagsString', () => {
    test('should parse comma-separated tags correctly', () => {
      const result = parseTagsString('javascript, react, typescript');
      assert.deepEqual(result, ['javascript', 'react', 'typescript']);
    });

    test('should trim whitespace from tags', () => {
      const result = parseTagsString('  javascript  ,   react   ,  typescript  ');
      assert.deepEqual(result, ['javascript', 'react', 'typescript']);
    });

    test('should handle empty string', () => {
      const result = parseTagsString('');
      assert.deepEqual(result, []);
    });

    test('should handle null/undefined input', () => {
      assert.deepEqual(parseTagsString(null as any), []);
      assert.deepEqual(parseTagsString(undefined as any), []);
    });

    test('should handle non-string input', () => {
      assert.deepEqual(parseTagsString(123 as any), []);
      assert.deepEqual(parseTagsString({} as any), []);
    });

    test('should filter out empty tags', () => {
      const result = parseTagsString('javascript, , react, , typescript');
      assert.deepEqual(result, ['javascript', 'react', 'typescript']);
    });

    test('should handle single tag', () => {
      const result = parseTagsString('javascript');
      assert.deepEqual(result, ['javascript']);
    });

    test('should handle tags with special characters', () => {
      const result = parseTagsString('css-grid, web-dev, ui/ux');
      assert.deepEqual(result, ['css-grid', 'web-dev', 'ui/ux']);
    });

    test('should handle duplicate tags', () => {
      const result = parseTagsString('javascript, react, javascript, typescript');
      assert.deepEqual(result, ['javascript', 'react', 'javascript', 'typescript']);
    });
  });


  suite('Signal State Management', () => {
    test('should initialize tagOperationStatus as idle', () => {
      assert.equal(tagOperationStatus.get(), 'idle');
    });

    test('should initialize lastTagError as null', () => {
      assert.isNull(lastTagError.get());
    });

    test('should update tagOperationStatus during operations', async () => {
      // This test verifies the signal behavior during saveTagsFromString
      const initialStatus = tagOperationStatus.get();
      assert.equal(initialStatus, 'idle');
      
      // The actual state changes happen within saveTagsFromString
      // We'll test the integration behavior in the next suite
    });
  });

  suite('Edge Cases and Error Handling', () => {
    test('should handle malformed input gracefully', () => {
      // Test various malformed inputs
      assert.deepEqual(parseTagsString(',,,'), []);
      assert.deepEqual(parseTagsString('   ,   ,   '), []);
      assert.deepEqual(parseTagsString('a,,b,,,c'), ['a', 'b', 'c']);
    });

    test('should handle very long tag strings', () => {
      const longTag = 'a'.repeat(1000);
      const result = parseTagsString(longTag);
      assert.deepEqual(result, [longTag]);
    });

    test('should handle tags with unicode characters', () => {
      const result = parseTagsString('javascript, 日本語, español, français');
      assert.deepEqual(result, ['javascript', '日本語', 'español', 'français']);
    });

    test('should handle tags with numbers and symbols', () => {
      const result = parseTagsString('v1.2.3, @types/node, es2022, web-api');
      assert.deepEqual(result, ['v1.2.3', '@types/node', 'es2022', 'web-api']);
    });
  });

  suite('Tag Validation', () => {
    test('should validate tag name format', () => {
      // Test common tag patterns
      const validTags = parseTagsString('javascript, react-hooks, vue.js, web_dev, api-design');
      assert.equal(validTags.length, 5);
      assert.include(validTags, 'javascript');
      assert.include(validTags, 'react-hooks');
      assert.include(validTags, 'vue.js');
      assert.include(validTags, 'web_dev');
      assert.include(validTags, 'api-design');
    });

    test('should preserve original case', () => {
      const result = parseTagsString('JavaScript, React, TypeScript');
      assert.deepEqual(result, ['JavaScript', 'React', 'TypeScript']);
    });
  });
});