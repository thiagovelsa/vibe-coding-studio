import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { 
  Config, 
  AppConfig, 
  DatabaseConfig, 
  OllamaConfig, 
  ChromaDbConfig, 
  AuthConfig, 
  LogConfig,
  AiConfig
} from '@common/interfaces/config.interface';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get<T>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue as T);
  }

  /**
   * Retorna todas as configurações de aplicação
   */
  get config(): Config {
    return {
      app: this.appConfig,
      db: this.dbConfig,
      ollama: this.ollamaConfig,
      chromaDb: this.chromaDbConfig,
      auth: this.authConfig,
      log: this.logConfig,
      ai: this.aiConfig,
    };
  }

  /**
   * Retorna as configurações da aplicação
   */
  get appConfig(): AppConfig {
    return {
      port: parseInt(this.get<string>('PORT', '3000')),
      env: this.get<string>('NODE_ENV', 'development'),
      name: this.get<string>('APP_NAME', 'VibeForge'),
      frontendUrl: this.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    };
  }

  /**
   * Retorna as configurações do banco de dados
   */
  get dbConfig(): DatabaseConfig {
    return {
      type: this.get<string>('DB_TYPE', 'sqlite'),
      database: this.get<string>('DB_DATABASE', 'vibeforge.sqlite'),
      synchronize: this.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      logging: this.get<string>('DB_LOGGING', 'false') === 'true',
    };
  }

  /**
   * Retorna as configurações do Ollama
   */
  get ollamaConfig(): OllamaConfig {
    return {
      baseUrl: this.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434'),
      defaultModel: this.get<string>('OLLAMA_DEFAULT_MODEL', 'llama2'),
    };
  }

  /**
   * Retorna as configurações do ChromaDB
   */
  get chromaDbConfig(): ChromaDbConfig {
    const host = this.get<string>('CHROMADB_HOST', 'localhost');
    const port = parseInt(this.get<string>('CHROMADB_PORT', '8000'));
    
    return {
      host,
      port,
      baseUrl: `http://${host}:${port}`,
    };
  }

  /**
   * Retorna as configurações de autenticação
   */
  get authConfig(): AuthConfig {
    return {
      jwtSecret: this.get<string>('JWT_SECRET', 'your-secret-key-change-in-production'),
      jwtExpiresIn: this.get<string>('JWT_EXPIRATION', '1d'),
      refreshTokenExpiresIn: this.get<string>('REFRESH_TOKEN_EXPIRATION', '7d'),
    };
  }

  /**
   * Retorna as configurações de log
   */
  get logConfig(): LogConfig {
    return {
      level: this.get<string>('LOG_LEVEL', 'info'),
      format: this.get<string>('LOG_FORMAT', 'combined'),
    };
  }

  /**
   * Retorna as configurações de IA
   */
  get aiConfig(): AiConfig {
    return {
      openaiApiKey: this.get<string>('OPENAI_API_KEY', ''),
      defaultModel: this.get<string>('AI_MODEL', 'gpt-4'),
    };
  }
} 