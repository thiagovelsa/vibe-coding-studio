/**
 * Interface para operações de banco de dados
 */
export interface DatabaseService {
  /**
   * Inicializa o banco de dados
   */
  initialize(): Promise<void>;
  
  /**
   * Verifica se o banco de dados está disponível
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Status de execução
 */
export enum RunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * Interface para registro de execução
 */
export interface RunRecord {
  id: string;
  name: string;
  status: RunStatus;
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface para registro de log de agente
 */
export interface AgentLogRecord {
  id: string;
  runId: string;
  agentType: string;
  timestamp: Date;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Interface para registro de versão de código
 */
export interface CodeVersionRecord {
  id: string;
  runId: string;
  version: number;
  status: string;
  timestamp: Date;
  files: Record<string, string>;
  metadata?: Record<string, any>;
} 