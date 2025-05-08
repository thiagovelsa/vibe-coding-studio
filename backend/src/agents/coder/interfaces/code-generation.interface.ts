/**
 * Interface para solicitação de geração de código
 */
export interface CodeGenerationRequest {
  /** Requisitos ou especificações para o código */
  requirements: string;
  
  /** Linguagem de programação */
  language: string;
  
  /** Framework a ser utilizado (opcional) */
  framework?: string;
  
  /** Padrões de arquitetura a serem seguidos (opcional) */
  patterns?: string[];
  
  /** Arquivos específicos a serem gerados (opcional) */
  files?: string[];
  
  /** Código existente para referência ou modificação (opcional) */
  existingCode?: string;
  
  /** Contexto adicional que pode ajudar na geração (opcional) */
  context?: Record<string, any>;
}

/**
 * Interface para o resultado da geração de código
 */
export interface CodeGenerationResult {
  /** Arquivos gerados com nome e conteúdo */
  files: Array<{
    name: string;
    content: string;
    language: string;
  }>;
  
  /** Explicação sobre o código gerado */
  explanation?: string;
  
  /** Sugestões adicionais ou alternativas consideradas */
  suggestions?: string[];
  
  /** Dependências necessárias para o código */
  dependencies?: string[];
  
  /** Instruções para uso ou integração do código */
  instructions?: string;
} 