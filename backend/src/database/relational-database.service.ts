import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Logger } from 'nestjs-pino';
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  RunHistoryRecord,
  AgentLogRecord,
  CodeVersionRecord,
  RunStatus,
  AgentLogStatus,
  CodeVersionStatus,
  RunHistoryFilter,
  AgentLogFilter,
  CodeVersionFilter,
  ExportedRun
} from './interfaces/relational-database.interface';

@Injectable()
export class RelationalDatabaseService implements OnModuleInit {
  private db: Database | null = null;
  private dbPath: string;
  private initialized = false;
  private initializationPromise: Promise<void> = Promise.resolve();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    if ('setContext' in this.logger) {
      (this.logger as any).setContext('RelationalDatabaseService');
    }
    
    const { database } = this.configService.dbConfig;
    this.dbPath = path.join(process.cwd(), database);
  }

  async onModuleInit() {
    this.initializationPromise = this.initDatabase();
    await this.initializationPromise;
  }

  /**
   * Inicializa o banco de dados SQLite e aplica o schema
   */
  private async initDatabase(): Promise<void> {
    try {
      this.logger.log(`Inicializando banco de dados SQLite em: ${this.dbPath}`);

      // Garantir que o diretório exista
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Conectar ao banco de dados
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      // Habilitar foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON;');

      // Verificar se as tabelas existem, se não, criar
      await this.ensureTablesExist();
      
      this.initialized = true;
      this.logger.log('Database SQLite inicializado com sucesso');
    } catch (error) {
      this.logger.error(`Falha ao inicializar banco de dados: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
      throw error;
    }
  }

  /**
   * Garante que as tabelas necessárias existam no banco de dados
   */
  private async ensureTablesExist(): Promise<void> {
    // Verificar se o schema foi criado
    const tableExists = await this.db?.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='run_history';"
    );

    if (!tableExists) {
      this.logger.log('Criando schema do banco de dados...');
      
      try {
        // Criar tabela run_history
        await this.db?.exec(`
          CREATE TABLE run_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL UNIQUE,
            timestamp TEXT NOT NULL,
            requirement TEXT NOT NULL,
            user_story_json TEXT,
            code_files_json TEXT,
            test_results_json TEXT,
            status TEXT NOT NULL,
            metadata_json TEXT,
            
            CHECK (status IN ('pending', 'running', 'completed', 'failed'))
          );
          
          CREATE INDEX idx_run_history_run_id ON run_history(run_id);
          CREATE INDEX idx_run_history_status ON run_history(status);
          CREATE INDEX idx_run_history_timestamp ON run_history(timestamp);
        `);

        // Criar tabela agent_logs
        await this.db?.exec(`
          CREATE TABLE agent_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            agent_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            input_json TEXT NOT NULL,
            output_json TEXT NOT NULL,
            duration_ms INTEGER NOT NULL,
            status TEXT NOT NULL,
            metadata_json TEXT,
            
            FOREIGN KEY (run_id) REFERENCES run_history(run_id) ON DELETE CASCADE,
            CHECK (status IN ('success', 'error'))
          );
          
          CREATE INDEX idx_agent_logs_run_id ON agent_logs(run_id);
          CREATE INDEX idx_agent_logs_agent_type ON agent_logs(agent_type);
          CREATE INDEX idx_agent_logs_timestamp ON agent_logs(timestamp);
        `);

        // Criar tabela code_versions
        await this.db?.exec(`
          CREATE TABLE code_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            version_id TEXT NOT NULL UNIQUE,
            timestamp TEXT NOT NULL,
            file_path TEXT NOT NULL,
            content TEXT NOT NULL,
            diff_from_previous TEXT,
            status TEXT NOT NULL,
            comment TEXT,
            metadata_json TEXT,
            
            FOREIGN KEY (run_id) REFERENCES run_history(run_id) ON DELETE CASCADE,
            CHECK (status IN ('draft', 'approved', 'rejected', 'superseded'))
          );
          
          CREATE INDEX idx_code_versions_run_id ON code_versions(run_id);
          CREATE INDEX idx_code_versions_version_id ON code_versions(version_id);
          CREATE INDEX idx_code_versions_file_path ON code_versions(file_path);
          CREATE INDEX idx_code_versions_timestamp ON code_versions(timestamp);
        `);

        this.logger.log('Schema do banco de dados criado com sucesso');
      } catch (error) {
        this.logger.error(`Erro ao criar schema do banco de dados: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
        throw error;
      }
    }
  }

  /**
   * Garante que o banco de dados está inicializado
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      if (this.initializationPromise) {
        await this.initializationPromise;
      } else {
        await this.initDatabase();
      }
    }
  }

  /**
   * Salva um registro de execução no banco de dados
   */
  async saveRunHistory(record: Omit<RunHistoryRecord, 'id'>): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      const { run_id, timestamp, requirement, user_story_json, code_files_json, test_results_json, status, metadata_json } = record;
      await this.db.run(
        `INSERT INTO run_history 
        (run_id, timestamp, requirement, user_story_json, code_files_json, test_results_json, status, metadata_json) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [run_id, timestamp, requirement, user_story_json, code_files_json, test_results_json, status, metadata_json]
      );
      this.logger.log(`Run history saved with ID ${run_id}`);
      return run_id;
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      const errorStack = this.getErrorStack(error);
      this.logger.error(`Error saving run history: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma execução
   */
  async updateRunStatus(runId: string, status: RunStatus): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      await this.db.run(
        `UPDATE run_history SET status = ? WHERE run_id = ?`,
        [status, runId]
      );
      
      this.logger.log(`Run status updated: ${runId} -> ${status}`);
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      const errorStack = this.getErrorStack(error);
      this.logger.error(`Error updating run status ${runId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Busca registros de execução com filtros opcionais
   */
  async findRunHistory(filter?: RunHistoryFilter): Promise<RunHistoryRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      let query = `SELECT * FROM run_history`;
      const params: any[] = [];
      
      if (filter) {
        const conditions: string[] = [];
        
        if (filter.run_id) {
          conditions.push(`run_id = ?`);
          params.push(filter.run_id);
        }
        
        if (filter.status) {
          conditions.push(`status = ?`);
          params.push(filter.status);
        }
        
        if (filter.fromDate) {
          conditions.push(`timestamp >= ?`);
          params.push(filter.fromDate);
        }
        
        if (filter.toDate) {
          conditions.push(`timestamp <= ?`);
          params.push(filter.toDate);
        }
        
        if (filter.requirement) {
          conditions.push(`requirement LIKE ?`);
          params.push(`%${filter.requirement}%`);
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      query += ` ORDER BY timestamp DESC`;
      
      return await this.db.all(query, params);
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      const errorStack = this.getErrorStack(error);
      this.logger.error(`Error querying run history: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Salva um log de agente no banco de dados
   */
  async saveAgentLog(record: Omit<AgentLogRecord, 'id'>): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      const { run_id, agent_type, timestamp, input_json, output_json, duration_ms, status, metadata_json } = record;
      
      const result = await this.db.run(
        `INSERT INTO agent_logs 
        (run_id, agent_type, timestamp, input_json, output_json, duration_ms, status, metadata_json) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [run_id, agent_type, timestamp, input_json, output_json, duration_ms, status, metadata_json]
      );
      
      if (!result || typeof result.lastID !== 'number') {
        throw new Error('Failed to get lastID from inserted agent log');
      }
      
      this.logger.log(`Agent log saved with ID ${result.lastID}`);
      return result.lastID;
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      const errorStack = this.getErrorStack(error);
      this.logger.error(`Error saving agent log: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Busca logs de agentes com base em filtros
   */
  async getAgentLogs(filters: AgentLogFilter = {}): Promise<AgentLogRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      const whereConditions = [];
      const params = [];

      if (filters.run_id) {
        whereConditions.push('run_id = ?');
        params.push(filters.run_id);
      }

      if (filters.agent_type) {
        whereConditions.push('agent_type = ?');
        params.push(filters.agent_type);
      }

      if (filters.status) {
        whereConditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.fromDate) {
        whereConditions.push('timestamp >= ?');
        params.push(filters.fromDate);
      }

      if (filters.toDate) {
        whereConditions.push('timestamp <= ?');
        params.push(filters.toDate);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      return await this.db.all(
        `SELECT * FROM agent_logs 
         ${whereClause} 
         ORDER BY timestamp ASC`
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar logs de agentes: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
      throw error;
    }
  }

  /**
   * Salva uma versão de código
   */
  async saveCodeVersion(version: CodeVersionRecord): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      // Gerar version_id se não fornecido
      const version_id = version.version_id || `ver_${uuidv4()}`;
      
      const {
        run_id,
        timestamp,
        file_path,
        content,
        diff_from_previous,
        status,
        comment,
        metadata_json
      } = version;

      await this.db.run(
        `INSERT INTO code_versions 
         (run_id, version_id, timestamp, file_path, content, diff_from_previous, status, comment, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [run_id, version_id, timestamp, file_path, content, diff_from_previous, status, comment, metadata_json]
      );

      this.logger.log(`Versão de código salva: ${version_id} para ${file_path}`);
      return version_id;
    } catch (error) {
      this.logger.error(`Erro ao salvar versão de código: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
      throw error;
    }
  }

  /**
   * Atualiza o status de uma versão de código
   */
  async updateCodeVersionStatus(versionId: string, status: CodeVersionStatus): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      await this.db.run(
        `UPDATE code_versions
         SET status = ?
         WHERE version_id = ?`,
        [status, versionId]
      );
      
      this.logger.log(`Status da versão de código atualizado: ${versionId} -> ${status}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da versão de código: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
      throw error;
    }
  }

  /**
   * Busca versões de código com base em filtros
   */
  async getCodeVersions(filters: CodeVersionFilter = {}): Promise<CodeVersionRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      const whereConditions = [];
      const params = [];

      if (filters.run_id) {
        whereConditions.push('run_id = ?');
        params.push(filters.run_id);
      }

      if (filters.version_id) {
        whereConditions.push('version_id = ?');
        params.push(filters.version_id);
      }

      if (filters.file_path) {
        whereConditions.push('file_path = ?');
        params.push(filters.file_path);
      }

      if (filters.status) {
        whereConditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.fromDate) {
        whereConditions.push('timestamp >= ?');
        params.push(filters.fromDate);
      }

      if (filters.toDate) {
        whereConditions.push('timestamp <= ?');
        params.push(filters.toDate);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      return await this.db.all(
        `SELECT * FROM code_versions 
         ${whereClause} 
         ORDER BY timestamp DESC`
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar versões de código: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
      throw error;
    }
  }

  /**
   * Exporta uma execução completa para JSON
   */
  async exportRunToJson(runId: string): Promise<ExportedRun> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    try {
      // Obter dados da execução
      const run = await this.db.get(
        `SELECT * FROM run_history WHERE run_id = ?`,
        [runId]
      );

      if (!run) {
        throw new Error(`Execução não encontrada: ${runId}`);
      }

      // Obter logs da execução
      const logs = await this.getAgentLogs({ run_id: runId });
      
      // Obter versões de código da execução
      const codeVersions = await this.getCodeVersions({ run_id: runId });

      return {
        run,
        logs,
        codeVersions
      };
    } catch (error) {
      this.logger.error(`Erro ao exportar execução para JSON: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
      throw error;
    }
  }

  /**
   * Importa uma execução a partir de JSON
   */
  async importRunFromJson(data: ExportedRun): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    // Iniciar transação
    await this.db.run('BEGIN TRANSACTION');

    try {
      // Verificar se a execução já existe
      const existingRun = await this.db.get(
        `SELECT run_id FROM run_history WHERE run_id = ?`,
        [data.run.run_id]
      );

      if (existingRun) {
        throw new Error(`Execução já existe: ${data.run.run_id}`);
      }

      // Inserir execução
      await this.saveRunHistory(data.run);

      // Inserir logs
      for (const log of data.logs) {
        await this.saveAgentLog(log);
      }

      // Inserir versões de código
      for (const version of data.codeVersions) {
        await this.saveCodeVersion(version);
      }

      // Commit da transação
      await this.db.run('COMMIT');
      
      this.logger.log(`Execução importada com sucesso: ${data.run.run_id}`);
      return data.run.run_id;
    } catch (error) {
      // Rollback em caso de erro
      await this.db.run('ROLLBACK');
      this.logger.error(`Erro ao importar execução: ${this.getErrorMessage(error)}`, this.getErrorStack(error));
      throw error;
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.logger.log('Conexão com o banco de dados fechada');
    }
  }

  /**
   * Extrai a mensagem de erro de uma exceção, lidando com o tipo 'unknown'
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Obtém o stack trace de um erro, se disponível
   */
  private getErrorStack(error: unknown): string | undefined {
    if (error instanceof Error && error.stack) {
      return error.stack;
    }
    return undefined;
  }

  /**
   * Verifica se uma tabela existe no banco de dados
   */
  private async tableExists(tableName: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const tableExists = await this.db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    
    return tableExists !== undefined;
  }

  /**
   * Cria as tabelas necessárias para armazenar históricos de execução
   */
  async createSchema(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Cria tabela para histórico de execuções
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS run_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL UNIQUE,
          timestamp TEXT NOT NULL,
          requirement TEXT NOT NULL,
          user_story_json TEXT,
          code_files_json TEXT,
          test_results_json TEXT,
          status TEXT NOT NULL,
          metadata_json TEXT,
          UNIQUE(run_id)
        );
      `);
      
      // Cria tabela para logs de agentes
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS agent_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL,
          agent_type TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          input_json TEXT NOT NULL,
          output_json TEXT NOT NULL,
          duration_ms INTEGER NOT NULL,
          status TEXT NOT NULL,
          metadata_json TEXT,
          FOREIGN KEY (run_id) REFERENCES run_history(run_id)
        );
      `);
      
      // Cria tabela para versões de código
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS code_versions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL,
          version_id TEXT NOT NULL UNIQUE,
          timestamp TEXT NOT NULL,
          file_path TEXT NOT NULL,
          content TEXT NOT NULL,
          diff_from_previous TEXT,
          status TEXT NOT NULL,
          comment TEXT,
          metadata_json TEXT,
          FOREIGN KEY (run_id) REFERENCES run_history(run_id),
          UNIQUE(version_id)
        );
      `);
      
      this.logger.log('Database schema created successfully');
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      const errorStack = this.getErrorStack(error);
      this.logger.error(`Error creating database schema: ${errorMessage}`, errorStack);
      throw error;
    }
  }
} 