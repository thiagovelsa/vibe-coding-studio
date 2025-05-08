// Tipos para comunicação com o frontend
export interface IpcChannels {
  app: {
    getVersion: string;
    getPath: string;
  }
}

// Tipos para a API exposta ao frontend
export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
  };
  fs: {
    readFile: (filePath: string) => Promise<string>;
    writeFile: (filePath: string, data: string) => Promise<void>;
    exists: (filePath: string) => Promise<boolean>;
    readdir: (directoryPath: string) => Promise<string[]>;
  };
  process: {
    execute: (command: string, args: string[]) => Promise<{ stdout: string, stderr: string }>;
  };
}

// Definições para integração com o backend
export interface BackendConfig {
  port: number;
  host: string;
  apiPrefix: string;
}

// Tipos para configuração da aplicação
export interface AppConfig {
  windowOptions: Electron.BrowserWindowConstructorOptions;
  backend: BackendConfig;
  devTools: boolean;
} 