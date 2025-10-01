import {defineConfig, devices} from 'playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', {open: 'never'}]] : [['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'df-npm-info-app',
      testDir: 'apps/df-npm-info-app/tests/integration',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4173',
      },
    },
    {
      name: 'df-practice-app',
      testDir: 'apps/df-practice-app/tests/integration',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4174',
      },
    },
    {
      name: 'lit-starter',
      testDir: 'apps/lit-starter/tests/integration',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4175',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @df/df-npm-info-app run start:test',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @df/df-practice-app run start:test',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @lit/lit-starter-ts run start:test',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
