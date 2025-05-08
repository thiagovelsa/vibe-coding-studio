/**
 * Interface para o sistema de carregamento de prompts
 */
export interface PromptLoader {
  /**
   * Carrega um template de prompt a partir de um arquivo
   * @param promptName Nome do arquivo de prompt (sem a extensão)
   * @returns Template de prompt carregado
   */
  loadPromptTemplate(promptName: string): Promise<string>;
  
  /**
   * Processa um template de prompt substituindo as variáveis
   * @param template Template de prompt com variáveis no formato {{variableName}}
   * @param variables Objeto com os valores das variáveis a serem substituídas
   * @returns Prompt com as variáveis substituídas
   */
  processTemplate(template: string, variables: Record<string, any>): string;
  
  /**
   * Carrega e processa um template de prompt em uma única operação
   * @param promptName Nome do arquivo de prompt
   * @param variables Variáveis para substituição
   * @returns Prompt final processado
   */
  getPrompt(promptName: string, variables: Record<string, any>): Promise<string>;
} 