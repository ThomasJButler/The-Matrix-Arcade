import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Matrix Arcade visual testing.
 *
 * Run visual tests: npm run test:visual
 * Update snapshots: npm run test:visual:update
 * Run in Docker: npm run test:e2e:docker
 */
export default defineConfig({
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // CI: single worker for determinism. Local: cap at 4 to avoid overwhelming
  // the Vite dev server (unlimited workers caused timeouts in Phaser games).
  workers: process.env.CI ? 1 : 4,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the dev server (supports Docker override via env var)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Capture trace on failure for debugging
    trace: 'on-first-retry',

    // Video on failure
    video: 'on-first-retry',
  },

  // Configure projects — desktop runs all tests; mobile/tablet run visual specs only
  projects: [
    {
      name: 'chromium',
      testIgnore: /responsive\//,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        },
      },
    },
    {
      name: 'mobile',
      testMatch: /responsive\//,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        },
      },
    },
    {
      name: 'tablet',
      testMatch: /responsive\//,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        },
      },
    },
  ],

  // Run dev server before tests (skip when using Docker with PLAYWRIGHT_BASE_URL)
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -- --host 0.0.0.0',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Timeout for each test
  timeout: 45 * 1000,

  // Expect timeout
  expect: {
    timeout: 5000,
    // Visual comparison settings — generous tolerance for canvas/font rendering;
    // baselines must be regenerated inside Docker (see README) to avoid host drift.
    toHaveScreenshot: {
      // Canvas games have ongoing Phaser-driven animation we can't fully
      // freeze. Visual baselines are used as structural-regression detection
      // (layout, asset breaks, palette shifts) — not pixel-perfect diffing —
      // so tolerance is very generous.
      maxDiffPixels: 200000,
      maxDiffPixelRatio: 0.2,
      threshold: 0.5,
      animations: 'disabled',
      caret: 'hide',
    },
  },
});
