import { ipcMain, BrowserWindow, app, Notification, dialog, shell, clipboard, nativeImage, screen } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import { EventEmitter } from 'events';
import io from 'socket.io-client';
import { Logger } from '../utils/logger';
import { WindowManager } from './window-manager';

/**
 * Classe responsável por gerenciar a comunicação IPC entre o processo principal,
 * processo de renderização e backend NestJS
 */
export class IpcHandler {
  // EventEmitter para comunicação interna
  private eventEmitter = new EventEmitter();
  
  // URL do servidor backend
  private backendUrl: string;
  
  // Cliente HTTP para comunicação com o backend
  private backendClient: any;
  
  // Referência ao WindowManager
  private windowManager: WindowManager;
  
  // WebSocket para comunicação em tempo real
  private webSocket: WebSocket | null = null;
  
  /**
   * Construtor do IpcHandler
   * @param config Configuração contendo a URL do backend
   */
  constructor(config: { backendUrl: string; windowManager: WindowManager }) {
    this.backendUrl = config.backendUrl;
    this.windowManager = config.windowManager;
    
    // Inicializa o cliente HTTP para o backend
    this.backendClient = axios.create({
      baseURL: this.backendUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Inicia a conexão WebSocket
    this.setupWebSocket();
    
    // Registra os handlers IPC
    this.registerIpcHandlers();
  }
  
  /**
   * Configura a conexão WebSocket com o backend
   */
  private setupWebSocket() {
    try {
      const wsUrl = this.backendUrl.replace(/^http/, 'ws') + '/events';
      this.webSocket = io(wsUrl, {
        transports: ['websocket'],
        reconnectionDelayMax: 10000,
      });
      
      this.webSocket.on('connect', () => {
        Logger.info('WebSocket conectado ao backend');
        BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) {
            win.webContents.send('websocket-status', { status: 'connected' });
          }
        });
      });
      
      this.webSocket.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          
          // Encaminha os eventos recebidos pelo WebSocket para o eventEmitter
          if (parsedMessage.type && parsedMessage.payload) {
            this.eventEmitter.emit(parsedMessage.type, parsedMessage.payload);
            
            // Encaminha para as janelas de renderização
            this.broadcastToRenderers(parsedMessage.type, parsedMessage.payload);
          }
        } catch (error) {
          Logger.error('Erro ao processar mensagem WebSocket:', error);
        }
      });
      
      this.webSocket.on('disconnect', (reason) => {
        Logger.warn(`WebSocket desconectado: ${reason}, tentando reconectar...`);
        BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) {
            win.webContents.send('websocket-status', { status: 'disconnected', reason });
          }
        });
      });
    } catch (error) {
      Logger.error('Falha ao configurar WebSocket:', error);
      // Tenta reconectar após 3 segundos
      setTimeout(() => this.setupWebSocket(), 3000);
    }
  }
  
  /**
   * Envia uma mensagem para todas as janelas de renderização
   */
  private broadcastToRenderers(channel: string, ...args: any[]) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args);
      }
    }
  }
  
  /**
   * Registra todos os handlers IPC para comunicação com o renderer
   */
  private registerIpcHandlers() {
    // Handlers básicos da aplicação
    ipcMain.handle('app:getBackendUrl', () => this.backendUrl);
    
    // Handler para criar nova janela, agora aceita contexto opcional
    ipcMain.handle('app:create-window', (_event, context?: { workspacePath?: string }) => {
      try {
        // Passa o contexto recebido (se houver) para o WindowManager
        const newWindow = this.windowManager.createWindow(undefined, context);
        return { success: true, windowId: newWindow.id };
      } catch (error: any) {
        Logger.error('Falha ao criar nova janela via IPC:', error);
        return { success: false, error: error.message || 'Erro desconhecido' };
      }
    });
    
    ipcMain.handle('app:get-version', () => app.getVersion());
    ipcMain.handle('app:get-path', (_event, name) => app.getPath(name));
    
    // Handler para mostrar notificações nativas
    ipcMain.on('app:show-notification', (_event, options: { title: string; body: string; [key: string]: any }) => {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: options.title || 'VibeForge', // Default title
          body: options.body,
          // Pass other supported options like silent, icon, hasReply, etc.
          ...(options.icon && { icon: options.icon }),
          ...(options.silent && { silent: options.silent }),
          // Add more options as needed based on NotificationConstructorOptions
        });
        notification.show();
        Logger.info(`Showing notification: ${options.title} - ${options.body}`);

        // Handle notification events if needed (e.g., click, reply)
        // notification.on('click', () => { console.log('Notification clicked'); });
      } else {
        Logger.warn('Native notifications not supported on this system.');
      }
    });
    
    ipcMain.on('app:minimize', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.minimize();
    });
    
    ipcMain.on('app:maximize', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      }
    });
    
    ipcMain.on('app:close', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.close();
    });
    
    // Handlers para sistema de arquivos
    ipcMain.handle('fs:readFile', async (_, filePath) => {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(app.getAppPath(), filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        return content;
      } catch (error: any) {
        Logger.error(`Erro ao ler arquivo ${filePath}:`, error);
        throw new Error(`Falha ao ler arquivo: ${error.message}`);
      }
    });
    
    ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(app.getAppPath(), filePath);
        await fs.writeFile(fullPath, content);
        return true;
      } catch (error: any) {
        Logger.error(`Erro ao escrever arquivo ${filePath}:`, error);
        throw new Error(`Falha ao escrever arquivo: ${error.message}`);
      }
    });
    
    ipcMain.handle('fs:readDir', async (_, dirPath) => {
      try {
        const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(app.getAppPath(), dirPath);
        const files = await fs.readdir(fullPath);
        return files;
      } catch (error: any) {
        Logger.error(`Erro ao ler diretório ${dirPath}:`, error);
        throw new Error(`Falha ao ler diretório: ${error.message}`);
      }
    });
    
    // Handlers para comunicação com o backend
    ipcMain.handle('orchestrator:status', async () => {
      try {
        const response = await this.backendClient.get('/orchestrator/status');
        return response.data;
      } catch (error) {
        Logger.error('Erro ao obter status do orquestrador:', error);
        throw new Error('Falha ao comunicar com o backend');
      }
    });
    
    ipcMain.handle('orchestrator:tasks', async () => {
      try {
        const response = await this.backendClient.get('/orchestrator/tasks');
        return response.data;
      } catch (error) {
        Logger.error('Erro ao obter tarefas do orquestrador:', error);
        throw new Error('Falha ao comunicar com o backend');
      }
    });
    
    // Rota genérica para chamadas API
    ipcMain.handle('api:call', async (_, method, endpoint, data) => {
      try {
        const response = await this.backendClient({
          method,
          url: endpoint,
          data,
        });
        return response.data;
      } catch (error: any) {
        Logger.error(`Erro na chamada API ${method} ${endpoint}:`, error);
        throw new Error(error.response?.data?.message || 'Falha na chamada da API');
      }
    });

    // ----- Handlers para diálogos nativos -----
    ipcMain.handle('dialog:open-file', async (event, options = {}) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await dialog.showOpenDialog(window!, {
          properties: ['openFile', 'multiSelections'],
          ...options
        });
        
        return result.canceled ? null : result.filePaths;
      } catch (error: any) {
        Logger.error('Erro ao abrir diálogo de arquivo:', error);
        throw new Error(`Falha ao abrir diálogo: ${error.message}`);
      }
    });

    ipcMain.handle('dialog:save-file', async (event, options = {}) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await dialog.showSaveDialog(window!, options);
        
        return result.canceled ? null : result.filePath;
      } catch (error: any) {
        Logger.error('Erro ao abrir diálogo para salvar arquivo:', error);
        throw new Error(`Falha ao abrir diálogo: ${error.message}`);
      }
    });

    ipcMain.handle('dialog:open-directory', async (event, options = {}) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await dialog.showOpenDialog(window!, {
          properties: ['openDirectory', 'createDirectory'],
          ...options
        });
        
        return result.canceled ? null : result.filePaths;
      } catch (error: any) {
        Logger.error('Erro ao abrir diálogo de diretório:', error);
        throw new Error(`Falha ao abrir diálogo: ${error.message}`);
      }
    });

    ipcMain.handle('dialog:show-message', async (event, options) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await dialog.showMessageBox(window!, {
          type: options.type || 'info',
          title: options.title,
          message: options.message,
          detail: options.detail,
          buttons: options.buttons || ['OK'],
          defaultId: options.defaultId || 0,
          cancelId: options.cancelId || -1,
        });
        
        return {
          response: result.response,
          checkboxChecked: result.checkboxChecked
        };
      } catch (error: any) {
        Logger.error('Erro ao mostrar mensagem de diálogo:', error);
        throw new Error(`Falha ao mostrar diálogo: ${error.message}`);
      }
    });

    // ----- Handlers para informações do sistema -----
    ipcMain.handle('system:get-info', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        cpus: os.cpus(),
        memory: {
          total: os.totalmem(),
          free: os.freemem()
        },
        osVersion: os.version(),
        osRelease: os.release(),
        hostname: os.hostname(),
        userInfo: os.userInfo(),
        uptime: os.uptime(),
        displays: screen.getAllDisplays(),
        primaryDisplay: screen.getPrimaryDisplay()
      };
    });

    ipcMain.handle('system:get-platform', () => process.platform);

    ipcMain.handle('system:get-cpu-usage', async () => {
      // CPU usage calculation is a simple approximation
      // For more accurate values, consider using a native module
      try {
        const initialUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentUsage = process.cpuUsage(initialUsage);
        
        // Calculate CPU usage percentage based on 100ms sample
        const percentage = (currentUsage.user + currentUsage.system) / 10000;
        return Math.min(100, Math.max(0, percentage)); // Ensure between 0-100
      } catch (error: any) {
        Logger.error('Erro ao obter uso da CPU:', error);
        return 0; // Default safe value
      }
    });

    ipcMain.handle('system:get-memory-info', () => {
      return {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentUsed: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      };
    });

    ipcMain.handle('system:open-path', async (_, filePath) => {
      try {
        const result = await shell.openPath(filePath);
        return result; // Returns empty string on success, error message on failure
      } catch (error: any) {
        Logger.error(`Erro ao abrir caminho ${filePath}:`, error);
        throw new Error(`Falha ao abrir caminho: ${error.message}`);
      }
    });

    ipcMain.handle('system:open-external', async (_, url, options = {}) => {
      try {
        await shell.openExternal(url, options);
        return true;
      } catch (error: any) {
        Logger.error(`Erro ao abrir URL externa ${url}:`, error);
        throw new Error(`Falha ao abrir URL: ${error.message}`);
      }
    });

    ipcMain.handle('system:check-for-updates', async () => {
      // Basic placeholder for update check
      // Implement with actual auto-update mechanism (like electron-updater)
      try {
        // Simulate update check - replace with actual update logic
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          hasUpdate: false,
          currentVersion: app.getVersion(),
          latestVersion: app.getVersion(),
          releaseNotes: 'No updates available at this time.',
          updateUrl: null
        };
      } catch (error: any) {
        Logger.error('Erro ao verificar atualizações:', error);
        throw new Error(`Falha ao verificar atualizações: ${error.message}`);
      }
    });

    // ----- Handlers para taskbar/dock -----
    ipcMain.handle('taskbar:set-progress-bar', (event, progress, options = {}) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          window.setProgressBar(progress, options);
          return true;
        }
        return false;
      } catch (error: any) {
        Logger.error('Erro ao definir barra de progresso:', error);
        throw new Error(`Falha ao definir barra de progresso: ${error.message}`);
      }
    });

    ipcMain.handle('taskbar:clear-progress-bar', (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          window.setProgressBar(-1); // -1 removes the progress bar
          return true;
        }
        return false;
      } catch (error: any) {
        Logger.error('Erro ao limpar barra de progresso:', error);
        throw new Error(`Falha ao limpar barra de progresso: ${error.message}`);
      }
    });

    ipcMain.handle('taskbar:set-overlay-icon', async (event, iconPath, description) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) return false;

        if (iconPath === null) {
          window.setOverlayIcon(null, '');
          return true;
        }

        // Load icon from path
        const icon = nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) {
          throw new Error('Ícone inválido ou não encontrado');
        }

        window.setOverlayIcon(icon, description || '');
        return true;
      } catch (error: any) {
        Logger.error('Erro ao definir ícone de sobreposição:', error);
        throw new Error(`Falha ao definir ícone: ${error.message}`);
      }
    });

    ipcMain.handle('taskbar:set-badge', (event, text) => {
      try {
        if (process.platform === 'darwin' || process.platform === 'linux') {
          app.setBadgeCount(parseInt(text) || 0);
          return true;
        } else if (process.platform === 'win32') {
          const window = BrowserWindow.fromWebContents(event.sender);
          if (window && window.setTitle) {
            const currentTitle = window.getTitle();
            // On Windows, simulate badge with title change
            window.setTitle(`${text ? `(${text}) ` : ''}${currentTitle.replace(/^\(\d+\)\s/, '')}`);
            return true;
          }
        }
        return false;
      } catch (error: any) {
        Logger.error('Erro ao definir badge:', error);
        throw new Error(`Falha ao definir badge: ${error.message}`);
      }
    });

    ipcMain.handle('taskbar:flash', (event, start = true) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          if (start) {
            window.flashFrame(true);
          } else {
            window.flashFrame(false);
          }
          return true;
        }
        return false;
      } catch (error: any) {
        Logger.error('Erro ao fazer taskbar piscar:', error);
        throw new Error(`Falha ao fazer taskbar piscar: ${error.message}`);
      }
    });

    // ----- Handlers para clipboard -----
    ipcMain.handle('clipboard:read-text', () => {
      try {
        return clipboard.readText();
      } catch (error: any) {
        Logger.error('Erro ao ler texto da área de transferência:', error);
        throw new Error(`Falha ao ler texto: ${error.message}`);
      }
    });

    ipcMain.handle('clipboard:write-text', (_, text) => {
      try {
        clipboard.writeText(text);
        return true;
      } catch (error: any) {
        Logger.error('Erro ao escrever texto na área de transferência:', error);
        throw new Error(`Falha ao escrever texto: ${error.message}`);
      }
    });

    ipcMain.handle('clipboard:read-image', () => {
      try {
        const image = clipboard.readImage();
        if (image.isEmpty()) return null;
        
        return {
          dataURL: image.toDataURL(),
          size: image.getSize(),
          aspect: image.getAspectRatio(),
          isEmpty: image.isEmpty()
        };
      } catch (error: any) {
        Logger.error('Erro ao ler imagem da área de transferência:', error);
        throw new Error(`Falha ao ler imagem: ${error.message}`);
      }
    });

    ipcMain.handle('clipboard:write-image', (_, imageData) => {
      try {
        let image;
        
        if (typeof imageData === 'string') {
          // Assume it's a path or data URL
          if (imageData.startsWith('data:')) {
            image = nativeImage.createFromDataURL(imageData);
          } else {
            image = nativeImage.createFromPath(imageData);
          }
        } else if (imageData.toPNG) {
          // Already a nativeImage
          image = imageData;
        } else if (imageData.buffer) {
          // Buffer
          image = nativeImage.createFromBuffer(imageData.buffer);
        } else {
          throw new Error('Formato de imagem inválido');
        }
        
        if (image.isEmpty()) {
          throw new Error('Imagem vazia ou inválida');
        }
        
        clipboard.writeImage(image);
        return true;
      } catch (error: any) {
        Logger.error('Erro ao escrever imagem na área de transferência:', error);
        throw new Error(`Falha ao escrever imagem: ${error.message}`);
      }
    });

    ipcMain.handle('clipboard:read-html', () => {
      try {
        return clipboard.readHTML();
      } catch (error: any) {
        Logger.error('Erro ao ler HTML da área de transferência:', error);
        throw new Error(`Falha ao ler HTML: ${error.message}`);
      }
    });

    ipcMain.handle('clipboard:write-html', (_, html) => {
      try {
        clipboard.writeHTML(html);
        return true;
      } catch (error: any) {
        Logger.error('Erro ao escrever HTML na área de transferência:', error);
        throw new Error(`Falha ao escrever HTML: ${error.message}`);
      }
    });

    ipcMain.on('clipboard:clear', () => {
      try {
        clipboard.clear();
      } catch (error) {
        Logger.error('Erro ao limpar área de transferência:', error);
      }
    });

    // ----- Handlers para drag and drop -----
    // Estes handlers principalmente gerenciam o registro de zonas de drop
    // A implementação real acontece no BrowserWindow webContents
    const dropZones = new Map<string, BrowserWindow>();

    ipcMain.on('drag-drop:register', (event, elementId) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        dropZones.set(elementId, window);
        Logger.info(`Zona de drop registrada: ${elementId}`);
      }
    });

    ipcMain.on('drag-drop:unregister', (_, elementId) => {
      dropZones.delete(elementId);
      Logger.info(`Zona de drop removida: ${elementId}`);
    });

    // ----- Handlers para notificações -----
    ipcMain.on('notifications:show', (_, options) => {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: options.title,
          body: options.body || '',
          icon: options.icon,
          silent: options.silent || false,
          urgency: options.urgency || 'normal',
        });
        
        if (options.onClick) {
          notification.on('click', options.onClick);
        }
        
        notification.show();
      } else {
        Logger.warn('Notificações nativas não são suportadas neste sistema');
      }
    });
  }

  public dispose() {
    // Cleanup resources
    if (this.webSocket) {
      this.webSocket.disconnect();
    }
    
    this.eventEmitter.removeAllListeners();
    
    // Remove IPC handlers
    ipcMain.removeHandler('app:getBackendUrl');
    ipcMain.removeHandler('app:create-window');
    ipcMain.removeHandler('fs:readFile');
    ipcMain.removeHandler('fs:writeFile');
    ipcMain.removeHandler('fs:readDir');
    ipcMain.removeHandler('orchestrator:status');
    ipcMain.removeHandler('orchestrator:tasks');
    
    // Remove novel feature handlers
    ipcMain.removeHandler('dialog:open-file');
    ipcMain.removeHandler('dialog:save-file');
    ipcMain.removeHandler('dialog:open-directory');
    ipcMain.removeHandler('dialog:show-message');
    ipcMain.removeHandler('system:get-info');
    ipcMain.removeHandler('system:get-platform');
    ipcMain.removeHandler('system:get-cpu-usage');
    ipcMain.removeHandler('system:get-memory-info');
    ipcMain.removeHandler('system:open-path');
    ipcMain.removeHandler('system:open-external');
    ipcMain.removeHandler('system:check-for-updates');
    ipcMain.removeHandler('taskbar:set-progress-bar');
    ipcMain.removeHandler('taskbar:clear-progress-bar');
    ipcMain.removeHandler('taskbar:set-overlay-icon');
    ipcMain.removeHandler('taskbar:set-badge');
    ipcMain.removeHandler('taskbar:flash');
    ipcMain.removeHandler('clipboard:read-text');
    ipcMain.removeHandler('clipboard:write-text');
    ipcMain.removeHandler('clipboard:read-image');
    ipcMain.removeHandler('clipboard:write-image');
    ipcMain.removeHandler('clipboard:read-html');
    ipcMain.removeHandler('clipboard:write-html');
  }
} 