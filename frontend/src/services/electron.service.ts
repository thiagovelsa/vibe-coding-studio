// Type definitions for Electron API exposta via preload
export interface ElectronAPI {
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
}

// Declare a interface global do window com a API do Electron
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

/**
 * Verifica se a aplicação está rodando no ambiente Electron
 * @returns {boolean} true se está rodando no Electron, false caso contrário
 */
export const isElectron = (): boolean => {
  return Boolean(window.electron);
};

/**
 * Service para interação com as APIs do Electron
 */
export const ElectronService = {
  /**
   * Verifica se está rodando no ambiente Electron
   */
  isElectron: isElectron(),
  
  /**
   * Obtém a URL do backend
   */
  getBackendUrl: async (): Promise<string> => {
    if (!isElectron()) {
      // Retorna URL padrão se não estiver no Electron
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000';
      return apiUrl;
    }
    
    return window.electron!.getBackendUrl();
  },
  
  /**
   * Invoca um canal IPC de forma assíncrona
   */
  invoke: async <T = any>(channel: string, ...args: any[]): Promise<T> => {
    if (!isElectron()) {
      throw new Error(`Não é possível invocar o canal '${channel}' fora do ambiente Electron`);
    }
    
    return window.electron!.invoke(channel, ...args);
  },
  
  /**
   * Envia uma mensagem para um canal IPC
   */
  send: (channel: string, ...args: any[]): void => {
    if (!isElectron()) {
      console.warn(`Não é possível enviar para o canal '${channel}' fora do ambiente Electron`);
      return;
    }
    
    window.electron!.send(channel, ...args);
  },
  
  /**
   * Assina eventos de um canal IPC
   * @returns Função para cancelar a assinatura
   */
  on: (channel: string, callback: (...args: any[]) => void): (() => void) => {
    if (!isElectron()) {
      console.warn(`Não é possível assinar o canal '${channel}' fora do ambiente Electron`);
      return () => {}; // Retorna uma função vazia
    }
    
    // Registra o listener e retorna a função de cleanup
    return window.electron!.on(channel, callback);
  },
  
  /**
   * Controles da janela da aplicação
   */
  window: {
    minimize: (): void => {
      if (isElectron()) {
        window.electron!.app.minimize();
      }
    },
    
    maximize: (): void => {
      if (isElectron()) {
        window.electron!.app.maximize();
      }
    },
    
    close: (): void => {
      if (isElectron()) {
        window.electron!.app.close();
      }
    }
  },
  
  /**
   * APIs de sistema de arquivos
   */
  fs: {
    /**
     * Lê um arquivo de forma assíncrona
     */
    readFile: async (path: string): Promise<string> => {
      if (!isElectron()) {
        throw new Error('API de sistema de arquivos só está disponível no ambiente Electron');
      }
      
      return window.electron!.fs.readFile(path);
    },
    
    /**
     * Escreve em um arquivo de forma assíncrona
     */
    writeFile: async (path: string, content: string): Promise<void> => {
      if (!isElectron()) {
        throw new Error('API de sistema de arquivos só está disponível no ambiente Electron');
      }
      
      return window.electron!.fs.writeFile(path, content);
    },
    
    /**
     * Lista arquivos em um diretório de forma assíncrona
     */
    readDir: async (path: string): Promise<string[]> => {
      if (!isElectron()) {
        throw new Error('API de sistema de arquivos só está disponível no ambiente Electron');
      }
      
      return window.electron!.fs.readDir(path);
    }
  },
  
  /**
   * Executar chamada de API via Electron
   */
  api: {
    call: async <T = any>(method: string, endpoint: string, data?: any): Promise<T> => {
      if (!isElectron()) {
        throw new Error('API de chamada via Electron só está disponível no ambiente Electron');
      }
      
      return window.electron!.invoke('api:call', method, endpoint, data);
    },
    
    get: async <T = any>(endpoint: string, params?: any): Promise<T> => {
      return ElectronService.api.call<T>('get', endpoint, params);
    },
    
    post: async <T = any>(endpoint: string, data?: any): Promise<T> => {
      return ElectronService.api.call<T>('post', endpoint, data);
    },
    
    put: async <T = any>(endpoint: string, data?: any): Promise<T> => {
      return ElectronService.api.call<T>('put', endpoint, data);
    },
    
    delete: async <T = any>(endpoint: string): Promise<T> => {
      return ElectronService.api.call<T>('delete', endpoint);
    }
  }
}; 