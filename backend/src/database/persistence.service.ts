import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Logger } from 'nestjs-pino';
import { RelationalDatabaseService } from './relational-database.service';
import { DatabaseService } from './database.service';
import {
  RunHistoryRecord,
  AgentLogRecord,
  CodeVersionRecord,
  RunHistoryFilter,
  AgentLogFilter,
  CodeVersionFilter,
  RunStatus,
  AgentLogStatus,
  CodeVersionStatus,
  ExportedRun
} from './interfaces/relational-database.interface';

/**
 * Serviço de fachada unificada para operações de persistência no VibeForge
 * Integra o banco relacional SQLite e armazenamento vetorial ChromaDB
 */
@Injectable()
export class PersistenceService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly relationalDb: RelationalDatabaseService,
    private readonly vectorDb: DatabaseService,
    private readonly logger: Logger,
  ) {
    // Verificar se o logger tem o método setContext
    if ('setContext' in this.logger) {
      (this.logger as any).setContext('PersistenceService');
    }
  }

  async onModuleInit() {
    this.logger.log('Serviço de persistência inicializado');
  }

  //-----------------------------------------------------
  // Métodos para Histórico de Execuções
  //-----------------------------------------------------

  /**
   * Inicia um novo registro de execução
   */
  async startRun(requirement: string, metadata: Record<string, any> = {}): Promise<string> {
    const timestamp = new Date().toISOString();
    const runRecord: RunHistoryRecord = {
      run_id: `run_${Date.now()}`,
      timestamp,
      requirement,
      status: RunStatus.PENDING,
      metadata_json: metadata ? JSON.stringify(metadata) : undefined
    };

    return this.relationalDb.saveRunHistory(runRecord);
  }

  /**
   * Atualiza o status de uma execução
   */
  async updateRunStatus(runId: string, status: RunStatus): Promise<void> {
    return this.relationalDb.updateRunStatus(runId, status);
  }

  /**
   * Finaliza uma execução com sucesso
   */
  async completeRun(runId: string, results: {
    userStory?: any,
    codeFiles?: any,
    testResults?: any,
    metadata?: any
  } = {}): Promise<void> {
    // Apenas atualiza o status para COMPLETED
    return this.relationalDb.updateRunStatus(runId, RunStatus.COMPLETED);
  }

  /**
   * Marca uma execução como falha
   */
  async failRun(runId: string, errorDetails: any = {}): Promise<void> {
    // Apenas atualiza o status para FAILED
    return this.relationalDb.updateRunStatus(runId, RunStatus.FAILED);
  }

  /**
   * Busca histórico de execuções
   */
  async getRunHistory(filters: RunHistoryFilter = {}): Promise<RunHistoryRecord[]> {
    return this.relationalDb.findRunHistory(filters);
  }

  /**
   * Obtém uma execução específica
   */
  async getRun(runId: string): Promise<RunHistoryRecord> {
    const runs = await this.relationalDb.findRunHistory({ run_id: runId });
    return runs[0];
  }

  //-----------------------------------------------------
  // Métodos para Logs de Agentes
  //-----------------------------------------------------

  /**
   * Registra uma ação de agente
   */
  async logAgentAction(
    runId: string,
    agentType: string,
    input: any,
    output: any,
    durationMs: number,
    success = true,
    metadata: Record<string, any> = {}
  ): Promise<number> {
    const timestamp = new Date().toISOString();
    
    const logRecord: AgentLogRecord = {
      run_id: runId,
      agent_type: agentType,
      timestamp,
      input_json: typeof input === 'string' ? input : JSON.stringify(input),
      output_json: typeof output === 'string' ? output : JSON.stringify(output),
      duration_ms: durationMs,
      status: success ? AgentLogStatus.SUCCESS : AgentLogStatus.ERROR,
      metadata_json: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined
    };

    return this.relationalDb.saveAgentLog(logRecord);
  }

  /**
   * Obtém logs de um agente específico
   */
  async getAgentLogs(runId: string, agentType?: string): Promise<AgentLogRecord[]> {
    const filter: AgentLogFilter = { run_id: runId };
    if (agentType) {
      filter.agent_type = agentType;
    }
    return this.relationalDb.getAgentLogs(filter);
  }

  /**
   * Busca logs de agentes
   */
  async searchAgentLogs(filters: AgentLogFilter = {}): Promise<AgentLogRecord[]> {
    return this.relationalDb.getAgentLogs(filters);
  }

  //-----------------------------------------------------
  // Métodos para Versões de Código
  //-----------------------------------------------------

  /**
   * Salva uma versão de código
   */
  async saveCodeVersion(
    runId: string,
    filePath: string,
    content: string,
    status: CodeVersionStatus = CodeVersionStatus.DRAFT,
    options: {
      diffFromPrevious?: string,
      comment?: string,
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    
    const versionRecord: CodeVersionRecord = {
      run_id: runId,
      version_id: `ver_${Date.now()}_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      timestamp,
      file_path: filePath,
      content,
      status,
      diff_from_previous: options.diffFromPrevious,
      comment: options.comment,
      metadata_json: options.metadata ? JSON.stringify(options.metadata) : undefined
    };

    return this.relationalDb.saveCodeVersion(versionRecord);
  }

  /**
   * Atualiza o status de uma versão de código
   */
  async updateCodeVersionStatus(versionId: string, status: CodeVersionStatus): Promise<void> {
    return this.relationalDb.updateCodeVersionStatus(versionId, status);
  }

  /**
   * Busca versões de código de uma execução
   */
  async getCodeVersions(runId: string, filePath?: string): Promise<CodeVersionRecord[]> {
    const filter: CodeVersionFilter = { run_id: runId };
    if (filePath) {
      filter.file_path = filePath;
    }
    return this.relationalDb.getCodeVersions(filter);
  }

  /**
   * Busca a versão mais recente de um arquivo
   */
  async getLatestCodeVersion(filePath: string): Promise<CodeVersionRecord | null> {
    const versions = await this.relationalDb.getCodeVersions({ file_path: filePath });
    if (versions.length === 0) {
      return null;
    }
    // As versões já vêm ordenadas por timestamp DESC
    return versions[0];
  }

  /**
   * Busca por versões de código
   */
  async searchCodeVersions(filters: CodeVersionFilter = {}): Promise<CodeVersionRecord[]> {
    return this.relationalDb.getCodeVersions(filters);
  }

  //-----------------------------------------------------
  // Métodos para Exportação/Importação
  //-----------------------------------------------------

  /**
   * Exporta todos os dados de uma execução para JSON
   */
  async exportRunToJson(runId: string): Promise<ExportedRun> {
    return this.relationalDb.exportRunToJson(runId);
  }

  /**
   * Importa todos os dados de uma execução a partir de JSON
   */
  async importRunFromJson(data: ExportedRun): Promise<string> {
    return this.relationalDb.importRunFromJson(data);
  }
} 