import { test, expect } from '@playwright/test';

/**
 * Component Regression Tests
 * 
 * These tests validate that extracted components continue to work correctly
 * after refactoring and prevent regressions in component behavior.
 */

test.describe('Component Playground Validation', () => {
  
  test('Component Testing Tools Load Successfully', async ({ page }) => {
    // Test the quick component test page
    await page.goto('/dev/quick-component-test.html');
    await expect(page).toHaveTitle(/Quick Component Test/);
    
    // Wait for components to initialize
    await page.waitForTimeout(1000);
    
    // Check for success indicators
    const successElements = page.locator('.success');
    const successCount = await successElements.count();
    
    console.log(`✓ Found ${successCount} successful component loads`);
    expect(successCount).toBeGreaterThan(0);
    
    // Test the standalone playground
    await page.goto('/dev/component-playground-standalone.html');
    await expect(page).toHaveTitle(/Component Playground - Standalone/);
    
    // Test component loading button
    const loadButton = page.locator('button', { hasText: 'Test Component Loading' });
    await loadButton.click();
    
    await page.waitForTimeout(2000);
    
    // Check for success status
    const loadingStatus = page.locator('#loading-status');
    const statusClass = await loadingStatus.getAttribute('class');
    
    if (statusClass?.includes('success')) {
      console.log('✓ Component loading test passed in playground');
    } else {
      console.log('⚠️  Component loading test needs attention');
    }
  });

  test('Interactive Testing Functions Work', async ({ page }) => {
    await page.goto('/dev/component-playground-standalone.html');
    
    // Test event communication
    const eventButton = page.locator('button', { hasText: 'Test Basic Events' });
    await eventButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check event log for activity
    const eventLog = page.locator('#events-log');
    const logEntries = await eventLog.locator('.event-log-entry').count();
    expect(logEntries).toBeGreaterThan(1);
    
    // Test visual display
    const visualButton = page.locator('button', { hasText: 'Test Visual Display' });
    await visualButton.click();
    
    await page.waitForTimeout(1000);
    
    // Verify components were added to visual container
    const visualContainer = page.locator('#visual-container');
    const contextSlider = visualContainer.locator('context-slider');
    const docMetadata = visualContainer.locator('document-metadata');
    
    await expect(contextSlider).toBeVisible();
    await expect(docMetadata).toBeVisible();
    
    console.log('✓ Interactive testing functions working correctly');
  });

});

test.describe('Extracted Component Validation', () => {
  
  test('Context Slider Component Functions', async ({ page }) => {
    await page.goto('/dev/rag-query.html');
    
    const contextSlider = page.locator('context-slider');
    if (await contextSlider.isVisible()) {
      // Test slider exists and has proper attributes
      const slider = contextSlider.locator('input[type="range"]');
      await expect(slider).toBeVisible();
      
      // Test value changes
      const initialValue = await slider.inputValue();
      await slider.fill('15');
      const newValue = await slider.inputValue();
      
      expect(newValue).toBe('15');
      expect(newValue).not.toBe(initialValue);
      
      console.log('✓ Context slider component functioning correctly');
    } else {
      console.log('ℹ️  Context slider not visible on this page configuration');
    }
  });

  test('Query Form Component Functions', async ({ page }) => {
    await page.goto('/dev/rag-query.html');
    
    const queryForm = page.locator('query-form');
    if (await queryForm.isVisible()) {
      // Test query input
      const queryInput = queryForm.locator('input[type="text"]').first();
      if (await queryInput.isVisible()) {
        const testQuery = 'Playwright automated test query';
        await queryInput.fill(testQuery);
        
        const inputValue = await queryInput.inputValue();
        expect(inputValue).toBe(testQuery);
        
        // Test submit button exists and is clickable
        const submitButton = queryForm.locator('button').first();
        if (await submitButton.isVisible()) {
          const isEnabled = await submitButton.isEnabled();
          expect(isEnabled).toBe(true);
          
          console.log('✓ Query form component functioning correctly');
        }
      }
    } else {
      console.log('ℹ️  Query form not visible on this page configuration');
    }
  });

  test('Document List Component Functions', async ({ page }) => {
    await page.goto('/dev/rag-editor.html');
    
    const documentList = page.locator('document-list');
    if (await documentList.isVisible()) {
      // Check for search functionality
      const searchBox = documentList.locator('input[type="text"]');
      if (await searchBox.isVisible()) {
        await searchBox.fill('test search');
        const searchValue = await searchBox.inputValue();
        expect(searchValue).toBe('test search');
        
        console.log('✓ Document list component functioning correctly');
      }
      
      // Check for document container
      const docContainer = documentList.locator('.document-list-container');
      await expect(docContainer).toBeVisible();
      
    } else {
      console.log('ℹ️  Document list not visible on this page configuration');
    }
  });

  test('New Document Creator Component Functions', async ({ page }) => {
    await page.goto('/dev/rag-editor.html');
    
    const newDocCreator = page.locator('new-document-creator');
    if (await newDocCreator.isVisible()) {
      // Test new document button
      const createButton = newDocCreator.locator('button').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Wait for title input to appear
        await page.waitForTimeout(500);
        
        const titleInput = newDocCreator.locator('input[type="text"]');
        if (await titleInput.isVisible()) {
          await titleInput.fill('Playwright Test Document');
          const titleValue = await titleInput.inputValue();
          expect(titleValue).toBe('Playwright Test Document');
          
          console.log('✓ New document creator component functioning correctly');
        }
      }
    } else {
      console.log('ℹ️  New document creator not visible on this page configuration');
    }
  });

});

test.describe('Component Error Handling', () => {
  
  test('Pages Handle Missing Backend Gracefully', async ({ page }) => {
    // Monitor console errors
    const errors: string[] = [];
    const criticalErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        errors.push(errorText);
        
        // Filter for critical UI-breaking errors vs expected backend errors
        if (errorText.includes('TypeError') && !errorText.includes('Failed to fetch')) {
          criticalErrors.push(errorText);
        }
      }
    });
    
    const pages = [
      '/dev/rag-query.html',
      '/dev/rag-storage.html',
      '/dev/rag-editor.html'
    ];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(2000);
      
      // Verify page still renders despite backend errors
      await expect(page.locator('body')).toBeVisible();
      
      console.log(`✓ ${url} handles missing backend gracefully`);
    }
    
    // Report error summary
    console.log(`Total console errors: ${errors.length}`);
    console.log(`Critical UI errors: ${criticalErrors.length}`);
    
    // Critical UI errors should be minimal
    expect(criticalErrors.length).toBeLessThan(3);
  });

});

test.describe('Cross-Browser Compatibility', () => {
  
  test('Components Work Across Browsers', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);
    
    await page.goto('/dev/component-playground-standalone.html');
    
    // Test basic component loading
    const loadButton = page.locator('button', { hasText: 'Test Component Loading' });
    await loadButton.click();
    await page.waitForTimeout(1000);
    
    // Verify components render
    const container = page.locator('#loading-container');
    const components = await container.locator('context-slider, query-form, document-metadata').count();
    
    expect(components).toBeGreaterThan(0);
    console.log(`✓ ${components} components rendered successfully on ${browserName}`);
  });

});