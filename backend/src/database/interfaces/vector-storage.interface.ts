/**
 * Interfaces para armazenamento vetorial
 */

/**
 * Representa um documento no armazenamento vetorial
 */
export interface VectorDocument {
  /**
   * Identificador único do documento
   */
  id: string;
  
  /**
   * Embedding do documento
   */
  embedding: number[];
  
  /**
   * Texto do documento (opcional)
   */
  text?: string;
  
  /**
   * Conteúdo do documento (compatibilidade com código existente)
   * @deprecated Use text em vez disso
   */
  content?: string;
  
  /**
   * Metadados adicionais (opcional)
   */
  metadata?: Record<string, any>;
}

/**
 * Resultado de busca por similaridade
 */
export interface SimilaritySearchResult {
  /**
   * Identificador do documento
   */
  id: string;
  
  /**
   * Pontuação de similaridade (geralmente entre 0 e 1)
   */
  score: number;
  
  /**
   * Texto do documento (se disponível)
   */
  text?: string;
  
  /**
   * Conteúdo do documento (compatibilidade com código existente)
   * @deprecated Use text em vez disso
   */
  content?: string;
  
  /**
   * Metadados adicionais (se disponíveis)
   */
  metadata?: Record<string, any>;
}

/**
 * Parâmetros para busca por similaridade
 */
export interface SimilaritySearchParams {
  /**
   * Embedding de consulta
   */
  embedding: number[];
  
  /**
   * Limite máximo de resultados
   */
  limit?: number;
  
  /**
   * Pontuação mínima de similaridade (entre 0 e 1)
   */
  threshold?: number;
  
  /**
   * Filtros adicionais para a busca
   */
  filter?: Record<string, any>;
}

// Alias para compatibilidade com código existente
export type SearchOptions = SimilaritySearchParams;

/**
 * Interface para armazenamento vetorial
 */
export interface VectorStorage {
  /**
   * Adiciona um documento ao armazenamento
   */
  addDocument(document: VectorDocument): Promise<string>;
  
  /**
   * Busca documentos similares
   */
  search(params: SimilaritySearchParams): Promise<SimilaritySearchResult[]>;
  
  /**
   * Remove um documento do armazenamento
   */
  deleteDocument(id: string): Promise<boolean>;
  
  /**
   * Atualiza um documento existente
   */
  updateDocument(id: string, document: Partial<VectorDocument>): Promise<boolean>;
} 