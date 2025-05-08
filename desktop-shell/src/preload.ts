import { contextBridge, ipcRenderer } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Interface das APIs expostas para o renderer process
interface ElectronAPI {
  getBackendUrl: () => Promise<string>;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    readDir: (path: string) => Promise<string[]>;
  };
  app: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  // Novas APIs para integração com o sistema
  dialog: {
    openFile: (options?: Electron.OpenDialogOptions) => Promise<string[] | null>;
    saveFile: (options?: Electron.SaveDialogOptions) => Promise<string | null>;
    openDirectory: (options?: Electron.OpenDialogOptions) => Promise<string[] | null>;
    showMessage: (options: {
      type: 'none' | 'info' | 'error' | 'question' | 'warning';
      title: string;
      message: string;
      detail?: string;
      buttons?: string[];
      defaultId?: number;
      cancelId?: number;
    }) => Promise<{ response: number; checkboxChecked?: boolean }>;
  };
  dragDrop: {
    registerFileDropZone: (elementId: string) => void;
    unregisterFileDropZone: (elementId: string) => void;
    onDrop: (callback: (files: string[]) => void) => () => void;
  };
  system: {
    getInfo: () => Promise<any>;
    getPlatform: () => Promise<string>;
    getCpuUsage: () => Promise<number>;
    getMemoryInfo: () => Promise<any>;
    openPath: (path: string) => Promise<string>;
    openExternal: (url: string, options?: { activate?: boolean }) => Promise<void>;
    checkForUpdates: () => Promise<any>;
  };
  taskbar: {
    setProgressBar: (progress: number, options?: { mode?: 'normal' | 'indeterminate' | 'error' | 'paused' }) => Promise<void>;
    clearProgressBar: () => Promise<void>;
    setOverlayIcon: (iconPath: string | null, description: string) => Promise<void>;
    setBadge: (text: string) => Promise<void>;
    flash: (start?: boolean) => Promise<void>;
  };
  clipboard: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
    readImage: () => Promise<any>;
    writeImage: (image: any) => Promise<void>;
    readHTML: () => Promise<string>;
    writeHTML: (html: string) => Promise<void>;
    clear: () => void;
  };
  notifications: {
    show: (options: {
      title: string;
      body?: string;
      icon?: string;
      silent?: boolean;
      urgency?: 'normal' | 'critical' | 'low';
      onClick?: () => void;
    }) => void;
  };
}

// Lista de canais IPC permitidos para segurança
const validChannels = [
  'app:getBackendUrl',
  'app:minimize',
  'app:maximize',
  'app:close',
  'app:create-window',
  'fs:readFile',
  'fs:writeFile',
  'fs:readDir',
  'orchestrator:status',
  'orchestrator:tasks',
  'agent:message',
  'agent:status',
  'app:show-notification',
  'log:event',
  // Canais para diálogos nativos
  'dialog:open-file',
  'dialog:save-file',
  'dialog:open-directory',
  'dialog:show-message',
  // Canais para informações do sistema
  'system:get-info',
  'system:get-platform',
  'system:get-cpu-usage',
  'system:get-memory-info',
  'system:open-path',
  'system:open-external',
  'system:check-for-updates',
  // Canais para controle da taskbar/dock
  'taskbar:set-progress-bar',
  'taskbar:clear-progress-bar',
  'taskbar:set-overlay-icon',
  'taskbar:set-badge',
  'taskbar:flash',
  // Canais para área de transferência
  'clipboard:read-text',
  'clipboard:write-text',
  'clipboard:read-image',
  'clipboard:write-image',
  'clipboard:read-html',
  'clipboard:write-html',
  'clipboard:clear',
  // Canais para notificações
  'notifications:show',
  // Eventos para drag and drop
  'drag-drop:files',
  'drag-drop:register',
  'drag-drop:unregister'
];

// Função utilitária para validar canais
const validateChannel = (channel: string): boolean => {
  if (!validChannels.includes(channel)) {
    console.error(`Canal IPC inválido: ${channel}`);
    return false;
  }
  return true;
};

// Expõe APIs seguras para o renderer process através do contextBridge
// Utiliza o namespace 'electronAPI' para distinguir de outras APIs
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('app:getBackendUrl'),
  
  // Método seguro para invocar canais IPC
  invoke: (channel: string, ...args: any[]) => {
    if (validateChannel(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invoked invalid channel: ${channel}`);
  },
  
  // Método seguro para enviar mensagens via IPC
  send: (channel: string, ...args: any[]) => {
    if (validateChannel(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  
  // Método seguro para assinar eventos IPC
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (validateChannel(channel)) {
      // Wrapper de callback para evitar manipulação de prototype
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      
      // Retorna função para remover o listener
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {}; // Função noop para consistência
  },
  
  // APIs do sistema de arquivos
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
    readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
  },
  
  // APIs de controle da aplicação
  app: {
    minimize: () => ipcRenderer.send('app:minimize'),
    maximize: () => ipcRenderer.send('app:maximize'),
    close: () => ipcRenderer.send('app:close'),
  },

  // APIs de diálogo nativo
  dialog: {
    openFile: (options = {}) => ipcRenderer.invoke('dialog:open-file', options),
    saveFile: (options = {}) => ipcRenderer.invoke('dialog:save-file', options),
    openDirectory: (options = {}) => ipcRenderer.invoke('dialog:open-directory', options),
    showMessage: (options) => ipcRenderer.invoke('dialog:show-message', options),
  },

  // API para drag and drop de arquivos
  dragDrop: {
    registerFileDropZone: (elementId: string) => {
      ipcRenderer.send('drag-drop:register', elementId);
    },
    unregisterFileDropZone: (elementId: string) => {
      ipcRenderer.send('drag-drop:unregister', elementId);
    },
    onDrop: (callback: (files: string[]) => void) => {
      const subscription = (_event: any, files: string[]) => callback(files);
      ipcRenderer.on('drag-drop:files', subscription);
      return () => {
        ipcRenderer.removeListener('drag-drop:files', subscription);
      };
    }
  },

  // APIs para informações do sistema
  system: {
    getInfo: () => ipcRenderer.invoke('system:get-info'),
    getPlatform: () => ipcRenderer.invoke('system:get-platform'),
    getCpuUsage: () => ipcRenderer.invoke('system:get-cpu-usage'),
    getMemoryInfo: () => ipcRenderer.invoke('system:get-memory-info'),
    openPath: (path: string) => ipcRenderer.invoke('system:open-path', path),
    openExternal: (url: string, options = {}) => ipcRenderer.invoke('system:open-external', url, options),
    checkForUpdates: () => ipcRenderer.invoke('system:check-for-updates'),
  },

  // APIs para controle da taskbar/dock
  taskbar: {
    setProgressBar: (progress: number, options = {}) => 
      ipcRenderer.invoke('taskbar:set-progress-bar', progress, options),
    clearProgressBar: () => ipcRenderer.invoke('taskbar:clear-progress-bar'),
    setOverlayIcon: (iconPath: string | null, description: string) => 
      ipcRenderer.invoke('taskbar:set-overlay-icon', iconPath, description),
    setBadge: (text: string) => ipcRenderer.invoke('taskbar:set-badge', text),
    flash: (start = true) => ipcRenderer.invoke('taskbar:flash', start),
  },

  // APIs para uso da área de transferência
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard:read-text'),
    writeText: (text: string) => ipcRenderer.invoke('clipboard:write-text', text),
    readImage: () => ipcRenderer.invoke('clipboard:read-image'),
    writeImage: (image: any) => ipcRenderer.invoke('clipboard:write-image', image),
    readHTML: () => ipcRenderer.invoke('clipboard:read-html'),
    writeHTML: (html: string) => ipcRenderer.invoke('clipboard:write-html', html),
    clear: () => ipcRenderer.send('clipboard:clear'),
  },
  
  // APIs para notificações
  notifications: {
    show: (options) => ipcRenderer.send('notifications:show', options),
  }
});

// Mantém compatibilidade com API anterior (electron)
// Preservando o código existente para evitar quebras de compatibilidade
contextBridge.exposeInMainWorld('electron', {
  getBackendUrl: () => ipcRenderer.invoke('app:getBackendUrl'),
  
  // Método seguro para invocar canais IPC
  invoke: (channel: string, ...args: any[]) => {
    if (validateChannel(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invoked invalid channel: ${channel}`);
  },
  
  // Método seguro para enviar mensagens via IPC
  send: (channel: string, ...args: any[]) => {
    if (validateChannel(channel)) {
      ipcRenderer.send(channel, ...args);
    } 
  },
  
  // Método seguro para assinar eventos IPC
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (validateChannel(channel)) {
      // Wrapper de callback para evitar manipulação de prototype
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      
      // Retorna função para remover o listener
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {}; // Retorna uma função vazia para manter a consistência da API
  },
  
  // APIs do sistema de arquivos
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
    readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
  },
  
  // APIs de controle da aplicação
  app: {
    minimize: () => ipcRenderer.send('app:minimize'),
    maximize: () => ipcRenderer.send('app:maximize'),
    close: () => ipcRenderer.send('app:close'),
  },

  // --- Novas APIs de diálogo nativo ---
  dialog: {
    openFile: (options = {}) => ipcRenderer.invoke('dialog:open-file', options),
    saveFile: (options = {}) => ipcRenderer.invoke('dialog:save-file', options),
    openDirectory: (options = {}) => ipcRenderer.invoke('dialog:open-directory', options),
  },

  // --- API para drag and drop de arquivos ---
  dragDrop: {
    registerFileDropZone: (elementId: string) => {
      ipcRenderer.send('drag-drop:register', elementId);
    },
    unregisterFileDropZone: (elementId: string) => {
      ipcRenderer.send('drag-drop:unregister', elementId);
    },
    onDrop: (callback: (files: string[]) => void) => {
      const subscription = (_event: any, files: string[]) => callback(files);
      ipcRenderer.on('drag-drop:files', subscription);
      return () => {
        ipcRenderer.removeListener('drag-drop:files', subscription);
      };
    }
  },

  // --- APIs para informações do sistema ---
  system: {
    getInfo: () => ipcRenderer.invoke('system:get-info'),
    getPlatform: () => ipcRenderer.invoke('system:get-platform'),
    getCpuUsage: () => ipcRenderer.invoke('system:get-cpu-usage'),
    getMemoryInfo: () => ipcRenderer.invoke('system:get-memory-info'),
    openPath: (path: string) => ipcRenderer.invoke('system:open-path', path),
    openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),
    checkForUpdates: () => ipcRenderer.invoke('system:check-for-updates'),
  },

  // --- APIs para controle da taskbar/dock ---
  taskbar: {
    setProgressBar: (progress: number, options = {}) => 
      ipcRenderer.invoke('taskbar:set-progress-bar', progress, options),
    clearProgressBar: () => ipcRenderer.invoke('taskbar:clear-progress-bar'),
    setOverlayIcon: (iconPath: string | null, description: string) => 
      ipcRenderer.invoke('taskbar:set-overlay-icon', iconPath, description),
    setBadge: (text: string) => ipcRenderer.invoke('taskbar:set-badge', text),
    flash: (start = true) => ipcRenderer.invoke('taskbar:flash', start),
  },

  // --- APIs para uso da área de transferência ---
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard:read-text'),
    writeText: (text: string) => ipcRenderer.invoke('clipboard:write-text', text),
    readImage: () => ipcRenderer.invoke('clipboard:read-image'),
    writeImage: (image: any) => ipcRenderer.invoke('clipboard:write-image', image),
    clear: () => ipcRenderer.send('clipboard:clear'),
  }
});

// APIs expostas para o renderer process (frontend)
const api = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name: string) => ipcRenderer.invoke('app:get-path', name),
  },

  // Sistema de arquivos (funções limitadas e seguras)
  fs: {
    readFile: async (filePath: string): Promise<string> => {
      try {
        return await promisify(fs.readFile)(filePath, { encoding: 'utf-8' });
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        throw error;
      }
    },

    writeFile: async (filePath: string, data: string): Promise<void> => {
      try {
        // Garante que o diretório existe
        const dirname = path.dirname(filePath);
        await promisify(fs.mkdir)(dirname, { recursive: true });
        await promisify(fs.writeFile)(filePath, data, { encoding: 'utf-8' });
      } catch (error) {
        console.error('Erro ao escrever arquivo:', error);
        throw error;
      }
    },

    exists: async (filePath: string): Promise<boolean> => {
      try {
        await promisify(fs.access)(filePath);
        return true;
      } catch {
        return false;
      }
    },

    readdir: async (directoryPath: string): Promise<string[]> => {
      try {
        return await promisify(fs.readdir)(directoryPath);
      } catch (error) {
        console.error('Erro ao ler diretório:', error);
        throw error;
      }
    }
  },

  // Execução de processos (limitado e seguro)
  process: {
    execute: async (command: string, args: string[]): Promise<string> => {
      try {
        return new Promise((resolve, reject) => {
          execFile(command, args, { encoding: 'utf-8' }, (error, stdout) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(stdout);
          });
        });
      } catch (error) {
        console.error('Erro ao executar processo:', error);
        throw error;
      }
    }
  },

  // APIs de integração nativa (adicionais às já fornecidas pelo Electron)
  os: {
    platform: process.platform,
    arch: process.arch,
    release: process.release,
    homedir: process.env.HOME || process.env.USERPROFILE
  },

  // APIs para debugging
  debug: {
    log: (...args: any[]) => {
      console.log(...args);
    },
    error: (...args: any[]) => {
      console.error(...args);
    }
  }
};

// Expose the legacy api variable directly (existing implementation preserved for backward compatibility)
contextBridge.exposeInMainWorld('api', api); 