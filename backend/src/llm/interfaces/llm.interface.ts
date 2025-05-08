/**
 * Tipos de provedores LLM suportados
 */
export type LlmProvider = 'openai' | 'anthropic' | 'ollama' | 'azure-openai' | 'local';

/**
 * Razões para término da geração
 */
export type FinishReason = 'stop' | 'length' | 'content_filter' | 'error';

/**
 * Configuração de um modelo de linguagem
 */
export interface ModelConfig {
  /** Provedor (openai, anthropic, etc) */
  provider: LlmProvider;
  
  /** Nome do modelo específico (gpt-4, claude-2, etc) */
  model: string;
  
  /** Nome da variável de ambiente que contém a API key (opcional) */
  apiKeyEnvVar: string | null;
  
  /** Nome da variável de ambiente que contém a URL base (opcional) */
  baseUrlEnvVar: string | null;
  
  /** Prioridade de seleção (maior = mais prioritário) */
  priority: number;
  
  /** Tamanho da janela de contexto em tokens */
  contextWindow?: number;
  
  /** Opções padrão para o modelo */
  defaultOptions?: Partial<GenerateOptions>;
}

/**
 * Opções para geração de texto com LLM
 */
export interface GenerateOptions {
  /** Temperatura (0-1, menor = mais determinístico) */
  temperature?: number;
  
  /** Número máximo de tokens a gerar */
  maxTokens?: number;
  
  /** Amostragem nucleus (0-1) */
  topP?: number;
  
  /** Amostragem top-k */
  topK?: number;
  
  /** Penalidade de frequência */
  frequencyPenalty?: number;
  
  /** Penalidade de presença */
  presencePenalty?: number;
  
  /** Sequências para parar a geração */
  stop?: string[];
  
  /** Mensagem de system prompt */
  systemPrompt?: string;
}

/**
 * Configuração de requisição para geração de texto
 */
export interface GenerateRequest {
  /** Prompt principal para o LLM */
  prompt: string;
  
  /** Opções de geração */
  options?: GenerateOptions;
  
  /** ID do modelo específico a ser usado */
  modelId?: string;
}

/**
 * Resposta gerada por um LLM
 */
export interface LlmResponse {
  /** Texto gerado */
  text: string;
  
  /** Nome do modelo usado */
  model: string;
  
  /** Provedor do modelo */
  provider: LlmProvider;
  
  /** Informações de uso de tokens */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  /** Razão de término da geração */
  finishReason?: FinishReason;
}

/**
 * Interface para adapters de LLM
 */
export interface LlmAdapter {
  /** Identificador do provedor */
  readonly provider: LlmProvider;
  
  /** 
   * Gera texto com o modelo
   * @param modelConfig Configuração do modelo
   * @param prompt Prompt de entrada
   * @param options Opções de geração
   */
  generate(
    modelConfig: ModelConfig,
    prompt: string,
    options?: GenerateOptions,
  ): Promise<LlmResponse>;
  
  /**
   * Verifica disponibilidade do modelo
   * @param modelConfig Configuração do modelo
   */
  isAvailable(modelConfig: ModelConfig): Promise<boolean>;

  /**
   * Lista os modelos disponíveis para este provedor
   */
  listModels?(): Promise<string[]>;
} 