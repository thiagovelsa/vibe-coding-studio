import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { AppConfig } from './types';

// Configuração padrão do aplicativo
const defaultConfig: AppConfig = {
  windowOptions: {
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#2e2c29'
  },
  backend: {
    port: 3333,
    host: 'localhost',
    apiPrefix: '/api'
  },
  devTools: process.env.NODE_ENV !== 'production'
};

// Carrega configurações do ambiente
export async function loadConfig(): Promise<AppConfig> {
  try {
    // Determina o caminho para o arquivo de configuração
    const configPath = path.join(app.getPath('userData'), 'config.json');
    
    // Verifica se o arquivo de configuração existe
    try {
      await fs.access(configPath);
    } catch (error) {
      // Arquivo não existe, cria com configurações padrão
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      return { ...defaultConfig };
    }
    
    // Lê e analisa o arquivo de configuração
    const configContent = await fs.readFile(configPath, 'utf-8');
    const userConfig = JSON.parse(configContent);
    
    // Mescla as configurações do usuário com as configurações padrão
    return {
      ...defaultConfig,
      ...userConfig,
      windowOptions: {
        ...defaultConfig.windowOptions,
        ...(userConfig.windowOptions || {}),
      },
      backend: {
        ...defaultConfig.backend,
        ...(userConfig.backend || {}),
      },
      devTools: process.env.NODE_ENV === 'development'
    };
  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
    return { ...defaultConfig };
  }
}

// Exporta a configuração carregada
export const config = loadConfig();

/**
 * Salva a configuração da aplicação
 */
export async function saveConfig(config: Partial<AppConfig>): Promise<boolean> {
  try {
    // Carrega a configuração atual
    const currentConfig = await loadConfig();
    
    // Mescla as novas configurações com as atuais
    const newConfig = {
      ...currentConfig,
      ...config,
      windowOptions: {
        ...currentConfig.windowOptions,
        ...(config.windowOptions || {}),
      },
      backend: {
        ...currentConfig.backend,
        ...(config.backend || {}),
      },
    };
    
    // Salva a configuração atualizada
    const configPath = path.join(app.getPath('userData'), 'config.json');
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return false;
  }
} 