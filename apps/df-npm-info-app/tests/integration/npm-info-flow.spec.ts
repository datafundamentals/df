import {expect, test} from 'playwright/test';

const npmRegistryBaseUrl = 'https://registry.npmjs.org';

const mockLitResponse = {
  name: 'lit',
  description: 'Lit mock description rendered from registry.',
  'dist-tags': {
    latest: '9.9.9',
    next: '10.0.0-beta',
  },
};

test.describe('df-npm-info-app integrations', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/dev/npmish.html');
  });

  test('loads npm package info when clicking demo package buttons', async ({page}) => {
    await page.route(`${npmRegistryBaseUrl}/lit`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLitResponse),
      });
    });

    await page.getByRole('button', {name: 'lit', exact: true}).click();

    await expect(page.getByText('Loading npm info for lit')).toBeVisible();

    await expect(page.getByRole('heading', {level: 3, name: mockLitResponse.description})).toBeVisible();
    await expect(page.getByText('latest: 9.9.9')).toBeVisible();
    await expect(page.getByText('next: 10.0.0-beta')).toBeVisible();

    const storeSnapshot = page.locator('[aria-label="store-state"] pre');
    await expect(storeSnapshot).toContainText('"status": "ready"');
    await expect(storeSnapshot).toContainText('"packageName": "lit"');
  });

  test('surfaces error state when registry returns 404', async ({page}) => {
    await page.route(`${npmRegistryBaseUrl}/react`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({error: 'not found'}),
      });
    });

    await page.getByRole('button', {name: 'react', exact: true}).click();

    await expect(page.getByText('Error: Package "react" not found (404)')).toBeVisible();
    const storeSnapshot = page.locator('[aria-label="store-state"] pre');
    await expect(storeSnapshot).toContainText('"status": "error"');
  });
});
