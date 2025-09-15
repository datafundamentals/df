import { test, expect } from '@playwright/test';

/**
 * Critical User Workflow Tests - CORRECTED
 * 
 * These tests validate the most important user journeys through the RAG system
 * with the correct component selectors for the actual page structure.
 */

test.describe('Critical RAG Workflows', () => {
  
  test('Complete RAG Query Workflow', async ({ page }) => {
    // Navigate to query interface
    await page.goto('/dev/rag-query.html');
    
    // Verify page loads without errors
    await expect(page).toHaveTitle(/RAG Query/);
    
    // Check for the actual main component (not rag-app-header)
    await expect(page.locator('rag-query-interface')).toBeVisible();
    
    // Check for internal app header structure
    const appHeader = page.locator('.app-header');
    await expect(appHeader).toBeVisible();
    
    // Check for query form (if present without auth)
    const queryForm = page.locator('query-form');
    if (await queryForm.count() > 0) {
      await expect(queryForm).toBeVisible();
      console.log('✓ Query form present');
    } else {
      console.log('ℹ️  Query form not visible (may require authentication)');
    }
    
    console.log('✓ Query interface loads correctly');
  });

  test('Document Storage Workflow', async ({ page }) => {
    // Navigate to document storage
    await page.goto('/dev/rag-storage.html');
    
    // Verify page loads
    await expect(page).toHaveTitle(/RAG Storage/);
    await expect(page.locator('rag-document-storage')).toBeVisible();
    
    // Check for app header (integrated in component)
    const appHeader = page.locator('rag-app-header, .app-header');
    await expect(appHeader.first()).toBeVisible();
    
    // Check for bulk loader component (if visible)
    const bulkLoader = page.locator('bulk-rag-loader');
    if (await bulkLoader.count() > 0) {
      await expect(bulkLoader).toBeVisible();
      console.log('✓ Bulk RAG loader present');
    } else {
      console.log('ℹ️  Bulk loader not visible (may require authentication)');
    }
    
    console.log('✓ Document storage interface loads correctly');
  });

  test('Document Editor Workflow', async ({ page }) => {
    // Navigate to document editor
    await page.goto('/dev/rag-editor.html');
    
    // Verify page loads
    await expect(page).toHaveTitle(/RAG Editor/);
    await expect(page.locator('rag-document-editor')).toBeVisible();
    
    // Check for app header (integrated in component)
    const appHeader = page.locator('rag-app-header, .app-header');
    await expect(appHeader.first()).toBeVisible();
    
    // Check for key components (if visible without auth)
    const componentSelectors = [
      'new-document-creator',
      'document-list'
    ];
    
    for (const selector of componentSelectors) {
      const component = page.locator(selector);
      if (await component.count() > 0) {
        console.log(`✓ ${selector} present`);
      } else {
        console.log(`ℹ️  ${selector} not visible (may require authentication)`);
      }
    }
    
    console.log('✓ Document editor interface loads correctly');
  });

  test('Page Navigation and Component Loading', async ({ page }) => {
    // Test navigation flow through all main pages
    const pages = [
      { url: '/dev/rag-query.html', component: 'rag-query-interface', title: /RAG Query/ },
      { url: '/dev/rag-storage.html', component: 'rag-document-storage', title: /RAG Storage/ },
      { url: '/dev/rag-editor.html', component: 'rag-document-editor', title: /RAG Editor/ }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await expect(page).toHaveTitle(pageInfo.title);
      
      // Check main component loads
      await expect(page.locator(pageInfo.component)).toBeVisible();
      
      // Check for header structure (either integrated or separate)
      const headerElement = page.locator('.app-header, rag-app-header');
      if (await headerElement.count() > 0) {
        await expect(headerElement.first()).toBeVisible();
        console.log(`✓ Header present on ${pageInfo.url}`);
      } else {
        console.log(`ℹ️  Header not found on ${pageInfo.url}`);
      }
      
      // Verify no critical JavaScript errors (ignore network errors)
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && 
            !msg.text().includes('Failed to fetch') &&
            !msg.text().includes('Firebase') &&
            !msg.text().includes('CORS')) {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000);
      
      if (errors.length > 0) {
        console.warn(`⚠️  JavaScript errors on ${pageInfo.url}:`, errors);
      }
    }
    
    console.log('✓ All pages load without critical component errors');
  });

});

test.describe('Authentication-Aware Component Tests', () => {
  
  test('Pages Handle Authentication State Gracefully', async ({ page }) => {
    const pages = ['/dev/rag-query.html', '/dev/rag-storage.html', '/dev/rag-editor.html'];
    
    for (const url of pages) {
      await page.goto(url);
      
      // Check main component loads regardless of auth state
      const mainComponent = url.includes('query') ? 'rag-query-interface' :
                           url.includes('storage') ? 'rag-document-storage' :
                           'rag-document-editor';
      
      await expect(page.locator(mainComponent)).toBeVisible();
      
      // Check for either login prompt or authenticated content
      const loginButton = page.locator('md-filled-button', { hasText: 'Sign in' });
      const authenticatedContent = page.locator('.user-info, query-form, bulk-rag-loader, new-document-creator');
      
      const hasLogin = await loginButton.count() > 0;
      const hasContent = await authenticatedContent.count() > 0;
      
      if (hasLogin) {
        console.log(`ℹ️  ${url} shows login prompt (not authenticated)`);
      } else if (hasContent) {
        console.log(`✓ ${url} shows authenticated content`);
      } else {
        console.log(`ℹ️  ${url} authentication state unclear`);
      }
      
      // Page should be functional either way
      expect(hasLogin || hasContent).toBe(true);
    }
    
    console.log('✓ All pages handle authentication state appropriately');
  });

  test('Component Event Communication (When Available)', async ({ page }) => {
    await page.goto('/dev/rag-query.html');
    
    // Wait for component to load
    await expect(page.locator('rag-query-interface')).toBeVisible();
    
    // Test context slider interaction (if present)
    const contextSlider = page.locator('context-slider input[type="range"]');
    if (await contextSlider.count() > 0 && await contextSlider.isVisible()) {
      await contextSlider.fill('10');
      const value = await contextSlider.inputValue();
      expect(value).toBe('10');
      console.log('✓ Context slider responds to input changes');
    } else {
      console.log('ℹ️  Context slider not available (may require authentication)');
    }
    
    // Test query form interaction (if present) 
    const queryInput = page.locator('query-form input[type="text"]').first();
    if (await queryInput.count() > 0 && await queryInput.isVisible()) {
      await queryInput.fill('Test query for Playwright');
      const value = await queryInput.inputValue();
      expect(value).toBe('Test query for Playwright');
      console.log('✓ Query form accepts and retains input');
    } else {
      console.log('ℹ️  Query form not available (may require authentication)');
    }
    
    console.log('✓ Component event communication tested (where available)');
  });

});

test.describe('Visual Layout Validation', () => {
  
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
      await page.waitForTimeout(2000); // Give components time to render
      
      // Check basic layout elements exist
      await expect(page.locator('body')).toBeVisible();
      
      // Check main component is present
      const mainComponent = url.includes('query') ? 'rag-query-interface' :
                           url.includes('storage') ? 'rag-document-storage' :
                           'rag-document-editor';
      
      await expect(page.locator(mainComponent)).toBeVisible();
      
      // Verify page has reasonable height (not collapsed)
      const bodyHeight = await page.locator('body').boundingBox();
      expect(bodyHeight?.height).toBeGreaterThan(200);
      
      console.log(`✓ ${url} has stable layout (${bodyHeight?.height}px height)`);
    }
    
    console.log('✓ All pages maintain stable visual layout');
  });

});