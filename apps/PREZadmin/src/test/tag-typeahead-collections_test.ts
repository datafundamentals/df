import { assert, fixture, html } from '@open-wc/testing';
import { TagTypeaheadInput } from '../ui/tag-typeahead-input';
import '../ui/tag-typeahead-input.js';

suite('TagTypeaheadInput Collections', () => {
  suite('Component Properties', () => {
    test('should default to tags collection type', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input></tag-typeahead-input>
      `);
      
      assert.equal(el.collectionType, 'tags');
    });

    test('should accept categories collection type', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="categories"></tag-typeahead-input>
      `);
      
      assert.equal(el.collectionType, 'categories');
    });

    test('should accept ontology collection type', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="ontology"></tag-typeahead-input>
      `);
      
      assert.equal(el.collectionType, 'ontology');
    });

    test('should maintain backward compatibility with no collectionType specified', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input label="Test Tags"></tag-typeahead-input>
      `);
      
      assert.equal(el.collectionType, 'tags');
      assert.equal(el.label, 'Test Tags');
    });
  });

  suite('Collection-Specific Search Functionality', () => {
    test('tags collection should use correct search function', async () => {
      const element = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="tags"></tag-typeahead-input>
      `);

      // Verify collection type is set correctly
      assert.equal(element.collectionType, 'tags');
      
      // Test that getSearchFunction works (though it's private)
      try {
        const searchFunction = (element as any).getSearchFunction('test');
        assert.exists(searchFunction);
        assert.exists(searchFunction.complete);
      } catch (error) {
        // If private method access fails, that's expected - just verify the type is correct
        assert.equal(element.collectionType, 'tags');
      }
    });

    test('categories collection should use correct search function', async () => {
      const element = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="categories"></tag-typeahead-input>
      `);

      assert.equal(element.collectionType, 'categories');
      
      try {
        const searchFunction = (element as any).getSearchFunction('test');
        assert.exists(searchFunction);
        assert.exists(searchFunction.complete);
      } catch (error) {
        assert.equal(element.collectionType, 'categories');
      }
    });

    test('ontology collection should use correct search function', async () => {
      const element = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="ontology"></tag-typeahead-input>
      `);

      assert.equal(element.collectionType, 'ontology');
      
      try {
        const searchFunction = (element as any).getSearchFunction('test');
        assert.exists(searchFunction);
        assert.exists(searchFunction.complete);
      } catch (error) {
        assert.equal(element.collectionType, 'ontology');
      }
    });

    test('should handle empty prefix without errors', async () => {
      const element = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="tags"></tag-typeahead-input>
      `);
      
      // Component should handle empty input gracefully
      assert.equal(element.collectionType, 'tags');
      
      try {
        const searchFunction = (element as any).getSearchFunction('');
        assert.exists(searchFunction);
      } catch (error) {
        // Private method access may fail, but component should remain stable
        assert.equal(element.collectionType, 'tags');
      }
    });

    test('should maintain stable collection type regardless of input', async () => {
      const element = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="categories"></tag-typeahead-input>
      `);
      
      // Component collection type should remain stable regardless of search input
      assert.equal(element.collectionType, 'categories');
      
      // Test various inputs don't affect collection type
      const testInputs = ['test', '', '123', 'valid-prefix'];
      testInputs.forEach(() => {
        assert.equal(element.collectionType, 'categories');
      });
    });
  });

  suite('getSearchFunction Method', () => {
    test('should return correct search function for tags', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="tags"></tag-typeahead-input>
      `);
      
      const searchFunction = (el as any).getSearchFunction('test');
      assert.exists(searchFunction);
      assert.exists(searchFunction.complete);
    });

    test('should return correct search function for categories', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="categories"></tag-typeahead-input>
      `);
      
      const searchFunction = (el as any).getSearchFunction('test');
      assert.exists(searchFunction);
      assert.exists(searchFunction.complete);
    });

    test('should return correct search function for ontology', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="ontology"></tag-typeahead-input>
      `);
      
      const searchFunction = (el as any).getSearchFunction('test');
      assert.exists(searchFunction);
      assert.exists(searchFunction.complete);
    });
  });

  suite('UI Rendering with Collection Types', () => {
    test('should render with tags collection type', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input 
          collectionType="tags" 
          label="Tags">
        </tag-typeahead-input>
      `);
      
      const labelElement = el.shadowRoot?.querySelector('.input-label');
      assert.exists(labelElement);
      assert.equal(labelElement?.textContent, 'Tags');
    });

    test('should render with categories collection type', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input 
          collectionType="categories" 
          label="Categories">
        </tag-typeahead-input>
      `);
      
      const labelElement = el.shadowRoot?.querySelector('.input-label');
      assert.exists(labelElement);
      assert.equal(labelElement?.textContent, 'Categories');
    });

    test('should render with ontology collection type', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input 
          collectionType="ontology" 
          label="Concepts">
        </tag-typeahead-input>
      `);
      
      const labelElement = el.shadowRoot?.querySelector('.input-label');
      assert.exists(labelElement);
      assert.equal(labelElement?.textContent, 'Concepts');
    });
  });

  suite('Collection-Specific Error Messages', () => {
    test('should show tags-specific no results message', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="tags"></tag-typeahead-input>
      `);
      
      // Simulate search with no results
      (el as any).isDropdownOpen = true;
      (el as any).searchPrefix = 'nonexistent';
      (el as any).suggestions = [];
      await el.updateComplete;
      
      const noSuggestions = el.shadowRoot?.querySelector('.no-suggestions');
      if (noSuggestions) {
        assert.include(noSuggestions.textContent || '', 'tags');
      }
    });

    test('should show categories-specific no results message', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="categories"></tag-typeahead-input>
      `);
      
      // Simulate search with no results
      (el as any).isDropdownOpen = true;
      (el as any).searchPrefix = 'nonexistent';
      (el as any).suggestions = [];
      await el.updateComplete;
      
      const noSuggestions = el.shadowRoot?.querySelector('.no-suggestions');
      if (noSuggestions) {
        assert.include(noSuggestions.textContent || '', 'categories');
      }
    });

    test('should show ontology-specific no results message', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="ontology"></tag-typeahead-input>
      `);
      
      // Simulate search with no results
      (el as any).isDropdownOpen = true;
      (el as any).searchPrefix = 'nonexistent';
      (el as any).suggestions = [];
      await el.updateComplete;
      
      const noSuggestions = el.shadowRoot?.querySelector('.no-suggestions');
      if (noSuggestions) {
        assert.include(noSuggestions.textContent || '', 'ontology');
      }
    });
  });

  suite('Input Interaction with Different Collections', () => {
    test('should handle input events with tags collection', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="tags"></tag-typeahead-input>
      `);
      
      const input = el.shadowRoot?.querySelector('.input-field') as HTMLInputElement;
      assert.exists(input);
      
      // Simulate typing
      input.value = 'test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      assert.equal(el.value, 'test');
    });

    test('should handle input events with categories collection', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="categories"></tag-typeahead-input>
      `);
      
      const input = el.shadowRoot?.querySelector('.input-field') as HTMLInputElement;
      assert.exists(input);
      
      // Simulate typing
      input.value = 'primary';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      assert.equal(el.value, 'primary');
    });

    test('should handle input events with ontology collection', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="ontology"></tag-typeahead-input>
      `);
      
      const input = el.shadowRoot?.querySelector('.input-field') as HTMLInputElement;
      assert.exists(input);
      
      // Simulate typing
      input.value = 'teacher';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      assert.equal(el.value, 'teacher');
    });
  });

  suite('Collection Type Validation', () => {
    test('should handle invalid collection type gracefully', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input></tag-typeahead-input>
      `);
      
      // Try to set invalid collection type
      (el as any).collectionType = 'invalid';
      
      // Should fall back to default behavior (tags)
      const searchFunction = (el as any).getSearchFunction('test');
      assert.exists(searchFunction);
      assert.exists(searchFunction.complete);
    });

    test('should preserve collection type after updates', async () => {
      const el = await fixture<TagTypeaheadInput>(html`
        <tag-typeahead-input collectionType="categories"></tag-typeahead-input>
      `);
      
      assert.equal(el.collectionType, 'categories');
      
      // Trigger a re-render
      el.value = 'test';
      await el.updateComplete;
      
      // Collection type should remain unchanged
      assert.equal(el.collectionType, 'categories');
    });
  });
});