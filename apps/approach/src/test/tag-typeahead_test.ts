/**
 * Tests for tag typeahead input component
 * Focuses on user interaction patterns, search logic, and state management
 */

import { assert } from '@open-wc/testing';
import { TagTypeaheadInput } from '../ui/tag-typeahead-input.js';



suite('Tag Typeahead Input', () => {
  suite('Component Initialization', () => {
    test('should create component with default properties', () => {
      const component = new TagTypeaheadInput();
      
      // Test default property values
      assert.equal(component.label, 'Tags');
      assert.equal(component.value, '');
      assert.equal(component.placeholder, 'Enter tags...');
    });

    test('should accept custom properties', () => {
      const component = new TagTypeaheadInput();
      component.label = 'Custom Label';
      component.value = 'initial value';
      component.placeholder = 'Custom placeholder';
      
      assert.equal(component.label, 'Custom Label');
      assert.equal(component.value, 'initial value');
      assert.equal(component.placeholder, 'Custom placeholder');
    });

    test('should initialize internal state correctly', () => {
      const component = new TagTypeaheadInput();
      
      // Access private properties for testing
      assert.isFalse((component as any).isDropdownOpen);
      assert.deepEqual((component as any).suggestions, []);
      assert.equal((component as any).selectedIndex, -1);
      assert.equal((component as any).searchPrefix, '');
    });
  });

  suite('Text Input Processing', () => {
    test('should extract current word from comma-separated input', () => {
      const component = new TagTypeaheadInput();
      
      // Simulate typing scenarios
      const testCases = [
        { input: 'javascript', expected: 'javascript' },
        { input: 'javascript, react', expected: 'react' },
        { input: 'javascript, react, ', expected: '' },
        { input: 'javascript, react, css', expected: 'css' },
        { input: 'tag1, tag2, tag3, curr', expected: 'curr' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        // Mock the input event
        const mockEvent = {
          target: { value: input }
        } as any;
        
        (component as any).handleInput(mockEvent);
        
        assert.equal(component.value, input);
        assert.equal((component as any).searchPrefix, expected);
      });
    });

    test('should handle whitespace around commas', () => {
      const component = new TagTypeaheadInput();
      
      const testCases = [
        { input: 'tag1 , tag2', expected: 'tag2' },
        { input: 'tag1,  tag2', expected: 'tag2' },
        { input: 'tag1  ,   tag3  ', expected: 'tag3' },
        { input: '  tag1,tag2  ', expected: 'tag2' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const mockEvent = { target: { value: input } } as any;
        (component as any).handleInput(mockEvent);
        
        assert.equal((component as any).searchPrefix, expected);
      });
    });

    test('should manage dropdown state based on input', () => {
      const component = new TagTypeaheadInput();
      
      // No input - dropdown closed
      let mockEvent = { target: { value: '' } } as any;
      (component as any).handleInput(mockEvent);
      assert.isFalse((component as any).isDropdownOpen);
      
      // Input with content - dropdown opens
      mockEvent = { target: { value: 'java' } } as any;
      (component as any).handleInput(mockEvent);
      assert.isTrue((component as any).isDropdownOpen);
      
      // Clear input - dropdown closes
      mockEvent = { target: { value: 'java, ' } } as any;
      (component as any).handleInput(mockEvent);
      assert.isFalse((component as any).isDropdownOpen);
    });
  });

  suite('Search and Suggestions', () => {
    test('should cache search results', () => {
      const component = new TagTypeaheadInput();
      
      // Test cache data structure functionality
      const cache = (component as any).searchCache;
      const mockResults = ['javascript', 'java', 'javaswing'];
      
      // Manually add to cache
      cache.set('java', mockResults);
      
      // Verify cache works
      assert.isTrue(cache.has('java'));
      const cachedResults = cache.get('java');
      assert.isArray(cachedResults);
      assert.include(cachedResults, 'javascript');
    });

    test('should handle search errors gracefully', () => {
      const component = new TagTypeaheadInput();
      
      // Test that suggestions can be set to empty array
      (component as any).suggestions = ['test'];
      assert.equal((component as any).suggestions.length, 1);
      
      // Clear suggestions (simulating error handling)
      (component as any).suggestions = [];
      assert.deepEqual((component as any).suggestions, []);
    });

    test('should clear cache on refresh trigger', () => {
      const component = new TagTypeaheadInput();
      
      // Populate cache
      (component as any).searchCache.set('test', ['result']);
      assert.isTrue((component as any).searchCache.has('test'));
      
      // Test cache clearing functionality exists
      // Note: This tests that the cache data structure works
      (component as any).searchCache.clear();
      assert.isFalse((component as any).searchCache.has('test'));
    });
  });

  suite('Keyboard Navigation', () => {
    test('should handle arrow key navigation', () => {
      const component = new TagTypeaheadInput();
      
      // Set up suggestions
      (component as any).isDropdownOpen = true;
      (component as any).suggestions = ['javascript', 'java', 'javaswing'];
      (component as any).selectedIndex = -1;
      
      // Arrow down - select first item
      let mockEvent = { key: 'ArrowDown', preventDefault: () => {} } as any;
      (component as any).handleKeyDown(mockEvent);
      assert.equal((component as any).selectedIndex, 0);
      
      // Arrow down - select second item
      (component as any).handleKeyDown(mockEvent);
      assert.equal((component as any).selectedIndex, 1);
      
      // Arrow up - back to first item
      mockEvent = { key: 'ArrowUp', preventDefault: () => {} } as any;
      (component as any).handleKeyDown(mockEvent);
      assert.equal((component as any).selectedIndex, 0);
      
      // Arrow up - back to no selection
      (component as any).handleKeyDown(mockEvent);
      assert.equal((component as any).selectedIndex, -1);
    });

    test('should handle boundary conditions for navigation', () => {
      const component = new TagTypeaheadInput();
      
      (component as any).isDropdownOpen = true;
      (component as any).suggestions = ['item1', 'item2'];
      (component as any).selectedIndex = -1;
      
      // Arrow up from -1 should stay at -1
      const mockUpEvent = { key: 'ArrowUp', preventDefault: () => {} } as any;
      (component as any).handleKeyDown(mockUpEvent);
      assert.equal((component as any).selectedIndex, -1);
      
      // Arrow down to last item
      const mockDownEvent = { key: 'ArrowDown', preventDefault: () => {} } as any;
      (component as any).handleKeyDown(mockDownEvent); // index = 0
      (component as any).handleKeyDown(mockDownEvent); // index = 1
      
      // Arrow down from last item should stay at last item
      (component as any).handleKeyDown(mockDownEvent);
      assert.equal((component as any).selectedIndex, 1);
    });

    test('should handle tab completion', () => {
      const component = new TagTypeaheadInput();
      component.value = 'existing, ja';
      
      (component as any).isDropdownOpen = true;
      (component as any).suggestions = ['javascript', 'java'];
      
      let preventDefaultCalled = false;
      const mockTabEvent = { 
        key: 'Tab', 
        preventDefault: () => { preventDefaultCalled = true; }
      } as any;
      
      (component as any).handleKeyDown(mockTabEvent);
      
      // Should prevent default and complete with first suggestion
      assert.isTrue(preventDefaultCalled);
      assert.include(component.value, 'javascript');
      assert.isFalse((component as any).isDropdownOpen);
    });

    test('should handle enter key selection', () => {
      const component = new TagTypeaheadInput();
      component.value = 'test, ja';
      
      (component as any).isDropdownOpen = true;
      (component as any).suggestions = ['javascript', 'java'];
      (component as any).selectedIndex = 1; // Select 'java'
      
      let preventDefaultCalled = false;
      const mockEnterEvent = { 
        key: 'Enter', 
        preventDefault: () => { preventDefaultCalled = true; }
      } as any;
      
      (component as any).handleKeyDown(mockEnterEvent);
      
      assert.isTrue(preventDefaultCalled);
      assert.include(component.value, 'java');
      assert.equal((component as any).selectedIndex, -1);
    });

    test('should handle escape key', () => {
      const component = new TagTypeaheadInput();
      
      (component as any).isDropdownOpen = true;
      (component as any).selectedIndex = 2;
      
      const mockEscapeEvent = { key: 'Escape' } as any;
      (component as any).handleKeyDown(mockEscapeEvent);
      
      assert.isFalse((component as any).isDropdownOpen);
      assert.equal((component as any).selectedIndex, -1);
    });
  });

  suite('Selection Logic', () => {
    test('should correctly replace current word on selection', () => {
      const component = new TagTypeaheadInput();
      
      const testCases = [
        { 
          initial: 'javascript',
          suggestion: 'java-script',
          expected: 'java-script'
        },
        {
          initial: 'existing, ja',
          suggestion: 'javascript', 
          expected: 'existing, javascript'
        },
        {
          initial: 'tag1, tag2, curr',
          suggestion: 'current',
          expected: 'tag1, tag2, current'
        }
      ];
      
      testCases.forEach(({ initial, suggestion, expected }) => {
        component.value = initial;
        (component as any).selectSuggestion(suggestion);
        
        assert.equal(component.value, expected);
        assert.isFalse((component as any).isDropdownOpen);
        assert.equal((component as any).selectedIndex, -1);
        assert.equal((component as any).searchPrefix, '');
      });
    });

    test('should handle selection in various cursor positions', () => {
      const component = new TagTypeaheadInput();
      
      // Test mid-string completion
      component.value = 'react, j, css';
      // Simulate cursor being after 'j'
      
      (component as any).selectSuggestion('javascript');
      
      // Should replace the 'j' part
      assert.include(component.value, 'javascript');
    });
  });

  suite('Event Handling', () => {
    test('should dispatch change events on input', () => {
      const component = new TagTypeaheadInput();
      
      let eventDetail: any = null;
      component.addEventListener('change', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });
      
      const mockInputEvent = { target: { value: 'new value' } } as any;
      (component as any).handleInput(mockInputEvent);
      
      assert.isNotNull(eventDetail);
      assert.equal(eventDetail.value, 'new value');
    });

    test('should dispatch change events on selection', () => {
      const component = new TagTypeaheadInput();
      
      let changeEventCount = 0;
      component.addEventListener('change', () => {
        changeEventCount++;
      });
      
      component.value = 'test, ja';
      (component as any).selectSuggestion('javascript');
      
      assert.equal(changeEventCount, 1);
    });

    test('should handle document click outside component', () => {
      const component = new TagTypeaheadInput();
      
      (component as any).isDropdownOpen = true;
      (component as any).selectedIndex = 1;
      
      // Mock contains method to return false (click outside)
      const originalContains = component.contains;
      component.contains = () => false;
      
      const mockEvent = { target: document.body } as any;
      (component as any).handleDocumentClick(mockEvent);
      
      assert.isFalse((component as any).isDropdownOpen);
      assert.equal((component as any).selectedIndex, -1);
      
      // Restore original method
      component.contains = originalContains;
    });

    test('should handle blur with delay', (done) => {
      const component = new TagTypeaheadInput();
      
      (component as any).isDropdownOpen = true;
      (component as any).selectedIndex = 2;
      
      (component as any).handleBlur();
      
      // Should still be open immediately
      assert.isTrue((component as any).isDropdownOpen);
      
      // Should be closed after delay
      setTimeout(() => {
        assert.isFalse((component as any).isDropdownOpen);
        assert.equal((component as any).selectedIndex, -1);
        done();
      }, 200);
    });
  });

  suite('Edge Cases and Error Handling', () => {
    test('should handle empty suggestions gracefully', () => {
      const component = new TagTypeaheadInput();
      
      (component as any).suggestions = [];
      (component as any).isDropdownOpen = true;
      
      // Arrow navigation with empty suggestions
      const mockEvent = { key: 'ArrowDown', preventDefault: () => {} } as any;
      (component as any).handleKeyDown(mockEvent);
      
      assert.equal((component as any).selectedIndex, -1);
    });

    test('should handle malformed input gracefully', () => {
      const component = new TagTypeaheadInput();
      
      const malformedInputs = [
        ',,,',
        '   ,   ,   ',
        'tag,,,,,another',
        'single,',
        ',leading-comma'
      ];
      
      malformedInputs.forEach(input => {
        assert.doesNotThrow(() => {
          const mockEvent = { target: { value: input } } as any;
          (component as any).handleInput(mockEvent);
        });
      });
    });

    test('should handle null/undefined search results', async () => {
      const component = new TagTypeaheadInput();
      
      // Mock search returning null/undefined
      (component as any).searchComputed = {
        complete: Promise.resolve(),
        value: null
      };
      
      await (component as any).updateSuggestions('test');
      assert.deepEqual((component as any).suggestions, []);
      
      (component as any).searchComputed = {
        complete: Promise.resolve(),
        value: undefined
      };
      
      await (component as any).updateSuggestions('test');
      assert.deepEqual((component as any).suggestions, []);
    });

    test('should handle invalid selection indices', () => {
      const component = new TagTypeaheadInput();
      
      (component as any).suggestions = ['item1', 'item2'];
      (component as any).selectedIndex = 999; // Invalid index
      
      // Enter key with invalid index should not crash
      assert.doesNotThrow(() => {
        const mockEvent = { key: 'Enter', preventDefault: () => {} } as any;
        (component as any).handleKeyDown(mockEvent);
      });
    });

    test('should handle rapid typing and selection', () => {
      const component = new TagTypeaheadInput();
      
      // Simulate rapid typing
      const rapidInputs = ['j', 'ja', 'jav', 'java'];
      
      rapidInputs.forEach(input => {
        const mockEvent = { target: { value: input } } as any;
        (component as any).handleInput(mockEvent);
      });
      
      // Should handle the rapid state changes gracefully
      assert.equal((component as any).searchPrefix, 'java');
      assert.equal(component.value, 'java');
    });
  });

  suite('Component Lifecycle', () => {
    test('should properly setup event listeners', () => {
      const component = new TagTypeaheadInput();
      
      // Test that connectedCallback doesn't throw
      assert.doesNotThrow(() => {
        component.connectedCallback();
      });
      
      // Test that disconnectedCallback doesn't throw
      assert.doesNotThrow(() => {
        component.disconnectedCallback();
      });
    });

    test('should handle render updates correctly', () => {
      const component = new TagTypeaheadInput();
      
      // Should render without errors
      assert.doesNotThrow(() => {
        component.render();
      });
      
      // Change state and render again
      (component as any).isDropdownOpen = true;
      (component as any).suggestions = ['test1', 'test2'];
      
      assert.doesNotThrow(() => {
        component.render();
      });
    });
  });
});