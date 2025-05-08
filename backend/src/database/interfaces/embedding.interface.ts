/**
 * Interface para serviço de embeddings
 * Responsável por transformar texto em representações vetoriais
 */

/**
 * Modelo de embedding suportado
 */
export enum EmbeddingModel {
  /** OpenAI Ada 002 embedding model */
  ADA_002 = 'text-embedding-ada-002',
  /** OpenAI 3 small embedding model */
  EMBED_3_SMALL = 'text-embedding-3-small',
  /** OpenAI 3 large embedding model */
  EMBED_3_LARGE = 'text-embedding-3-large',
  /** Local model (ONNX) */
  LOCAL = 'local',
  /** Local all-MiniLM-L6-v2 model */
  ALL_MINILM = 'all-MiniLM-L6-v2',
}

/**
 * Configuração do serviço de embeddings
 */
export interface EmbeddingServiceConfig {
  /** Modelo a ser utilizado */
  model: EmbeddingModel;
  /** Dimensão dos embeddings (específico do modelo) */
  dimensions?: number;
  /** Caminho para o modelo local (se aplicável) */
  modelPath?: string;
  /** Truncar texto para o tamanho máximo do modelo */
  truncate?: boolean;
  /** Cache de embeddings */
  cache?: {
    enabled: boolean;
    maxSize?: number;
    ttl?: number;
  };
}

/**
 * Resultado de uma operação de embedding
 */
export interface EmbeddingResult {
  /** Embedding vetorial */
  embedding: number[];
  /** Dimensão do embedding */
  dimensions: number;
  /** Modelo utilizado */
  model: string;
  /** Tokens processados */
  tokens?: number;
  /** Tempo de processamento em ms */
  elapsedMs?: number;
  /** Indica se veio do cache */
  fromCache?: boolean;
}

/**
 * Interface para o serviço de embeddings
 */
export interface EmbeddingServiceInterface {
  /**
   * Inicializa o serviço de embeddings
   * @param config Configuração do serviço
   */
  initialize(config?: EmbeddingServiceConfig): Promise<void>;

  /**
   * Verifica se o serviço está disponível
   * @returns Promise<boolean> indicando disponibilidade
   */
  isAvailable(): Promise<boolean>;

  /**
   * Gera embedding para um texto
   * @param text Texto para gerar embedding
   * @returns Resultado com o embedding
   */
  embedText(text: string): Promise<EmbeddingResult>;

  /**
   * Gera embeddings para múltiplos textos em paralelo
   * @param texts Array de textos para gerar embeddings
   * @returns Array de resultados com embeddings
   */
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;

  /**
   * Calcula a similaridade de cosseno entre dois embeddings
   * @param embedding1 Primeiro embedding
   * @param embedding2 Segundo embedding
   * @returns Valor de similaridade entre 0 e 1
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number;

  /**
   * Limpa o cache de embeddings
   */
  clearCache(): void;

  /**
   * Retorna estatísticas do cache
   * @returns Estatísticas do cache
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    size: number;
    maxSize: number;
  };

  /**
   * Obtém informações sobre o modelo atual
   * @returns Informações do modelo
   */
  getModelInfo(): {
    name: string;
    dimensions: number;
    isLocal: boolean;
    maxTokens?: number;
  };
} 