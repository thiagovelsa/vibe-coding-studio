export interface DatabaseConfig {
  type: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
}

export interface OllamaConfig {
  baseUrl: string;
  defaultModel: string;
}

export interface ChromaDbConfig {
  host: string;
  port: number;
  baseUrl: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AppConfig {
  port: number;
  env: string;
  name: string;
  frontendUrl: string;
}

export interface LogConfig {
  level: string;
  format: string;
}

export interface AiConfig {
  openaiApiKey: string;
  defaultModel: string;
}

export interface Config {
  app: AppConfig;
  db: DatabaseConfig;
  ollama: OllamaConfig;
  chromaDb: ChromaDbConfig;
  auth: AuthConfig;
  log: LogConfig;
  ai: AiConfig;
} 