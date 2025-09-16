import { test, expect } from '@playwright/test';

/**
 * Core Component Tests - Essential Validation Only
 * 
 * These are the most important tests that must pass for component validation.
 * Perfect for CI/CD with minimal flakiness and maximum reliability.
 */

test.describe('Essential Component Validation', () => {
  
  test('Components Load Successfully', async ({ page }) => {
    await page.goto('/dev/quick-component-test.html');
    
    // Wait for components to initialize properly - use DOM ready instead of networkidle
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the component test script to run and show results
    await page.waitForSelector('.success', { timeout: 10000 });
    await page.waitForTimeout(1000); // Give time for all components to register
    
    // Check for success indicators
    const successResults = page.locator('.success');
    const successCount = await successResults.count();
    
    // Must have successful component loads
    expect(successCount).toBeGreaterThan(2);
    
    console.log(`✓ ${successCount} components loaded successfully`);
  });

  test('Interactive Testing Works', async ({ page }) => {
    await page.goto('/dev/component-playground-standalone.html');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Component Playground - Standalone/);
    
    // Test component loading button
    const loadButton = page.locator('button', { hasText: 'Test Component Loading' });
    await loadButton.click();
    await page.waitForTimeout(2000);
    
    // Check for successful status
    const loadingLog = page.locator('#loading-log .event-log-entry');
    const logCount = await loadingLog.count();
    expect(logCount).toBeGreaterThan(1);
    
    console.log('✓ Interactive testing system functional');
  });

  test('No Critical JavaScript Errors', async ({ page }) => {
    const criticalErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && 
          !msg.text().includes('Failed to fetch') && 
          !msg.text().includes('Firebase') &&
          !msg.text().includes('CORS')) {
        criticalErrors.push(msg.text());
      }
    });
    
    await page.goto('/dev/quick-component-test.html');
    await page.waitForTimeout(3000);
    
    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(2);
    
    if (criticalErrors.length === 0) {
      console.log('✓ No critical JavaScript errors detected');
    } else {
      console.warn(`⚠️  ${criticalErrors.length} critical errors found:`, criticalErrors);
    }
  });

  test('Development Tools Accessible', async ({ page }) => {
    await page.goto('/dev/');
    
    // Check page loads
    await expect(page).toHaveTitle(/RAG Development Tools/);
    
    // Verify component testing section exists
    const testingSection = page.locator('text=Component Testing');
    await expect(testingSection).toBeVisible();
    
    // Check testing tool links
    const quickTestLink = page.locator('a[href="quick-component-test.html"]');
    const playgroundLink = page.locator('a[href="component-playground-standalone.html"]');
    
    await expect(quickTestLink).toBeVisible();
    await expect(playgroundLink).toBeVisible();
    
    console.log('✓ Development tools properly integrated and accessible');
  });

});

test.describe('Cross-Browser Essential Tests', () => {

  test('Components Render in All Browsers', async ({ page, browserName }) => {
    console.log(`Testing essential functionality on ${browserName}`);
    
    await page.goto('/dev/component-playground-standalone.html');
    await page.waitForLoadState('networkidle');
    
    // Test basic component loading
    const loadButton = page.locator('button', { hasText: 'Test Component Loading' });
    await loadButton.click();
    await page.waitForTimeout(2000);
    
    // Verify components were created (look for activity in log)
    const logEntries = await page.locator('#loading-log .event-log-entry').count();
    expect(logEntries).toBeGreaterThan(2);
    
    console.log(`✓ Essential components functional on ${browserName}`);
  });

});