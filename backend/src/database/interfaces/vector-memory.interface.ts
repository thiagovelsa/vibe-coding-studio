/**
 * Interface para o serviço de memória vetorial
 * Responsável por armazenar e recuperar dados com base em similaridade vetorial
 */

import { VectorDocument, VectorSearchOptions, VectorSearchResult } from './vector-store.interface';
import { SimilaritySearchResult, SearchOptions, VectorStorage } from './vector-storage.interface';

/**
 * Tipo de memória vetorial
 */
export enum MemoryType {
  CONVERSATION = 'conversation',
  CODE = 'code',
  DOCUMENTATION = 'documentation',
  PROJECT = 'project',
  CUSTOM = 'custom'
}

/**
 * Item de memória a ser armazenado
 */
export interface MemoryItem {
  /** Identificador único do item (opcional, será gerado se não fornecido) */
  id?: string;
  /** Tipo de memória */
  type: MemoryType | string;
  /** Conteúdo textual da memória */
  content: string;
  /** Identificador do projeto associado */
  projectId: string;
  /** Identificador do usuário associado (opcional) */
  userId?: string;
  /** Identificador da sessão (opcional) */
  sessionId?: string;
  /** Timestamp de criação (opcional, será gerado se não fornecido) */
  timestamp?: Date;
  /** Importância/relevância da memória (0-1) */
  importance?: number;
  /** Se este item já foi processado/resumido (para uso interno) */
  processed?: boolean;
  /** Metadados adicionais */
  metadata?: Record<string, any>;
}

/**
 * Resultado da recuperação de memória
 */
export interface MemoryRetrievalResult {
  /** Itens de memória recuperados */
  items: (MemoryItem & { score: number })[];
  /** Total de itens encontrados (pode ser maior que o número de itens retornados) */
  total: number;
  /** Timestamp da recuperação */
  timestamp: Date;
  /** Tokens utilizados na recuperação (se disponível) */
  tokensUsed?: number;
}

/**
 * Opções para recuperação de memória
 */
export interface MemoryRetrievalOptions extends Omit<VectorSearchOptions, 'includeContent'> {
  /** Tipos de memória a incluir */
  includeTypes?: (MemoryType | string)[];
  /** Tipos de memória a excluir */
  excludeTypes?: (MemoryType | string)[];
  /** ID do projeto para filtrar (opcional) */
  projectId?: string;
  /** ID do usuário para filtrar (opcional) */
  userId?: string;
  /** ID da sessão para filtrar (opcional) */
  sessionId?: string;
  /** Intervalo de tempo para filtrar (início) */
  startTime?: Date;
  /** Intervalo de tempo para filtrar (fim) */
  endTime?: Date;
  /** Filtro de importância mínima (0-1) */
  minimumImportance?: number;
  /** Se deve incluir itens processados */
  includeProcessed?: boolean;
  /** Filtros de metadados */
  metadataFilters?: Record<string, any>;
}

/**
 * Resultado do resumo de memórias
 */
export interface MemorySummaryResult {
  /** Texto do resumo */
  summary: string;
  /** Itens de memória incluídos no resumo */
  includedItems: string[];
  /** Timestamp do resumo */
  timestamp: Date;
  /** Tokens utilizados para gerar o resumo */
  tokensUsed?: number;
}

/**
 * Interface para o serviço de memória vetorial
 */
export interface VectorMemoryServiceInterface {
  /**
   * Inicializa o serviço de memória vetorial
   * @returns Promise<void>
   */
  initialize(): Promise<void>;

  /**
   * Verifica se o serviço está disponível
   * @returns Promise<boolean> indicando disponibilidade
   */
  isAvailable(): Promise<boolean>;

  /**
   * Armazena um item na memória vetorial
   * @param item Item a ser armazenado
   * @returns ID do item armazenado
   */
  storeMemory(item: MemoryItem): Promise<string>;

  /**
   * Armazena múltiplos itens na memória vetorial
   * @param items Lista de itens a serem armazenados
   * @returns Lista de IDs dos itens armazenados
   */
  storeMemories(items: MemoryItem[]): Promise<string[]>;

  /**
   * Recupera itens de memória por similaridade com uma consulta
   * @param query Texto de consulta para busca semântica
   * @param options Opções de recuperação
   * @returns Resultados da recuperação
   */
  retrieveMemories(query: string, options?: MemoryRetrievalOptions): Promise<MemoryRetrievalResult>;

  /**
   * Recupera itens de memória por IDs específicos
   * @param ids Lista de IDs a recuperar
   * @param options Opções adicionais
   * @returns Itens de memória correspondentes
   */
  getMemoriesByIds(ids: string[], options?: Partial<MemoryRetrievalOptions>): Promise<MemoryItem[]>;

  /**
   * Atualiza um item de memória existente
   * @param id ID do item a atualizar
   * @param updates Atualizações a aplicar
   * @returns Item atualizado
   */
  updateMemory(id: string, updates: Partial<MemoryItem>): Promise<MemoryItem>;

  /**
   * Remove um item de memória
   * @param id ID do item a remover
   * @returns true se removido com sucesso
   */
  deleteMemory(id: string): Promise<boolean>;

  /**
   * Remove múltiplos itens de memória
   * @param ids IDs dos itens a remover
   * @returns Número de itens removidos
   */
  deleteMemories(ids: string[]): Promise<number>;

  /**
   * Gera um resumo de memórias relacionadas a uma consulta
   * @param query Texto de consulta
   * @param options Opções de recuperação para selecionar memórias
   * @returns Resultado do resumo
   */
  summarizeMemories(query: string, options?: MemoryRetrievalOptions): Promise<MemorySummaryResult>;

  /**
   * Marca memórias como processadas
   * @param ids IDs dos itens a marcar como processados
   * @returns Número de itens atualizados
   */
  markAsProcessed(ids: string[]): Promise<number>;

  /**
   * Conta o número de itens de memória com base em filtros
   * @param filters Filtros para contagem
   * @returns Número de itens que correspondem aos filtros
   */
  countMemories(filters?: Partial<MemoryRetrievalOptions>): Promise<number>;

  /**
   * Remove memórias antigas com base em critérios
   * @param options Opções para exclusão
   * @returns Número de itens removidos
   */
  pruneOldMemories(options: {
    /** Tempo máximo para manter (em dias) */
    maxAgeDays?: number;
    /** Tipos de memória a considerar */
    types?: (MemoryType | string)[];
    /** ID do projeto */
    projectId?: string;
    /** Importância máxima para excluir (itens acima deste valor são preservados) */
    maxImportanceToDelete?: number;
    /** Número máximo de itens a excluir */
    limit?: number;
  }): Promise<number>;
}

/**
 * Opções para resumo de contexto
 */
export interface ContextSummaryOptions {
  /** Prompt personalizado para resumo */
  customPrompt?: string;
  
  /** Número máximo de resultados a considerar */
  maxResults?: number;
  
  /** Coleções específicas a consultar */
  collections?: string[];
  
  /** Metadados para filtragem */
  filter?: Record<string, any>;
}

/**
 * Interface que define as opções de busca para recuperação de memória vetorial
 */
export interface MemorySearchOptions {
  /**
   * Limite de resultados a serem retornados
   */
  limit?: number;
  
  /**
   * Limiar de similaridade (entre 0-1)
   */
  threshold?: number;
  
  /**
   * Filtros adicionais para a busca
   */
  filter?: Record<string, any>;
}

/**
 * Interface para serviço de memória vetorial
 */
export interface VectorMemoryStorage extends VectorStorage {
  /**
   * Armazena um novo item na memória vetorial
   */
  storeMemory(text: string, metadata?: Record<string, any>): Promise<string>;
  
  /**
   * Recupera memórias semanticamente similares ao texto fornecido
   */
  retrieveMemories(text: string, options?: MemorySearchOptions): Promise<SimilaritySearchResult[]>;
  
  /**
   * Limpa a memória vetorial para um determinado namespace ou filtro
   */
  clearMemories(filter?: Record<string, any>): Promise<void>;
} 