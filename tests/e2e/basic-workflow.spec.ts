import { test, expect } from '@playwright/test';

test.describe('Basic Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173/');
    
    // Wait for the app to be fully loaded
    await page.waitForSelector('[data-testid="app-layout"]');
  });

  test('should open the application and load sidebar components', async ({ page }) => {
    // Check that the sidebar is visible
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    
    // Check that file explorer is loaded
    const fileExplorer = page.locator('[data-testid="file-explorer"]');
    await expect(fileExplorer).toBeVisible();
    
    // File tree should eventually load (may take some time if connecting to backend)
    await expect(page.locator('[data-testid="file-tree-item"]')).toBeVisible({ timeout: 5000 });
  });

  test('should be able to open a file from sidebar', async ({ page }) => {
    // Wait for file tree to load
    await page.waitForSelector('[data-testid="file-tree-item"]', { timeout: 5000 });
    
    // Find and click on a file (assuming package.json is available)
    const packageJsonFile = page.locator('text=package.json').first();
    await packageJsonFile.click();
    
    // Check that the file is opened in editor
    await expect(page.locator('[data-testid="code-viewer"]')).toBeVisible();
    
    // Editor should contain content related to package.json
    const editorContent = page.locator('[data-testid="code-viewer"]');
    await expect(editorContent).toContainText('"name":', { timeout: 5000 });
  });

  test('should be able to interact with the agent', async ({ page }) => {
    // Open chat panel if not already open
    const chatButton = page.locator('[data-testid="chat-panel-button"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }
    
    // Wait for chat input to be available
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();
    
    // Type and send a message
    await chatInput.fill('Hello, can you help me understand this codebase?');
    await page.keyboard.press('Enter');
    
    // Check that message is sent
    await expect(page.locator('text="Hello, can you help me understand this codebase?"')).toBeVisible();
    
    // Check for agent response (this may take time)
    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible({ timeout: 15000 });
  });

  test('should be able to toggle theme', async ({ page }) => {
    // Open settings panel
    await page.locator('[data-testid="settings-button"]').click();
    
    // Wait for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    
    // Check initial theme
    const initialThemeClass = await page.locator('body').getAttribute('class');
    
    // Toggle theme
    await themeToggle.click();
    
    // Check that theme has changed
    const newThemeClass = await page.locator('body').getAttribute('class');
    expect(newThemeClass).not.toBe(initialThemeClass);
  });
}); 