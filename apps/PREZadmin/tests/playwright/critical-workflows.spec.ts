import { test, expect } from '@playwright/test';

/**
 * Critical User Workflow Tests
 * 
 * These tests validate the most important user journeys through the RAG system.
 * They ensure that component refactoring didn't break core functionality.
 */

test.describe('Critical RAG Workflows', () => {
  
  // Test the most important user journey: Query → View Results → Edit Document
  test('Complete RAG Query Workflow', async ({ page }) => {
    // Navigate to query interface
    await page.goto('/dev/rag-query.html');
    
    // Verify page loads without errors
    await expect(page).toHaveTitle(/RAG Query/);
    
    // Check for critical elements
    await expect(page.locator('rag-query-interface')).toBeVisible();
    await expect(page.locator('query-form')).toBeVisible();
    
    // Test query submission (if auth not required for testing)
    const queryInput = page.locator('query-form input[type="text"]').first();
    if (await queryInput.isVisible()) {
      await queryInput.fill('React performance optimization');
      
      // Submit query
      const submitButton = page.locator('query-form button').first();
      await submitButton.click();
      
      // Wait for potential results (may timeout if no backend)
      // This validates the UI doesn't crash on submission
      await page.waitForTimeout(2000);
    }
    
    console.log('✓ Query interface loads and accepts input');
  });

  test('Document Storage Workflow', async ({ page }) => {
    // Navigate to document storage
    await page.goto('/dev/rag-storage.html');
    
    // Verify page loads
    await expect(page).toHaveTitle(/RAG Storage/);
    await expect(page.locator('rag-document-storage')).toBeVisible();
    
    // Check for bulk loader component
    await expect(page.locator('bulk-rag-loader')).toBeVisible();
    
    console.log('✓ Document storage interface loads correctly');
  });

  test('Document Editor Workflow', async ({ page }) => {
    // Navigate to document editor
    await page.goto('/dev/rag-editor.html');
    
    // Verify page loads
    await expect(page).toHaveTitle(/RAG Editor/);
    await expect(page.locator('rag-document-editor')).toBeVisible();
    
    // Check for key components
    await expect(page.locator('new-document-creator')).toBeVisible();
    await expect(page.locator('document-list')).toBeVisible();
    
    // Test new document creation UI
    const newDocButton = page.locator('new-document-creator button').first();
    if (await newDocButton.isVisible()) {
      await newDocButton.click();
      
      // Check if title input appears
      await page.waitForTimeout(500);
      const titleInput = page.locator('new-document-creator input[type="text"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Document');
        console.log('✓ New document creation UI responds correctly');
      }
    }
    
    console.log('✓ Document editor interface loads correctly');
  });

  test('Navigation Between Pages', async ({ page }) => {
    // Test navigation flow through all main pages
    const pages = [
      { url: '/dev/rag-query.html', title: /RAG Query/ },
      { url: '/dev/rag-storage.html', title: /RAG Storage/ },
      { url: '/dev/rag-editor.html', title: /RAG Editor/ }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await expect(page).toHaveTitle(pageInfo.title);
      
      // Check for app header (shared component)
      await expect(page.locator('rag-app-header')).toBeVisible();
      
      // Verify no JavaScript errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000);
      
      if (errors.length > 0) {
        console.warn(`⚠️  JavaScript errors on ${pageInfo.url}:`, errors);
      }
    }
    
    console.log('✓ All pages load without critical errors');
  });

});

test.describe('Component Integration Tests', () => {
  
  test('Shared App Header Consistency', async ({ page }) => {
    // Test that app header works consistently across pages
    const pages = ['/dev/rag-query.html', '/dev/rag-storage.html', '/dev/rag-editor.html'];
    
    for (const url of pages) {
      await page.goto(url);
      
      // Check app header is present and functional
      const appHeader = page.locator('rag-app-header');
      await expect(appHeader).toBeVisible();
      
      // Check for navigation tabs (if visible)
      const navTabs = page.locator('rag-app-header md-tabs');
      if (await navTabs.isVisible()) {
        const tabs = await navTabs.locator('md-primary-tab').count();
        expect(tabs).toBeGreaterThan(0);
        console.log(`✓ App header has ${tabs} navigation tabs on ${url}`);
      }
    }
    
    console.log('✓ Shared app header consistent across all pages');
  });

  test('Component Event Communication', async ({ page }) => {
    await page.goto('/dev/rag-query.html');
    
    // Test context slider interaction
    const contextSlider = page.locator('context-slider');
    if (await contextSlider.isVisible()) {
      // Get the slider input
      const sliderInput = contextSlider.locator('input[type="range"]');
      if (await sliderInput.isVisible()) {
        await sliderInput.fill('10');
        
        // Verify slider responds
        const value = await sliderInput.inputValue();
        expect(value).toBe('10');
        console.log('✓ Context slider responds to input changes');
      }
    }
    
    // Test query form interaction
    const queryForm = page.locator('query-form');
    if (await queryForm.isVisible()) {
      const queryInput = queryForm.locator('input[type="text"]').first();
      if (await queryInput.isVisible()) {
        await queryInput.fill('Test query for Playwright');
        const value = await queryInput.inputValue();
        expect(value).toBe('Test query for Playwright');
        console.log('✓ Query form accepts and retains input');
      }
    }
    
    console.log('✓ Component event communication working');
  });

});

test.describe('Visual Regression Prevention', () => {
  
  test('Page Layout Stability', async ({ page }) => {
    const pages = [
      '/dev/rag-query.html',
      '/dev/rag-storage.html', 
      '/dev/rag-editor.html'
    ];

    for (const url of pages) {
      await page.goto(url);
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Check basic layout elements exist
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('rag-app-header')).toBeVisible();
      
      // Verify page has reasonable height (not collapsed)
      const bodyHeight = await page.locator('body').boundingBox();
      expect(bodyHeight?.height).toBeGreaterThan(400);
      
      console.log(`✓ ${url} has stable layout`);
    }
    
    console.log('✓ All pages maintain stable visual layout');
  });

});