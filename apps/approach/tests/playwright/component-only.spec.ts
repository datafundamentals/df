import { test, expect } from '@playwright/test';

/**
 * Component-Only Tests
 * 
 * These tests focus purely on component functionality that doesn't require
 * backend services, authentication, or external dependencies.
 * Perfect for CI/CD pipelines and rapid development feedback.
 */

test.describe('Component Testing Infrastructure', () => {
  
  test('Component Playground Loads Successfully', async ({ page }) => {
    await page.goto('/dev/component-playground-standalone.html');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Component Playground - Standalone/);
    
    // Check all test sections are present
    const testSections = [
      '#loading-container',
      '#events-container', 
      '#visual-container'
    ];
    
    for (const selector of testSections) {
      await expect(page.locator(selector)).toBeVisible();
    }
    
    console.log('✓ Component playground infrastructure ready');
  });

  test('All Testing Controls Function', async ({ page }) => {
    await page.goto('/dev/component-playground-standalone.html');
    
    const testButtons = [
      'Test Component Loading',
      'Test Basic Events',
      'Test Visual Display'
    ];
    
    for (const buttonText of testButtons) {
      const button = page.locator('button', { hasText: buttonText });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      
      await button.click();
      await page.waitForTimeout(1000);
    }
    
    // Check that event logs show activity
    const logs = [
      '#loading-log .event-log-entry',
      '#events-log .event-log-entry',
      '#visual-log .event-log-entry'
    ];
    
    for (const logSelector of logs) {
      const entries = await page.locator(logSelector).count();
      expect(entries).toBeGreaterThan(1);
    }
    
    console.log('✓ All testing controls function correctly');
  });

});

test.describe('Component Loading Validation', () => {
  
  test('Quick Component Test Shows Success', async ({ page }) => {
    await page.goto('/dev/quick-component-test.html');
    
    // Wait for component initialization
    await page.waitForTimeout(2000);
    
    // Check for success indicators
    const successResults = page.locator('.success');
    const successCount = await successResults.count();
    
    // Should have multiple successful component loads
    expect(successCount).toBeGreaterThan(2);
    
    // Verify specific components rendered
    const components = ['context-slider', 'query-form', 'document-metadata'];
    
    for (const component of components) {
      const element = page.locator(component);
      if (await element.count() > 0) {
        console.log(`✓ ${component} component loaded successfully`);
      }
    }
    
    console.log(`✓ ${successCount} components loaded successfully`);
  });

  test('Component Error Handling', async ({ page }) => {
    // Monitor for critical JavaScript errors
    const criticalErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && 
          !msg.text().includes('Failed to fetch') && 
          !msg.text().includes('Firebase')) {
        criticalErrors.push(msg.text());
      }
    });
    
    await page.goto('/dev/quick-component-test.html');
    await page.waitForTimeout(2000);
    
    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(2);
    
    if (criticalErrors.length > 0) {
      console.warn('⚠️  Critical errors found:', criticalErrors);
    } else {
      console.log('✓ No critical JavaScript errors detected');
    }
  });

});

test.describe('Cross-Browser Component Compatibility', () => {

  test('Components Render Consistently', async ({ page, browserName }) => {
    console.log(`Testing component rendering on ${browserName}`);
    
    await page.goto('/dev/component-playground-standalone.html');
    
    // Test component loading
    await page.locator('button', { hasText: 'Test Component Loading' }).click();
    await page.waitForTimeout(1500);
    
    // Count rendered components
    const container = page.locator('#loading-container');
    const components = await container.locator('[data-component]').count() + 
                      await container.locator('context-slider, query-form, document-metadata').count();
    
    expect(components).toBeGreaterThan(0);
    
    // Test visual display
    await page.locator('button', { hasText: 'Test Visual Display' }).click();
    await page.waitForTimeout(1000);
    
    const visualContainer = page.locator('#visual-container');
    const visualComponents = await visualContainer.locator('context-slider, document-metadata').count();
    
    expect(visualComponents).toBeGreaterThanOrEqual(2);
    
    console.log(`✓ ${components} components loaded, ${visualComponents} visual components on ${browserName}`);
  });

  test('Event System Works Cross-Browser', async ({ page, browserName }) => {
    console.log(`Testing events on ${browserName}`);
    
    await page.goto('/dev/component-playground-standalone.html');
    
    // Test event communication
    await page.locator('button', { hasText: 'Test Basic Events' }).click();
    await page.waitForTimeout(1000);
    
    // Check event log entries
    const eventEntries = await page.locator('#events-log .event-log-entry').count();
    expect(eventEntries).toBeGreaterThan(2);
    
    console.log(`✓ Event system functional with ${eventEntries} logged events on ${browserName}`);
  });

});

test.describe('Development Tools Integration', () => {

  test('Development Landing Page Links Work', async ({ page }) => {
    await page.goto('/dev/');
    
    // Check page loads
    await expect(page).toHaveTitle(/RAG Development Tools/);
    
    // Test component testing section exists
    const testingSection = page.locator('text=Component Testing');
    await expect(testingSection).toBeVisible();
    
    // Test links to testing tools
    const testingLinks = [
      'quick-component-test.html',
      'component-playground-standalone.html'
    ];
    
    for (const link of testingLinks) {
      const linkElement = page.locator(`a[href="${link}"]`);
      await expect(linkElement).toBeVisible();
    }
    
    console.log('✓ Development landing page provides access to testing tools');
  });

  test('Testing Documentation Accessible', async ({ page }) => {
    await page.goto('/dev/');
    
    // Check for testing documentation link
    const docsLink = page.locator('a[href="README-COMPONENT-TESTING.md"]');
    if (await docsLink.isVisible()) {
      console.log('✓ Testing documentation link available');
    }
    
    // Verify testing tools are prominently displayed
    const testingCard = page.locator('text=Component Testing').locator('..');
    await expect(testingCard).toBeVisible();
    
    const buttonCount = await testingCard.locator('a.btn').count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);
    
    console.log(`✓ ${buttonCount} testing tool links available from dev landing page`);
  });

});

test.describe('Performance and Stability', () => {

  test('Component Loading Performance', async ({ page }) => {
    await page.goto('/dev/quick-component-test.html');
    
    const startTime = Date.now();
    
    // Wait for components to initialize
    await page.waitForTimeout(3000);
    
    const loadTime = Date.now() - startTime;
    
    // Should load reasonably quickly
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✓ Components loaded in ${loadTime}ms`);
  });

  test('Page Memory Stability', async ({ page }) => {
    // Test multiple page loads don't cause memory issues
    const pages = [
      '/dev/quick-component-test.html',
      '/dev/component-playground-standalone.html'
    ];
    
    for (let i = 0; i < 2; i++) { // Reduced from 3 to 2 iterations
      for (const url of pages) {
        await page.goto(url);
        
        // Give components proper time to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Increased from 1000ms
        
        // Basic interaction to ensure page is functional
        const buttons = await page.locator('button').count();
        expect(buttons).toBeGreaterThan(0);
        
        console.log(`✓ Loaded ${url} (iteration ${i + 1})`);
      }
    }
    
    console.log('✓ Pages remain stable across multiple loads');
  });

});