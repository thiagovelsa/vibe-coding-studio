/**
 * Interfaces para o sistema de persistência relacional do VibeForge
 */

export enum RunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum AgentLogStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum CodeVersionStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPERSEDED = 'superseded',
}

/**
 * Interface que define a estrutura de uma tabela no banco de dados
 */
export interface TableSchema {
  name: string;
  columns: {
    name: string;
    type: string;
    primaryKey?: boolean;
    notNull?: boolean;
    unique?: boolean;
    foreignKey?: {
      table: string;
      column: string;
    };
    default?: any;
  }[];
}

/**
 * Interface para parâmetros de consulta ao banco de dados
 */
export interface QueryParams {
  where?: Record<string, any>;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

/**
 * Interface para resultado de consultas ao banco de dados
 */
export interface QueryResult<T = Record<string, any>> {
  rows: T[];
  count?: number;
  metadata?: Record<string, any>;
}

/**
 * Interface para o serviço de banco de dados relacional
 */
export interface RelationalDatabaseService {
  initialize(): Promise<void>;
  createSchema(schemas: TableSchema[]): Promise<void>;
  query<T = Record<string, any>>(table: string, params?: QueryParams): Promise<QueryResult<T>>;
  insert<T = Record<string, any>>(table: string, data: Partial<T>): Promise<T>;
  update<T = Record<string, any>>(table: string, id: number | string, data: Partial<T>): Promise<T>;
  delete(table: string, id: number | string): Promise<boolean>;
  executeRawQuery<T = Record<string, any>>(query: string, params?: any[]): Promise<QueryResult<T>>;
}

export interface RunHistoryRecord {
  id?: number;
  run_id: string;
  timestamp: string;
  requirement: string;
  user_story_json?: string;
  code_files_json?: string;
  test_results_json?: string;
  status: RunStatus;
  metadata_json?: string;
}

export interface AgentLogRecord {
  id?: number;
  run_id: string;
  agent_type: string;
  timestamp: string;
  input_json: string;
  output_json: string;
  duration_ms: number;
  status: AgentLogStatus;
  metadata_json?: string;
}

export interface CodeVersionRecord {
  id?: number;
  run_id: string;
  version_id: string;
  timestamp: string;
  file_path: string;
  content: string;
  diff_from_previous?: string;
  status: CodeVersionStatus;
  comment?: string;
  metadata_json?: string;
}

export interface RunHistoryFilter {
  run_id?: string;
  status?: RunStatus;
  fromDate?: string;
  toDate?: string;
  requirement?: string;
}

export interface AgentLogFilter {
  run_id?: string;
  agent_type?: string;
  status?: AgentLogStatus;
  fromDate?: string;
  toDate?: string;
}

export interface CodeVersionFilter {
  run_id?: string;
  version_id?: string;
  file_path?: string;
  status?: CodeVersionStatus;
  fromDate?: string;
  toDate?: string;
}

export interface ExportedRun {
  run: RunHistoryRecord;
  logs: AgentLogRecord[];
  codeVersions: CodeVersionRecord[];
} 