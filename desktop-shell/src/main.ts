import { app, BrowserWindow, Menu, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs/promises'; // Import fs promises
import { WindowManager } from './window-manager';
import { IpcHandler } from './ipc-handler';
import { loadConfig } from './config';
import { Logger } from './logger';

// Desabilita warnings de segurança no desenvolvimento
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Configuração para desenvolvimento ou produção
const isDev = process.env.NODE_ENV !== 'production';
let backendProcess: any = null;

// Instâncias globais
let windowManager: WindowManager;
let ipcHandler: IpcHandler;

// --- State Persistence ---
interface PersistedWindowState {
  id?: number; // ID might not be useful for restore, but could be for debugging
  bounds: Electron.Rectangle;
  isMaximized: boolean;
  context?: { workspacePath?: string };
}

const windowStatePath = path.join(app.getPath('userData'), 'window-state.json');

async function saveWindowState() {
  if (!windowManager || windowManager.getWindowCount() === 0) {
    // No windows or manager not ready, maybe delete old state?
    try { 
      await fs.unlink(windowStatePath);
      Logger.info('No windows open, removed previous window state file.');
     } catch (err: any) {
       if (err.code !== 'ENOENT') { // Ignore if file doesn't exist
          Logger.error('Could not remove window state file:', err);
       }
     }
    return;
  }

  const windowsToSave: PersistedWindowState[] = windowManager.getAllWindowEntries()
    .map(({ window, context }) => {
      const bounds = window.getBounds();
      const isMaximized = window.isMaximized();
      // Return state without maximization bounds if maximized
      return {
        bounds: isMaximized ? window.getNormalBounds() : bounds, // Save normal bounds if maximized
        isMaximized,
        context
      };
    });

  try {
    await fs.writeFile(windowStatePath, JSON.stringify(windowsToSave, null, 2));
    Logger.info(`Saved state for ${windowsToSave.length} windows.`);
  } catch (error) {
    Logger.error('Failed to save window state:', error);
  }
}

async function loadAndRestoreWindowState(): Promise<boolean> {
  try {
    const stateContent = await fs.readFile(windowStatePath, 'utf-8');
    const savedStates = JSON.parse(stateContent) as PersistedWindowState[];

    if (!Array.isArray(savedStates) || savedStates.length === 0) {
      Logger.info('No valid window state found to restore.');
      return false;
    }

    Logger.info(`Restoring state for ${savedStates.length} windows...`);
    for (const state of savedStates) {
      if (state.bounds) { // Ensure bounds exist
        const options: Electron.BrowserWindowConstructorOptions = {
          x: state.bounds.x,
          y: state.bounds.y,
          width: state.bounds.width,
          height: state.bounds.height,
        };
        const newWindow = windowManager.createWindow(options, state.context);
        if (state.isMaximized) {
          // Delay maximize slightly to ensure window is ready
          setTimeout(() => newWindow.maximize(), 100);
        }
      } else {
        Logger.warn('Skipping restore for window state with missing bounds.');
      }
    }
    return true; // State restored
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      Logger.info('Window state file not found, starting fresh.');
    } else {
      Logger.error('Failed to load or parse window state:', err);
    }
    return false; // State not restored
  }
}

function startBackend() {
  if (isDev) {
    // Inicia o backend em um processo filho
    Logger.info('Starting backend in development mode...');
    backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: path.join(__dirname, '../..//backend'), // Ajuste o caminho se necessário
      shell: true, // Usa o shell do sistema
      stdio: 'inherit'
    });

    backendProcess.on('error', (error: Error) => {
      console.error('Falha ao iniciar o backend:', error);
    });
  } else {
    // Lógica para iniciar o backend em produção (ex: um executável)
    Logger.info('Using backend in production mode');
    // backendProcess = spawn('path/to/backend/executable');
  }
}

// --- Application Menu Template ---
const menuTemplate: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Window',
        accelerator: process.platform === 'darwin' ? 'Cmd+N' : 'Ctrl+N',
        click: () => {
          // Directly call windowManager if available
          if (windowManager) {
            windowManager.createWindow();
          } else {
            console.error('WindowManager not initialized when trying to create new window from menu.');
          }
        }
      },
      { type: 'separator' },
      // Add Quit item based on platform
      process.platform === 'darwin'
        ? { role: 'close', label: 'Close Window' } // Use close for window on mac, quit is in App menu
        : { role: 'quit' }
    ]
  },
  // Minimal Edit menu (Undo/Redo/Cut/Copy/Paste/SelectAll)
  {
    label: 'Edit',
    submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' }, // Useful for debugging
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { label: 'Window', role: 'window' } // Use explicit label for clarity on macOS
      ] : [
          { role: 'close', label: 'Close Window' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      // Add links to documentation or about page here
      {
        label: 'Learn More (Placeholder)',
        click: async () => {
          const { shell } = require('electron');
          await shell.openExternal('https://github.com/YourOrg/VibeForge'); // Placeholder URL
        }
      }
    ]
  }
];

// Adjust for macOS menu conventions
if (process.platform === 'darwin') {
  // Add the App menu
  menuTemplate.unshift({
    label: app.name, // Use app.name for dynamic app name
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  });

  // Adjust Window menu for macOS
  const windowMenu = menuTemplate.find(m => m.role === 'window');
  if (windowMenu && windowMenu.submenu) { // Check submenu exists
    windowMenu.submenu = (
      windowMenu.submenu as Electron.MenuItemConstructorOptions[] // Type assertion
    ).filter(item => item.role !== 'close'); // Remove close from Window menu, it's in File
    windowMenu.submenu.push(
      { type: 'separator' },
      { role: 'zoom' } // Add zoom to macOS window menu
    );
  }
}

async function createApplication() {
  try {
    // Carrega a configuração
    const config = await loadConfig();
    
    // Inicializa o gerenciador de janelas
    windowManager = new WindowManager(config);
    
    // Monta backendUrl a partir de config.backend
    const backendUrl = `http://${config.backend.host}:${config.backend.port}${config.backend.apiPrefix}`;
    // Inicializa o handler IPC para comunicação
    ipcHandler = new IpcHandler({
      backendUrl,
      windowManager
    });
    
    // Cria o menu da aplicação
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    
    // Registra e configura o gerenciamento de Drag-and-Drop
    setupDragAndDrop();

    // Tenta restaurar o estado anterior, ou cria uma nova janela
    const didRestore = await loadAndRestoreWindowState();
    if (!didRestore) {
      // Se não restaurou, cria uma nova janela
      windowManager.createWindow();
    }
    
    // Inicia o backend (dependendo do modo)
    if (config.startBackend) {
      startBackend();
    }
    
    // Configura eventos de app
    setupAppEvents();
    
    Logger.info('Aplicação inicializada com sucesso.');
  } catch (error) {
    Logger.error('Falha ao inicializar aplicação:', error);
    app.quit();
  }
}

// Função para configurar os eventos de drag-and-drop para todas as janelas
function setupDragAndDrop() {
  // Mapa para armazenar quais janelas têm elementIds registrados para drag-and-drop
  const dropZonesByWindow = new Map<number, Set<string>>();

  // Registrar uma zona de drop
  ipcMain.on('drag-drop:register', (event, elementId) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    
    const windowId = win.id;
    if (!dropZonesByWindow.has(windowId)) {
      dropZonesByWindow.set(windowId, new Set<string>());
      
      // Configurar eventos de drag & drop para esta janela
      win.webContents.on('will-navigate', (e, url) => {
        // Previne navegação quando arquivos são arrastados para o app
        if (url.startsWith('file://')) {
          e.preventDefault();
        }
      });
    }
    
    dropZonesByWindow.get(windowId)!.add(elementId);
    Logger.info(`Registered drop zone "${elementId}" for window ${windowId}`);
  });

  // Remover uma zona de drop
  ipcMain.on('drag-drop:unregister', (event, elementId) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    
    const windowId = win.id;
    if (dropZonesByWindow.has(windowId)) {
      dropZonesByWindow.get(windowId)!.delete(elementId);
      Logger.info(`Unregistered drop zone "${elementId}" for window ${windowId}`);
      
      // Se não houver mais zonas, podemos limpar e remover os listeners
      if (dropZonesByWindow.get(windowId)!.size === 0) {
        dropZonesByWindow.delete(windowId);
      }
    }
  });

  // Adicionar listener para quando uma janela for fechada
  app.on('browser-window-closed', (_, window) => {
    dropZonesByWindow.delete(window.id);
  });

  // Configurar listeners de drag-and-drop para janelas existentes e futuras
  windowManager.onWindowCreated((window) => {
    // Permitir que arquivos sejam arrastados para a janela
    window.webContents.on('did-finish-load', () => {
      Logger.info(`Setting up drag and drop for window ${window.id}`);
      
      // Esta parte pode variar dependendo do código do renderer
      // É melhor notificar o renderer que está pronto para drag and drop
      window.webContents.send('drag-drop:ready');
    });
  });
}

function setupAppEvents() {
  // Salva o estado da janela antes de fechar
  app.on('before-quit', async (event) => {
    // Suprime o evento para permitir salvar o estado
    event.preventDefault();
    
    // Salva o estado da janela
    await saveWindowState();
    
    // Agora podemos sair
    app.exit(0);
  });
  
  // Ao fechar todas as janelas no Windows e Linux, fecha a aplicação
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  // No macOS, quando clicar no dock, reabrir uma janela
  app.on('activate', () => {
    if (windowManager && windowManager.getWindowCount() === 0) {
      windowManager.createWindow();
    }
  });
}

// Aguarda o app estar pronto para iniciar
app.whenReady().then(createApplication).catch(err => {
  console.error('Failed to initialize application:', err);
  app.quit();
});

// Ajuste para macOS - ao clicar em arquivos/URLs, abrir na aplicação
app.on('open-file', (event, path) => {
  event.preventDefault();
  Logger.info(`Trying to open file: ${path}`);
  // Implementação futura para manipular o arquivo aberto
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  Logger.info(`Trying to open URL: ${url}`);
  // Implementação futura para manipular a URL aberta
});

// Limpa recursos ao sair
app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  
  if (ipcHandler) {
    ipcHandler.dispose();
  }
}); 