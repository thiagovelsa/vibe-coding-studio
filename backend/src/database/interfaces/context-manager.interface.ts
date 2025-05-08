/**
 * Interface para o gerenciador de contexto
 * Responsável por gerenciar o contexto histórico e relevante durante interações
 */

/**
 * Tipo de contexto
 */
export enum ContextType {
  /** Contexto de código-fonte */
  CODE = 'code',
  /** Contexto de conversa */
  CONVERSATION = 'conversation',
  /** Contexto de documentação */
  DOCUMENTATION = 'documentation',
  /** Contexto de funcionalidade */
  FEATURE = 'feature',
  /** Contexto de projeto */
  PROJECT = 'project'
}

/**
 * Item de contexto
 */
export interface ContextItem {
  /** Identificador único do item */
  id: string;
  /** Tipo de contexto */
  type: ContextType;
  /** Conteúdo do item */
  content: string;
  /** Relevância do item (0-1) */
  relevance: number;
  /** Origem/fonte do item */
  source: string;
  /** Timestamp de criação */
  timestamp: Date;
  /** Metadados adicionais */
  metadata?: Record<string, any>;
}

/**
 * Sessão de contexto
 */
export interface ContextSession {
  /** Identificador único da sessão */
  id: string;
  /** Identificador do projeto */
  projectId: string;
  /** Lista de itens de contexto ativos */
  items: ContextItem[];
  /** Timestamp de criação */
  createdAt: Date;
  /** Timestamp da última atualização */
  updatedAt: Date;
  /** Metadados adicionais */
  metadata?: Record<string, any>;
}

/**
 * Resumo de contexto
 */
export interface ContextSummary {
  /** Texto resumido */
  summary: string;
  /** Tokens utilizados no resumo */
  tokens: number;
  /** Timestamp de geração */
  timestamp: Date;
  /** Itens de contexto utilizados */
  sourceItems: string[];
}

/**
 * Opções para recuperação de contexto
 */
export interface ContextRetrievalOptions {
  /** Número máximo de itens a recuperar */
  maxItems?: number;
  /** Tipos de contexto a incluir */
  includeTypes?: ContextType[];
  /** Tipos de contexto a excluir */
  excludeTypes?: ContextType[];
  /** Relevância mínima (0-1) */
  minRelevance?: number;
  /** Idade máxima em milissegundos */
  maxAge?: number;
  /** Filtro de metadados */
  where?: Record<string, any>;
}

/**
 * Interface para o gerenciador de contexto
 */
export interface ContextManagerInterface {
  /**
   * Inicializa o gerenciador de contexto
   */
  initialize(): Promise<void>;

  /**
   * Cria uma nova sessão de contexto
   * @param projectId ID do projeto
   * @param metadata Metadados opcionais
   * @returns A sessão criada
   */
  createSession(projectId: string, metadata?: Record<string, any>): Promise<ContextSession>;

  /**
   * Obtém uma sessão pelo ID
   * @param sessionId ID da sessão
   * @returns A sessão encontrada ou null se não existir
   */
  getSession(sessionId: string): Promise<ContextSession | null>;

  /**
   * Adiciona um item de contexto a uma sessão
   * @param sessionId ID da sessão
   * @param item Item a ser adicionado
   * @returns O item adicionado
   */
  addContextItem(sessionId: string, item: Omit<ContextItem, 'id'>): Promise<ContextItem>;

  /**
   * Remove um item de contexto de uma sessão
   * @param sessionId ID da sessão
   * @param itemId ID do item
   */
  removeContextItem(sessionId: string, itemId: string): Promise<void>;

  /**
   * Atualiza a relevância de um item de contexto
   * @param sessionId ID da sessão
   * @param itemId ID do item
   * @param relevance Nova relevância (0-1)
   * @returns O item atualizado
   */
  updateItemRelevance(sessionId: string, itemId: string, relevance: number): Promise<ContextItem>;

  /**
   * Recupera itens de contexto relevantes para um texto
   * @param sessionId ID da sessão
   * @param text Texto de consulta
   * @param options Opções de recuperação
   * @returns Itens de contexto relevantes ordenados por relevância
   */
  retrieveRelevantContext(
    sessionId: string,
    text: string,
    options?: ContextRetrievalOptions
  ): Promise<ContextItem[]>;

  /**
   * Gera um resumo do contexto atual
   * @param sessionId ID da sessão
   * @param maxTokens Número máximo de tokens no resumo
   * @returns Resumo do contexto
   */
  generateContextSummary(sessionId: string, maxTokens?: number): Promise<ContextSummary>;

  /**
   * Registra um segmento de conversa como contexto
   * @param sessionId ID da sessão
   * @param role Papel (user/assistant)
   * @param content Conteúdo do segmento
   * @param metadata Metadados opcionais
   * @returns O item de contexto criado
   */
  registerConversation(
    sessionId: string,
    role: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<ContextItem>;

  /**
   * Registra um arquivo de código como contexto
   * @param sessionId ID da sessão
   * @param filePath Caminho do arquivo
   * @param content Conteúdo do código
   * @param language Linguagem do código
   * @param metadata Metadados opcionais
   * @returns O item de contexto criado
   */
  registerCodeFile(
    sessionId: string,
    filePath: string,
    content: string,
    language: string,
    metadata?: Record<string, any>
  ): Promise<ContextItem>;

  /**
   * Limpa itens de contexto obsoletos ou irrelevantes
   * @param sessionId ID da sessão
   * @param options Opções de limpeza (idade mínima, relevância máxima)
   * @returns Número de itens removidos
   */
  pruneContext(
    sessionId: string, 
    options?: { minAge?: number; maxRelevance?: number }
  ): Promise<number>;
} 