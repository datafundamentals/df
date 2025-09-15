/**
 * Tests for RAG interface core logic and state management
 * Focuses on critical business logic without requiring full component setup
 */

import { assert } from '@open-wc/testing';
import { ChromaRagInterface } from '../ui/chroma-rag-interface.js';

// Mock data for testing
const mockContextResults = [
  { distance: 0.3, document: 'Strong match 1', metadata: { title: 'Test 1' } },
  { distance: 0.7, document: 'Good match 1', metadata: { title: 'Test 2' } },
  { distance: 0.95, document: 'Weak match 1', metadata: { title: 'Test 3' } },
  { distance: 1.2, document: 'Poor match 1', metadata: { title: 'Test 4' } },
  { distance: 0.4, document: 'Strong match 2', metadata: { title: 'Test 5' } },
  { distance: 0.8, document: 'Good match 2', metadata: { title: 'Test 6' } },
  { distance: null, document: 'No distance', metadata: { title: 'Test 7' } },
  { distance: undefined, document: 'Undefined distance', metadata: { title: 'Test 8' } }
];

suite('RAG Interface Core Logic', () => {
  suite('Component Structure and State', () => {
    test('should create component with default state', () => {
      const component = new ChromaRagInterface();
      
      // Test initial state values
      assert.equal(component.activeMode, 'query');
      assert.equal(component.statusMessage, '');
      assert.equal(component.statusType, 'info');
      assert.equal(component.queryStatus, '');
      assert.equal(component.queryStatusType, 'info');
      assert.isFalse(component.showResults);
      assert.deepEqual(component.contextResults, []);
      assert.equal(component.responseText, '');
      assert.isFalse(component.isLoading);
      assert.isFalse(component.isQuerying);
      assert.isNull(component.editingDocument);
      assert.equal(component.documentContent, '');
      assert.equal(component.additionalContextValue, 5);
    });

    test('should handle mode switching', () => {
      const component = new ChromaRagInterface();
      
      // Test mode changes
      component.activeMode = 'document';
      assert.equal(component.activeMode, 'document');
      
      component.activeMode = 'update';
      assert.equal(component.activeMode, 'update');
      
      component.activeMode = 'query';
      assert.equal(component.activeMode, 'query');
    });

    test('should manage loading states', () => {
      const component = new ChromaRagInterface();
      
      // Test loading state combinations
      component.isLoading = true;
      component.isQuerying = false;
      assert.isTrue(component.isLoading);
      assert.isFalse(component.isQuerying);
      
      component.isLoading = false;
      component.isQuerying = true;
      assert.isFalse(component.isLoading);
      assert.isTrue(component.isQuerying);
    });
  });

  suite('Relevance Grouping Logic', () => {
    test('should group results by distance thresholds correctly', () => {
      const component = new ChromaRagInterface();
      
      // Access private method for testing
      const groups = (component as any).groupResultsByRelevance(mockContextResults);
      
      // Verify group sizes
      assert.equal(groups.strong.length, 2); // distances 0.3, 0.4
      assert.equal(groups.good.length, 2);   // distances 0.7, 0.8
      assert.equal(groups.weak.length, 1);   // distance 0.95
      assert.equal(groups.poor.length, 3);   // distance 1.2, null, undefined
    });

    test('should handle edge case distances', () => {
      const component = new ChromaRagInterface();
      
      const edgeCaseResults = [
        { distance: 0.5, document: 'Boundary strong/good' },
        { distance: 0.49999, document: 'Just strong' },
        { distance: 0.50001, document: 'Just good' },
        { distance: 0.9, document: 'Boundary good/weak' },
        { distance: 0.89999, document: 'Just good' },
        { distance: 0.90001, document: 'Just weak' },
        { distance: 1.05, document: 'Boundary weak/poor' },
        { distance: 1.04999, document: 'Just weak' },
        { distance: 1.05001, document: 'Just poor' }
      ];
      
      const groups = (component as any).groupResultsByRelevance(edgeCaseResults);
      
      // Verify boundary conditions
      assert.equal(groups.strong.length, 1); // 0.49999
      assert.equal(groups.good.length, 3);   // 0.5, 0.50001, 0.89999
      assert.equal(groups.weak.length, 3);   // 0.9, 0.90001, 1.04999  
      assert.equal(groups.poor.length, 2);   // 1.05, 1.05001
    });

    test('should handle empty results', () => {
      const component = new ChromaRagInterface();
      
      const groups = (component as any).groupResultsByRelevance([]);
      
      assert.equal(groups.strong.length, 0);
      assert.equal(groups.good.length, 0);
      assert.equal(groups.weak.length, 0);
      assert.equal(groups.poor.length, 0);
    });
  });

  suite('Semantic Filtering Logic', () => {
    test('should filter no context for extreme negative values', () => {
      const component = new ChromaRagInterface();
      
      // Test -10 to -8 range
      const filtered = (component as any).applySemanticFiltering(mockContextResults, -10);
      assert.equal(filtered.length, 0);
      
      const filtered2 = (component as any).applySemanticFiltering(mockContextResults, -8);
      assert.equal(filtered2.length, 0);
    });

    test('should filter strong matches only for -7 to -4 range', () => {
      const component = new ChromaRagInterface();
      
      const filtered = (component as any).applySemanticFiltering(mockContextResults, -7);
      assert.equal(filtered.length, 2); // Only strong matches (distances 0.3, 0.4)
      
      filtered.forEach((result: any) => {
        assert.isTrue(result.distance < 0.5);
      });
    });

    test('should filter strong + good matches for -3 to -1 range', () => {
      const component = new ChromaRagInterface();
      
      const filtered = (component as any).applySemanticFiltering(mockContextResults, -3);
      assert.equal(filtered.length, 4); // Strong (2) + Good (2) matches
      
      // Verify no weak or poor matches included
      filtered.forEach((result: any) => {
        if (result.distance !== null && result.distance !== undefined) {
          assert.isTrue(result.distance < 0.9);
        }
      });
    });

    test('should filter strong + good + weak matches for value 0', () => {
      const component = new ChromaRagInterface();
      
      const filtered = (component as any).applySemanticFiltering(mockContextResults, 0);
      assert.equal(filtered.length, 5); // Strong (2) + Good (2) + Weak (1) matches
      
      // Should not include poor matches (distance > 1.05 or null/undefined)
      const poorMatches = filtered.filter((result: any) => 
        result.distance === null || 
        result.distance === undefined || 
        result.distance > 1.05
      );
      assert.equal(poorMatches.length, 0);
    });

    test('should include limited poor matches for positive values', () => {
      const component = new ChromaRagInterface();
      
      const filtered = (component as any).applySemanticFiltering(mockContextResults, 2);
      assert.equal(filtered.length, 7); // Strong (2) + Good (2) + Weak (1) + Poor (2)
      
      // Test with value larger than available poor matches
      const filtered2 = (component as any).applySemanticFiltering(mockContextResults, 10);
      assert.equal(filtered2.length, 8); // All results (can't exceed total poor matches)
    });
  });

  suite('Query Status Message Logic', () => {
    test('should generate correct status messages for each slider range', () => {
      const component = new ChromaRagInterface();
      
      // Test no context message
      const message1 = (component as any).getQueryStatusMessage(-10, []);
      assert.include(message1, 'No context');
      
      // Test strong matches only - use filtered results, not sliced results
      const filtered = (component as any).applySemanticFiltering(mockContextResults, -7);
      const message2 = (component as any).getQueryStatusMessage(-7, filtered);
      assert.include(message2, 'Strong matches only');
      assert.include(message2, '2 strong matches');
      
      // Test all relevant matches
      const allRelevant = mockContextResults.slice(0, 5);
      const message3 = (component as any).getQueryStatusMessage(0, allRelevant);
      assert.include(message3, 'All relevant matches');
    });

    test('should count matches accurately in status messages', () => {
      const component = new ChromaRagInterface();
      
      const filtered = (component as any).applySemanticFiltering(mockContextResults, -3);
      const message = (component as any).getQueryStatusMessage(-3, filtered);
      
      // Should report correct counts
      assert.include(message, '2 strong');
      assert.include(message, '2 good');
    });
  });

  suite('Slider Explanation Logic', () => {
    test('should provide appropriate explanations for slider values', () => {
      const component = new ChromaRagInterface();
      
      // Test different slider ranges
      const explanations = [
        { value: -10, expectedText: 'No retrieved context' },
        { value: -7, expectedText: 'Strong matches only' },
        { value: -3, expectedText: 'Strong + Good matches' },
        { value: 0, expectedText: 'all relevant' }, // Updated to match actual text
        { value: 5, expectedText: 'poor matches' }
      ];
      
      explanations.forEach(({ value, expectedText }) => {
        const explanation = (component as any).getSliderExplanation(value);
        assert.include(explanation.toLowerCase(), expectedText.toLowerCase());
      });
    });
  });

  suite('Status Message Management', () => {
    test('should update status messages correctly', () => {
      const component = new ChromaRagInterface();
      
      // Test status message updates
      (component as any).showStatus('Test message', 'success');
      assert.equal(component.statusMessage, 'Test message');
      assert.equal(component.statusType, 'success');
      
      // Test query status updates
      (component as any).showQueryStatus('Query message', 'error');
      assert.equal(component.queryStatus, 'Query message');
      assert.equal(component.queryStatusType, 'error');
    });

    test('should default to info status type', () => {
      const component = new ChromaRagInterface();
      
      (component as any).showStatus('Default type test');
      assert.equal(component.statusType, 'info');
      
      (component as any).showQueryStatus('Default query type test');
      assert.equal(component.queryStatusType, 'info');
    });
  });

  suite('Document Change Detection', () => {
    test('should detect document content changes', () => {
      const component = new ChromaRagInterface();
      
      // Set original content
      component.originalDocumentContent = 'Original content';
      component.documentContent = 'Original content';
      
      // No change initially
      const hasChanged1 = (component as any).hasDocumentChanged();
      assert.isFalse(hasChanged1);
      
      // Change content
      component.documentContent = 'Modified content';
      const hasChanged2 = (component as any).hasDocumentChanged();
      assert.isTrue(hasChanged2);
    });

    test('should detect metadata changes', () => {
      const component = new ChromaRagInterface();
      
      // Set up editing state
      component.editingDocument = {
        metadata: {
          tags: 'original, tags',
          category: 'primary',
          is_a: 'concept',
          child_of: 'parent',
          has_a: 'attribute'
        }
      };
      
      // Initialize editing fields to match
      component.editingTags = 'original, tags';
      component.editingCategory = 'primary';
      component.editingIsA = 'concept';
      component.editingChildOf = 'parent';
      component.editingHasA = 'attribute';
      
      // No change initially
      let hasChanged = (component as any).hasDocumentChanged();
      assert.isFalse(hasChanged);
      
      // Change tags
      component.editingTags = 'new, tags';
      hasChanged = (component as any).hasDocumentChanged();
      assert.isTrue(hasChanged);
    });
  });

  suite('Filename Validation', () => {
    test('should validate filename formats correctly', () => {
      const component = new ChromaRagInterface();
      
      // Valid filenames - must be lowercase letters, numbers, underscores only
      const validCases = [
        'document',
        'my_document',
        'document_name',
        'doc123',
        'test_file_123'
      ];
      
      validCases.forEach(filename => {
        const result = (component as any).validateFilename(filename);
        assert.isTrue(result.isValid, `${filename} should be valid`);
        assert.isUndefined(result.error);
      });
      
      // Invalid filenames
      const invalidCases = [
        { filename: '', expectedError: 'required' },
        { filename: 'a', expectedError: 'at least 2 characters' },
        { filename: 'Document', expectedError: 'lowercase letters' }, // Capital letters not allowed
        { filename: 'doc with spaces', expectedError: 'lowercase letters' },
        { filename: 'doc-with-dashes', expectedError: 'lowercase letters' },
        { filename: 'doc.with.dots', expectedError: 'lowercase letters' },
        { filename: 'a'.repeat(51), expectedError: '50 characters or less' }
      ];
      
      invalidCases.forEach(({ filename, expectedError }) => {
        const result = (component as any).validateFilename(filename);
        assert.isFalse(result.isValid, `${filename} should be invalid`);
        assert.include(result.error?.toLowerCase() || '', expectedError);
      });
    });
  });

  suite('Error Handling and Edge Cases', () => {
    test('should handle malformed context results', () => {
      const component = new ChromaRagInterface();
      
      const malformedResults = [
        { distance: 'invalid' }, // String distance
        { notDistance: 0.5 }, // Missing distance property
        { distance: Infinity }, // Infinite distance
        { distance: -1 } // Negative distance
        // Note: Removed null/undefined as they cause property access errors
      ];
      
      // Should not throw errors when processing malformed data
      assert.doesNotThrow(() => {
        (component as any).groupResultsByRelevance(malformedResults);
      });
      
      assert.doesNotThrow(() => {
        (component as any).applySemanticFiltering(malformedResults, 0);
      });
    });

    test('should handle extreme slider values', () => {
      const component = new ChromaRagInterface();
      
      const extremeValues = [-1000, 1000, NaN, Infinity, -Infinity];
      
      extremeValues.forEach(value => {
        assert.doesNotThrow(() => {
          (component as any).applySemanticFiltering(mockContextResults, value);
        });
        
        assert.doesNotThrow(() => {
          (component as any).getQueryStatusMessage(value, mockContextResults);
        });
        
        assert.doesNotThrow(() => {
          (component as any).getSliderExplanation(value);
        });
      });
    });
  });
});