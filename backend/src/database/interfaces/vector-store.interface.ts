/**
 * Interface para armazenamento vetorial
 * Camada de abstração para diferentes implementações de bancos de dados vetoriais
 */

/**
 * Metadados de um documento vetorial
 */
export interface VectorMetadata {
  /** Identificador do documento (opcional) */
  id?: string;
  /** Tipo de documento */
  type?: string;
  /** Propriedades adicionais (específicas da aplicação) */
  [key: string]: any;
}

/**
 * Interface para o serviço de armazenamento vetorial
 * Responsável por gerenciar e consultar embeddings
 */

import { EmbeddingResult } from './embedding.interface';
import { SimilaritySearchResult } from './vector-storage.interface';

/**
 * Documento vetorial
 */
export interface VectorDocument {
  /** Identificador único do documento */
  id: string;
  /** Conteúdo textual do documento */
  content: string;
  /** Embedding do documento (vetor de representação numérica) */
  embedding?: number[];
  /** Metadados associados ao documento */
  metadata?: Record<string, any>;
  /** Timestamp de criação */
  createdAt?: Date;
  /** Timestamp da última atualização */
  updatedAt?: Date;
}

/**
 * Coleção de documentos vetoriais 
 */
export interface VectorCollection {
  /** Nome da coleção */
  name: string;
  /** Descrição da coleção */
  description?: string;
  /** Dimensionalidade dos embeddings */
  dimension?: number;
  /** Número de documentos na coleção */
  documentCount?: number;
  /** Timestamp de criação */
  createdAt?: Date;
  /** Timestamp da última atualização */
  updatedAt?: Date;
  /** Metadados da coleção */
  metadata?: Record<string, any>;
}

/**
 * Opções de busca vetorial
 */
export interface VectorSearchOptions {
  /** Número máximo de resultados */
  limit?: number;
  /** Offset para paginação */
  offset?: number;
  /** Score mínimo (0-1) para inclusão */
  minScore?: number;
  /** Filtros por metadados */
  filters?: Record<string, any>;
  /** Incluir embeddings nos resultados */
  includeEmbeddings?: boolean;
  /** Incluir metadados nos resultados */
  includeMetadata?: boolean;
  /** Incluir conteúdo nos resultados */
  includeContent?: boolean;
  /** Opções específicas do motor de busca */
  engineOptions?: Record<string, any>;
}

/**
 * Resultado de busca vetorial
 */
export interface VectorSearchResult {
  /** Documentos encontrados com score */
  documents: (VectorDocument & { score: number })[];
  /** Contagem total */
  totalCount: number;
  /** Tempo de execução em ms */
  elapsedMs?: number;
}

/**
 * Estatísticas do armazenamento vetorial
 */
export interface VectorStoreStats {
  /** Total de coleções */
  totalCollections: number;
  /** Total de documentos */
  totalDocuments: number;
  /** Tamanho estimado em bytes */
  estimatedSize?: number;
  /** Estatísticas por coleção */
  collectionStats?: Record<string, {
    documentCount: number;
    dimension: number;
    size?: number;
  }>;
}

/**
 * Interface para o serviço de armazenamento vetorial
 */
export interface VectorStoreServiceInterface {
  /**
   * Inicializa o serviço de armazenamento vetorial
   * @param config Configuração opcional
   */
  initialize(config?: Record<string, any>): Promise<void>;

  /**
   * Verifica se o serviço está disponível/conectado
   * @returns Promise<boolean> indicando disponibilidade
   */
  isAvailable(): Promise<boolean>;

  /**
   * Lista todas as coleções disponíveis
   * @returns Lista de coleções
   */
  listCollections(): Promise<VectorCollection[]>;

  /**
   * Cria uma nova coleção
   * @param collection Dados da coleção
   * @returns Coleção criada
   */
  createCollection(collection: VectorCollection): Promise<VectorCollection>;

  /**
   * Obtém uma coleção pelo nome
   * @param name Nome da coleção
   * @returns Coleção encontrada ou null
   */
  getCollection(name: string): Promise<VectorCollection | null>;

  /**
   * Atualiza uma coleção existente
   * @param name Nome da coleção
   * @param updates Atualizações a aplicar
   * @returns Coleção atualizada
   */
  updateCollection(name: string, updates: Partial<VectorCollection>): Promise<VectorCollection>;

  /**
   * Remove uma coleção
   * @param name Nome da coleção
   * @returns true se removida com sucesso
   */
  deleteCollection(name: string): Promise<boolean>;

  /**
   * Adiciona um documento a uma coleção
   * @param collectionName Nome da coleção
   * @param document Documento a adicionar
   * @returns Documento adicionado (com ID se não fornecido)
   */
  addDocument(collectionName: string, document: VectorDocument): Promise<VectorDocument>;

  /**
   * Adiciona múltiplos documentos a uma coleção
   * @param collectionName Nome da coleção
   * @param documents Documentos a adicionar
   * @returns Documentos adicionados (com IDs se não fornecidos)
   */
  addDocuments(collectionName: string, documents: VectorDocument[]): Promise<VectorDocument[]>;

  /**
   * Obtém um documento por ID
   * @param collectionName Nome da coleção
   * @param id ID do documento
   * @returns Documento encontrado ou null
   */
  getDocument(collectionName: string, id: string): Promise<VectorDocument | null>;

  /**
   * Atualiza um documento existente
   * @param collectionName Nome da coleção
   * @param id ID do documento
   * @param updates Atualizações a aplicar
   * @returns Documento atualizado
   */
  updateDocument(
    collectionName: string,
    id: string,
    updates: Partial<VectorDocument>
  ): Promise<VectorDocument>;

  /**
   * Remove um documento
   * @param collectionName Nome da coleção
   * @param id ID do documento
   * @returns true se removido com sucesso
   */
  deleteDocument(collectionName: string, id: string): Promise<boolean>;

  /**
   * Remove múltiplos documentos
   * @param collectionName Nome da coleção
   * @param ids IDs dos documentos
   * @returns Número de documentos removidos
   */
  deleteDocuments(collectionName: string, ids: string[]): Promise<number>;

  /**
   * Busca documentos por vetor de similaridade
   * @param collectionName Nome da coleção
   * @param embedding Vetor para busca de similaridade
   * @param options Opções de busca
   * @returns Resultados da busca
   */
  search(
    collectionName: string,
    embedding: number[],
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult>;

  /**
   * Busca documentos por texto (realiza embedding do texto internamente)
   * @param collectionName Nome da coleção
   * @param text Texto para busca
   * @param options Opções de busca
   * @returns Resultados da busca
   */
  searchByText(
    collectionName: string,
    text: string,
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult>;

  /**
   * Gera o embedding para um texto
   * @param text Texto para gerar embedding
   * @returns Vetor de embedding
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Gera embeddings para múltiplos textos
   * @param texts Textos para gerar embeddings
   * @returns Vetores de embedding
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Consulta estatísticas do armazenamento
   * @returns Estatísticas atualizadas
   */
  getStats(): Promise<VectorStoreStats>;

  /**
   * Realiza backup do armazenamento
   * @param options Opções de backup
   * @returns Informações do backup realizado
   */
  backup(options?: {
    path?: string;
    collections?: string[];
    includeEmbeddings?: boolean;
  }): Promise<{
    path: string;
    timestamp: Date;
    collections: string[];
    documentCount: number;
    size: number;
  }>;

  /**
   * Restaura um backup
   * @param backupPath Caminho do backup
   * @param options Opções de restauração
   * @returns Informações da restauração
   */
  restore(
    backupPath: string,
    options?: {
      collections?: string[];
      overwrite?: boolean;
    }
  ): Promise<{
    collections: string[];
    documentCount: number;
    success: boolean;
    errors?: string[];
  }>;
}

/**
 * Interface para adapter de armazenamento vetorial
 */
export interface VectorStoreAdapter {
  /**
   * Nome do adapter
   */
  readonly name: string;
  
  /**
   * Inicializa o adapter
   */
  initialize(): Promise<void>;
  
  /**
   * Verifica se o adapter está pronto para uso
   */
  isReady(): Promise<boolean>;
  
  /**
   * Adiciona um documento ao armazenamento vetorial
   * @param id Identificador único do documento
   * @param embedding Embedding do documento
   * @param text Texto do documento
   * @param metadata Metadados opcionais
   */
  addDocument(id: string, embedding: number[], text: string, metadata?: Record<string, any>): Promise<void>;
  
  /**
   * Busca documentos similares por embedding
   * @param embedding Embedding de consulta
   * @param limit Limite de resultados
   * @param threshold Limiar de similaridade
   * @param filter Filtro opcional
   */
  similaritySearch(
    embedding: number[], 
    limit?: number,
    threshold?: number,
    filter?: Record<string, any>
  ): Promise<SimilaritySearchResult[]>;
  
  /**
   * Remove um documento do armazenamento
   * @param id Identificador do documento
   */
  deleteDocument(id: string): Promise<void>;
  
  /**
   * Lista as coleções disponíveis
   */
  listCollections(): Promise<string[]>;
  
  /**
   * Verifica a saúde do armazenamento
   */
  healthCheck(): Promise<boolean>;
} 