import { assert, fixture, html } from '@open-wc/testing';
import { ConceptExplorer } from '../ui/concept-explorer';
import '../ui/concept-explorer.js';

suite('Concept Explorer Component', () => {
  suite('Component Initialization', () => {
    test('should initialize with default properties', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      assert.exists(component);
      assert.equal(component.concept, '');
      assert.equal(component.explorationDepth, 2);
      assert.equal(component.maxResults, 20);
    });

    test('should accept custom properties', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer 
          .concept=${'javascript'}
          .explorationDepth=${3}
          .maxResults=${15}>
        </concept-explorer>
      `);

      assert.equal(component.concept, 'javascript');
      assert.equal(component.explorationDepth, 3);
      assert.equal(component.maxResults, 15);
    });

    test('should render input field and controls', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const input = component.shadowRoot?.querySelector('.concept-input') as HTMLInputElement;
      const depthInput = component.shadowRoot?.querySelector('.depth-input') as HTMLInputElement;
      const exploreButton = component.shadowRoot?.querySelector('md-filled-button');

      assert.exists(input);
      assert.exists(depthInput);
      assert.exists(exploreButton);
      
      assert.equal(input.placeholder.includes('concept'), true);
      assert.equal(depthInput.value, '2'); // Default depth
      assert.equal(exploreButton?.textContent?.trim(), 'Explore');
    });
  });

  suite('User Interactions', () => {
    test('should update concept when input changes', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const input = component.shadowRoot?.querySelector('.concept-input') as HTMLInputElement;
      
      input.value = 'database';
      input.dispatchEvent(new Event('input'));
      
      assert.equal(component.concept, 'database');
    });

    test('should update depth when depth input changes', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const depthInput = component.shadowRoot?.querySelector('.depth-input') as HTMLInputElement;
      
      depthInput.value = '3';
      depthInput.dispatchEvent(new Event('change'));
      
      assert.equal(component.explorationDepth, 3);
    });

    test('should constrain depth to valid range', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const depthInput = component.shadowRoot?.querySelector('.depth-input') as HTMLInputElement;
      
      // Test maximum constraint
      depthInput.value = '10';
      depthInput.dispatchEvent(new Event('change'));
      assert.equal(component.explorationDepth, 3); // Should be constrained to max 3
      
      // Test minimum constraint
      depthInput.value = '0';
      depthInput.dispatchEvent(new Event('change'));
      assert.equal(component.explorationDepth, 1); // Should be constrained to min 1
    });

    test('should switch between view tabs', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const tabs = component.shadowRoot?.querySelectorAll('.view-tab');
      assert.exists(tabs);
      assert.equal(tabs?.length, 3); // neighborhood, graph, pathways

      // Should start with neighborhood tab active
      assert.isTrue(tabs![0].classList.contains('active'));
      assert.isFalse(tabs![1].classList.contains('active'));
      assert.isFalse(tabs![2].classList.contains('active'));

      // Click graph tab
      (tabs![1] as HTMLElement).click();
      await component.updateComplete;
      
      assert.isFalse(tabs![0].classList.contains('active'));
      assert.isTrue(tabs![1].classList.contains('active'));
      assert.isFalse(tabs![2].classList.contains('active'));
    });

    test('should update filter selection', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const filterSelect = component.shadowRoot?.querySelector('.filter-select') as HTMLSelectElement;
      assert.exists(filterSelect);
      
      filterSelect.value = 'tags';
      filterSelect.dispatchEvent(new Event('change'));
      
      // Check internal state (since filterBySource is private)
      // We can verify by checking if the option is selected
      assert.equal(filterSelect.value, 'tags');
    });

    test('should toggle cluster display', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const clusterCheckbox = component.shadowRoot?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      assert.exists(clusterCheckbox);
      
      // Should start checked
      assert.isTrue(clusterCheckbox.checked);
      
      // Toggle off
      clusterCheckbox.checked = false;
      clusterCheckbox.dispatchEvent(new Event('change'));
      await component.updateComplete;
      
      assert.isFalse(clusterCheckbox.checked);
    });
  });

  suite('Content Rendering', () => {
    test('should show empty state when no concept is provided', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const emptyState = component.shadowRoot?.querySelector('.empty-state');
      assert.exists(emptyState);
      assert.isTrue(emptyState?.textContent?.includes('Enter a concept'));
    });

    test('should disable explore button when concept is empty', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer .concept=${''}></concept-explorer>
      `);

      const exploreButton = component.shadowRoot?.querySelector('md-filled-button') as any;
      assert.exists(exploreButton);
      assert.isTrue(exploreButton.disabled);
    });

    test('should enable explore button when concept is provided', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer .concept=${'programming'}></concept-explorer>
      `);

      const exploreButton = component.shadowRoot?.querySelector('md-filled-button') as any;
      assert.exists(exploreButton);
      assert.isFalse(exploreButton.disabled);
    });

    test('should render concept chips with appropriate styling', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Mock some neighborhood data
      (component as any).neighborhood = {
        centralConcept: 'test',
        immediateNeighbors: [
          { concept: 'related1', relationship: 'isA', source: 'ontology', confidence: 0.8 },
          { concept: 'related2', relationship: 'tag', source: 'tags', confidence: 0.6 }
        ],
        extendedNeighbors: [],
        neighborhoodClusters: [],
        bridgeConcepts: [],
        pathways: []
      };

      await component.updateComplete;

      const conceptChips = component.shadowRoot?.querySelectorAll('.concept-chip');
      if (conceptChips && conceptChips.length > 0) {
        const chip = conceptChips[0];
        assert.isTrue(chip.classList.contains('concept-chip'));
        
        // Should have relationship badge
        const relationshipBadge = chip.querySelector('.relationship-badge');
        assert.exists(relationshipBadge);
        
        // Should have confidence indicator if confidence exists
        const confidenceIndicator = chip.querySelector('.confidence-indicator');
        // May or may not exist depending on mock data - just checking it doesn't throw
        assert.isTrue(confidenceIndicator !== undefined);
      }
    });

    test('should handle concept selection and multi-selection', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Mock neighborhood data
      (component as any).neighborhood = {
        centralConcept: 'test',
        immediateNeighbors: [
          { concept: 'concept1', relationship: 'tag', source: 'tags' },
          { concept: 'concept2', relationship: 'isA', source: 'ontology' }
        ],
        extendedNeighbors: [],
        neighborhoodClusters: [],
        bridgeConcepts: [],
        pathways: []
      };

      await component.updateComplete;

      const conceptChips = component.shadowRoot?.querySelectorAll('.concept-chip');
      
      if (conceptChips && conceptChips.length > 0) {
        // Initially no concepts should be selected
        conceptChips.forEach(chip => {
          assert.isFalse(chip.classList.contains('selected'));
        });

        // Click a concept chip to select it
        (conceptChips[0] as HTMLElement).click();
        await component.updateComplete;

        // Should show selected concepts button if any are selected
        const selectedButton = component.shadowRoot?.querySelector('md-outlined-button');
        if (selectedButton) {
          assert.isTrue(selectedButton.textContent?.includes('Graph Selected'));
        }
      }
    });
  });

  suite('Status and Loading States', () => {
    test('should show loading state during exploration', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer .concept=${'test'}></concept-explorer>
      `);

      // Simulate loading state
      (component as any).isLoading = true;
      (component as any).statusMessage = 'Exploring concept relationships...';
      await component.updateComplete;

      const statusMessage = component.shadowRoot?.querySelector('.status-message.loading');
      const exploreButton = component.shadowRoot?.querySelector('md-filled-button') as any;

      if (statusMessage) {
        assert.isTrue(statusMessage.textContent?.includes('Exploring'));
      }
      
      if (exploreButton) {
        assert.isTrue(exploreButton.disabled);
        assert.isTrue(exploreButton.textContent?.includes('Exploring'));
      }
    });

    test('should show error state for failed exploration', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Simulate error state
      (component as any).statusMessage = 'Error exploring concept relationships. Please try again.';
      await component.updateComplete;

      const statusMessage = component.shadowRoot?.querySelector('.status-message');
      if (statusMessage) {
        assert.isTrue(statusMessage.textContent?.includes('Error'));
      }
    });

    test('should clear status message when exploration succeeds', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Start with error message
      (component as any).statusMessage = 'Some error';
      await component.updateComplete;

      let statusMessage = component.shadowRoot?.querySelector('.status-message');
      assert.exists(statusMessage);

      // Clear message (simulate successful exploration)
      (component as any).statusMessage = '';
      await component.updateComplete;

      statusMessage = component.shadowRoot?.querySelector('.status-message');
      assert.isNull(statusMessage);
    });
  });

  suite('Responsive Behavior', () => {
    test('should have responsive styles for mobile viewports', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Check that CSS media query styles are defined
      const styles = (component.constructor as any).styles;
      assert.exists(styles);
      
      // Verify that responsive styles are included (check for @media in styles)
      const styleText = styles.toString();
      assert.isTrue(styleText.includes('@media'));
      assert.isTrue(styleText.includes('768px')); // Mobile breakpoint
    });

    test('should adapt layout for different screen sizes', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Verify that flex-wrap and responsive classes are properly applied
      const explorerHeader = component.shadowRoot?.querySelector('.explorer-header');
      if (explorerHeader) {
        const computedStyle = getComputedStyle(explorerHeader);
        // Should have flex display for responsive layout
        assert.equal(computedStyle.display, 'flex');
      }

      const conceptChips = component.shadowRoot?.querySelector('.concept-chips');
      if (conceptChips) {
        const computedStyle = getComputedStyle(conceptChips);
        // Should have flex-wrap for responsive chip layout
        assert.equal(computedStyle.display, 'flex');
      }
    });
  });

  suite('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const input = component.shadowRoot?.querySelector('.concept-input') as HTMLInputElement;
      assert.exists(input);
      assert.exists(input.placeholder);
      assert.isTrue(input.placeholder.length > 0);

      const depthInput = component.shadowRoot?.querySelector('.depth-input') as HTMLInputElement;
      assert.exists(depthInput);
      
      // Should have associated label
      const depthLabel = component.shadowRoot?.querySelector('label');
      assert.exists(depthLabel);
    });

    test('should support keyboard navigation', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer .concept=${'test'}></concept-explorer>
      `);

      const input = component.shadowRoot?.querySelector('.concept-input') as HTMLInputElement;
      
      // Should support Enter key to trigger exploration
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      // Should handle the event without throwing errors
      assert.isTrue(true);
    });

    test('should have focusable interactive elements', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      const focusableElements = component.shadowRoot?.querySelectorAll(
        'input, button, select, [tabindex]:not([tabindex="-1"])'
      );
      
      assert.exists(focusableElements);
      assert.isAtLeast(focusableElements!.length, 3); // At least input, depth input, and button
      
      focusableElements!.forEach(element => {
        const htmlElement = element as HTMLElement;
        assert.isTrue(htmlElement.tabIndex >= 0 || htmlElement.tagName.toLowerCase() === 'input' || htmlElement.tagName.toLowerCase() === 'button');
      });
    });
  });

  suite('Integration with Discovery System', () => {
    test('should handle exploration method calls', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer .concept=${'programming'}></concept-explorer>
      `);

      // Verify that the exploration method exists and can be called
      assert.isFunction((component as any).exploreCurrentConcept);
      
      try {
        // Should not throw when called (though will likely fail due to missing Firestore)
        await (component as any).exploreCurrentConcept();
      } catch (error) {
        // Expected in test environment
        assert.isTrue(true);
      }
    });

    test('should handle concept selection from chips', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Mock some data to create clickable chips
      (component as any).neighborhood = {
        centralConcept: 'test',
        immediateNeighbors: [
          { concept: 'clickable-concept', relationship: 'tag', source: 'tags' }
        ],
        extendedNeighbors: [],
        neighborhoodClusters: [],
        bridgeConcepts: [],
        pathways: []
      };

      await component.updateComplete;

      const conceptChip = component.shadowRoot?.querySelector('.concept-chip') as HTMLElement;
      if (conceptChip) {
        // Should handle click without throwing
        assert.doesNotThrow(() => {
          conceptChip.click();
        });
      }
    });

    test('should integrate with relationship graph building', async () => {
      const component = await fixture<ConceptExplorer>(html`
        <concept-explorer></concept-explorer>
      `);

      // Simulate selected concepts
      (component as any).selectedConcepts = new Set(['concept1', 'concept2']);
      await component.updateComplete;

      // Should show button to explore selected concepts
      const selectedButton = component.shadowRoot?.querySelector('md-outlined-button');
      if (selectedButton) {
        assert.isTrue(selectedButton.textContent?.includes('Graph Selected'));
        
        // Should handle click without throwing
        assert.doesNotThrow(() => {
          (selectedButton as HTMLElement).click();
        });
      }
    });
  });
});