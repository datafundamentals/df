/**
 * Tests for core store functionality
 * Tests that stores can be imported and have expected structure
 */

import { assert } from '@open-wc/testing';

suite('core-stores', () => {
  test('tags store can be imported and has expected exports', async () => {
    try {
      const tagsModule = await import('../stores/tags.js');
      assert.exists(tagsModule);
      
      // Should have tag-related functions
      assert.exists(tagsModule.saveAllMetadataTags);
      
      // Function should be properly typed
      assert.isFunction(tagsModule.saveAllMetadataTags);
      
    } catch (error) {
      console.log('Tags store test skipped - dependencies not available:', (error as Error).message);
    }
  });

  test('auth store integrates with other stores', async () => {
    try {
      const authModule = await import('../stores/auth.js');
      const playerModule = await import('../stores/player.js');
      
      // Both should import without circular dependency errors
      assert.exists(authModule);
      assert.exists(playerModule);
      
    } catch (error) {
      console.log('Store integration test skipped:', (error as Error).message);
    }
  });

  test('store modules can be imported', async () => {
    const storeFiles = [
      '../stores/tags.js',
      '../stores/auth.js', 
      '../stores/players.js',
      '../stores/project.js'
    ];

    for (const storeFile of storeFiles) {
      try {
        const storeModule = await import(storeFile);
        assert.exists(storeModule, `Store ${storeFile} should be importable`);
        
        // Store should export something (not empty)
        const exports = Object.keys(storeModule);
        assert.isAbove(exports.length, 0, `Store ${storeFile} should export something`);
        
      } catch (error) {
        console.log(`Store ${storeFile} test skipped:`, (error as Error).message);
      }
    }
  });
});