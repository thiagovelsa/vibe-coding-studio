import { test, expect, _electron as electron } from '@playwright/test';

test.describe('Electron-specific features', () => {
  test('should open the app and verify main window', async () => {
    // Launch Electron app
    const app = await electron.launch({ args: ['.'] });
    
    // Get the first window
    const window = await app.firstWindow();
    
    // Verify window title
    expect(await window.title()).toContain('VibeForge');
    
    // App should be visible
    await expect(window.locator('[data-testid="app-layout"]')).toBeVisible();
    
    // Close the app
    await app.close();
  });
  
  test('should be able to use native dialogs', async () => {
    // Launch Electron app
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();
    
    // Navigate to the desktop features demo
    // This assumes you have a navigation method to get to this page
    await window.locator('[data-testid="demo-button"]').click();
    
    // Wait for demo page to load
    await expect(window.locator('text="Demo de Recursos Desktop"')).toBeVisible();
    
    // Mock dialog returns
    await window.evaluate(() => {
      // Mock the electron API for dialogs
      window.electronAPI = window.electronAPI || {};
      window.electronAPI.dialog = window.electronAPI.dialog || {};
      
      // Mock openFile to return a predefined path
      const originalOpenFile = window.electronAPI.dialog.openFile;
      window.electronAPI.dialog.openFile = async (options) => {
        console.log('Mock dialog.openFile called with', options);
        return ['/path/to/mocked/file.txt'];
      };
      
      // Remember the original to restore later if needed
      window._originalOpenFile = originalOpenFile;
    });
    
    // Click the "Open File" button
    await window.locator('text="Abrir Arquivo"').click();
    
    // Check that the mock file path is displayed
    await expect(window.locator('text="/path/to/mocked/file.txt"')).toBeVisible();
    
    // Close the app
    await app.close();
  });
  
  test('should handle file drag and drop', async () => {
    // Launch Electron app
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();
    
    // Navigate to the desktop features demo
    await window.locator('[data-testid="demo-button"]').click();
    
    // Wait for demo page to load
    await expect(window.locator('text="Demo de Recursos Desktop"')).toBeVisible();
    
    // Find the drop zone
    const dropZone = window.locator('[id="desktop-features-drop-zone"]');
    await expect(dropZone).toBeVisible();
    
    // Mock the drop event
    await window.evaluate(() => {
      // Create a custom event with mock file data
      const mockDropEvent = {
        files: ['/path/to/dragged/file1.txt', '/path/to/dragged/file2.jpg']
      };
      
      // Dispatch the event to our electronAPI handler
      if (window.electronAPI && window.electronAPI.dragDrop && 
          typeof window.electronAPI.dragDrop.onDrop === 'function') {
        // Find and call the registered callback
        const dropHandlers = window._dropCallbacks || [];
        dropHandlers.forEach(callback => {
          if (typeof callback === 'function') {
            callback(mockDropEvent.files);
          }
        });
      }
    });
    
    // Check that the dragged files are displayed
    await expect(window.locator('text="/path/to/dragged/file1.txt"')).toBeVisible();
    await expect(window.locator('text="/path/to/dragged/file2.jpg"')).toBeVisible();
    
    // Close the app
    await app.close();
  });
  
  test('should access system information', async () => {
    // Launch Electron app
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();
    
    // Navigate to the desktop features demo
    await window.locator('[data-testid="demo-button"]').click();
    
    // Wait for demo page to load
    await expect(window.locator('text="Demo de Recursos Desktop"')).toBeVisible();
    
    // Click the "Get System Info" button
    await window.locator('text="Obter Informações do Sistema"').click();
    
    // System info section should show platform-specific information
    const infoSection = window.locator('text="Informações do Sistema:"').locator('..').locator('..');
    
    // Check for basic system info (platform should be one of these)
    const platformText = await infoSection.locator('text=/Plataforma:/').textContent();
    expect(platformText).toMatch(/win32|darwin|linux/);
    
    // Close the app
    await app.close();
  });
}); 