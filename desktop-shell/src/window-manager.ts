import { BrowserWindow, app, shell, screen } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { AppConfig } from './types';

interface WindowContext {
  workspacePath?: string;
  // Add more context properties as needed
}

interface WindowEntry {
  window: BrowserWindow;
  context?: WindowContext;
}

export class WindowManager {
  // Store window and its context
  private windows: Map<number, WindowEntry> = new Map();
  private config: AppConfig;
  private windowCreatedListeners: ((window: BrowserWindow) => void)[] = [];

  constructor(config: AppConfig) {
    this.config = config;
  }

  /**
   * Cria uma nova janela com as opções especificadas
   * @param options Opções para criação da janela
   * @param context Contexto adicional para a janela (workspace, etc)
   * @returns A instância BrowserWindow criada
   */
  public createWindow(
    options: Electron.BrowserWindowConstructorOptions = {},
    context?: WindowContext
  ): BrowserWindow {
    // Define o ícone da aplicação, diferente para cada plataforma
    let icon;
    if (process.platform === 'win32') {
      icon = path.join(__dirname, '../assets/icon.ico');
    } else if (process.platform === 'darwin') {
      icon = path.join(__dirname, '../assets/icon.icns');
    } else {
      icon = path.join(__dirname, '../assets/icon.png');
    }

    // Obtém o tamanho primário da tela
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Cria a janela com as configurações padrão e as especificadas
    const window = new BrowserWindow({
      width: Math.min(1280, width * 0.8),
      height: Math.min(800, height * 0.8),
      minWidth: 800,
      minHeight: 600,
      icon,
      backgroundColor: '#2e2c29',
      show: false, // Não mostra até que esteja pronto
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        sandbox: false, // Permite alguns recursos do preload
        // Configurações de segurança recomendadas
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: true,
        enableRemoteModule: false,
      },
      // Mescla com as opções fornecidas
      ...options,
    });

    // Define o contexto da janela
    const windowEntry: WindowEntry = { window, context };
    this.windows.set(window.id, windowEntry);

    // Configura eventos da janela
    // Mostra a janela quando estiver pronta
    window.once('ready-to-show', () => {
      window.show();
      // Abre as ferramentas de desenvolvedor em modo de desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        window.webContents.openDevTools();
      }
    });

    // Remove a janela da lista quando fechada
    window.on('closed', () => {
      this.windows.delete(window.id);
    });

    // Passa o contexto para a página inicial, se fornecido
    let urlParams = '';
    if (context && context.workspacePath) {
      urlParams = `?workspace=${encodeURIComponent(context.workspacePath)}`;
    }

    // Carrega a URL inicial
    const startUrl = process.env.NODE_ENV === 'development'
      ? `http://localhost:${this.config.frontend.port}${urlParams}`
      : url.format({
          pathname: path.join(__dirname, '../../frontend/dist/index.html'),
          protocol: 'file:',
          slashes: true,
          search: urlParams
        });

    window.loadURL(startUrl);

    // Notifica todos os listeners que uma nova janela foi criada
    this.notifyWindowCreated(window);

    return window;
  }

  /**
   * Obtém todas as entradas de janelas gerenciadas
   * @returns Array de entradas de janelas (window, context)
   */
  public getAllWindowEntries(): WindowEntry[] {
    return Array.from(this.windows.values());
  }

  /**
   * Obtém o número de janelas ativas
   * @returns Número de janelas
   */
  public getWindowCount(): number {
    return this.windows.size;
  }

  /**
   * Registra um listener para ser notificado quando uma nova janela é criada
   * @param listener Função a ser chamada quando uma janela é criada
   * @returns Função para remover o listener
   */
  public onWindowCreated(listener: (window: BrowserWindow) => void): () => void {
    this.windowCreatedListeners.push(listener);
    
    // Retorna uma função para remover o listener
    return () => {
      const index = this.windowCreatedListeners.indexOf(listener);
      if (index !== -1) {
        this.windowCreatedListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifica todos os listeners registrados que uma nova janela foi criada
   * @param window A janela criada
   */
  private notifyWindowCreated(window: BrowserWindow): void {
    for (const listener of this.windowCreatedListeners) {
      try {
        listener(window);
      } catch (error) {
        console.error('Erro ao notificar listener de janela criada:', error);
      }
    }
  }

  /**
   * Obtém o contexto de uma janela específica
   * @param windowId ID da janela
   * @returns O contexto da janela ou undefined se não encontrado
   */
  public getWindowContext(windowId: number): WindowContext | undefined {
    const entry = this.windows.get(windowId);
    return entry?.context;
  }

  /**
   * Fecha todas as janelas ativas
   */
  public closeAllWindows(): void {
    for (const entry of this.windows.values()) {
      entry.window.close();
    }
  }

  // Get a specific window by its ID
  getWindowById(id: number): BrowserWindow | undefined {
    return this.windows.get(id)?.window; // Return only the window object
  }

  // Get all managed windows
  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values()).map(entry => entry.window); // Return only window objects
  }

  // Load the frontend into a specific window, potentially with context
  private loadFrontend(window: BrowserWindow, initialContext?: { workspacePath?: string }): void {
    if (!window) return; // Check if window exists

    let loadUrl: string;
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173' 
      : url.format({
          pathname: path.join(app.getAppPath(), 'dist/frontend/index.html'), 
          protocol: 'file:',
          slashes: true
        });

    if (initialContext?.workspacePath) {
      const queryParam = `?workspace=${encodeURIComponent(initialContext.workspacePath)}`;
      loadUrl = `${baseUrl}${queryParam}`;
      console.log(`Loading frontend for window ${window.id} with workspace context: ${initialContext.workspacePath}`);
    } else {
      loadUrl = baseUrl;
      console.log(`Loading frontend for window ${window.id} without specific context.`);
    }

    window.loadURL(loadUrl);

    /* // Old logic
    if (process.env.NODE_ENV === 'development') {
      // Em desenvolvimento, carrega do servidor local
      // Ensure this matches your frontend dev server port
      window.loadURL('http://localhost:5173'); // <<< Common port for Vite React
      console.log(`Loading frontend from dev server into window ${window.id}`);
    } else {
      // Em produção, carrega do build
      const indexPath = path.join(app.getAppPath(), 'dist/frontend/index.html'); // Adjust path for production build
      console.log(`Loading frontend from production build: ${indexPath} into window ${window.id}`);
      window.loadURL(
        url.format({
          pathname: indexPath, 
          protocol: 'file:',
          slashes: true
        })
      );
    }
    */
  }

  // Configure events for a specific window
  private setupWindowEvents(window: BrowserWindow): void {
    if (!window) return;

    // Mostra a janela quando estiver pronta
    window.once('ready-to-show', () => {
      window.show();
      console.log(`Window ${window.id} ready and shown.`);
    });

    // Limpa a referência quando a janela for fechada
    window.on('closed', () => {
      const windowId = window.id;
      this.windows.delete(windowId); // Remove from map
      console.log(`Window ${windowId} closed and removed from manager.`);
      // Check if it was the last window? Maybe trigger app quit?
      // if (this.windows.size === 0 && process.platform !== 'darwin') {
      //   app.quit();
      // }
    });
  }

  // Configura para abrir links externos no navegador padrão for a specific window
  private setupExternalLinks(window: BrowserWindow): void {
    if (!window) return;

    window.webContents.setWindowOpenHandler(({ url }) => {
      // Abre URLs externas no navegador padrão
      if (url.startsWith('http')) {
        console.log(`Opening external URL: ${url} from window ${window.id}`);
        shell.openExternal(url);
        return { action: 'deny' }; // Prevent Electron from opening a new window
      }
      // Allow other actions (e.g., internal protocols) if needed
      return { action: 'allow' };
    });
  }
} 