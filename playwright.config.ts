import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  
  projects: [
    // Setup project - starts dev server and runs browser tests
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'shutdown',
    },
    {
      name: 'shutdown',
      testMatch: /global\.teardown\.ts/,
    },
    
    // Web projects
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    
    // Electron project
    {
      name: 'electron',
      testDir: './tests/e2e',
      testMatch: /electron-.*\.spec\.ts/,
      use: {
        // Electron-specific options
      },
      dependencies: ['setup'],
    },
  ],
  
  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
}); 