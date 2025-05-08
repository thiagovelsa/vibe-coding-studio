import { Injectable } from '@nestjs/common';
import { LoggerService } from '@logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Serviço responsável por carregar templates de prompt do disco
 * e aplicar variáveis para substituição
 */
@Injectable()
export class PromptLoaderService {
  private promptsBasePath: string;
  private promptCache: Map<string, string> = new Map();

  constructor(private logger: LoggerService) {
    // Configuração do caminho base dos prompts
    this.promptsBasePath = process.env.PROMPTS_PATH || path.join(process.cwd(), 'prompts');
    this.logger.log(`Caminho base para prompts: ${this.promptsBasePath}`);
  }

  /**
   * Carrega um template de prompt do disco
   * @param agentType Tipo do agente (product, coder, test, security)
   * @param promptName Nome do prompt
   * @returns Template de prompt ou null se não encontrado
   */
  async loadPrompt(agentType: string, promptName: string): Promise<string | null> {
    // Cria uma chave única para o cache
    const cacheKey = `${agentType}:${promptName}`;
    
    // Verifica se o prompt já está em cache
    if (this.promptCache.has(cacheKey)) {
      return this.promptCache.get(cacheKey) || null;
    }
    
    try {
      // Constrói o caminho do arquivo
      const promptPath = path.join(
        this.promptsBasePath, 
        agentType, 
        `${promptName}.md`
      );
      
      // Verifica se o arquivo existe
      if (!fs.existsSync(promptPath)) {
        // Tenta encontrar um arquivo com extensão alternativa
        const alternativePath = path.join(
          this.promptsBasePath, 
          agentType, 
          `${promptName}.txt`
        );
        
        if (!fs.existsSync(alternativePath)) {
          this.logger.warn(`Prompt não encontrado: ${promptPath} ou ${alternativePath}`);
          return null;
        }
        
        // Usa o caminho alternativo
        const content = fs.readFileSync(alternativePath, 'utf-8');
        this.promptCache.set(cacheKey, content);
        return content;
      }
      
      // Lê o conteúdo do arquivo
      const content = fs.readFileSync(promptPath, 'utf-8');
      
      // Armazena em cache
      this.promptCache.set(cacheKey, content);
      
      return content;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao carregar prompt ${agentType}/${promptName}: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Aplica variáveis a um template de prompt
   * @param template Template de prompt
   * @param variables Variáveis para substituição
   * @returns Prompt com variáveis aplicadas
   */
  applyVariables(template: string, variables: Record<string, any>): string {
    if (!template || !variables) {
      return template;
    }
    
    let result = template;
    
    // Substitui todas as variáveis no formato {{nome_variavel}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  /**
   * Carrega, pre-processa e aplica variáveis a um template de prompt
   * @param agentType Tipo do agente
   * @param promptName Nome do prompt
   * @param variables Variáveis para substituição
   * @returns Prompt processado ou null se não encontrado
   */
  async loadAndProcessPrompt(agentType: string, promptName: string, variables: Record<string, any>): Promise<string | null> {
    const template = await this.loadPrompt(agentType, promptName);
    
    if (!template) {
      return null;
    }
    
    return this.applyVariables(template, variables);
  }

  /**
   * Carrega um prompt e aplica variáveis em uma única operação
   * @param promptName Nome do prompt (ou tipo do agente)
   * @param variables Variáveis para substituição
   * @returns Prompt processado ou erro se não encontrado
   */
  async getPrompt(
    promptName: string,
    variables: Record<string, any> = {}
  ): Promise<string> {
    // Identifica se o promptName contém o tipo de agente ou é apenas o nome
    let agentType: string;
    let actualPromptName: string;
    
    if (promptName.includes('_')) {
      // Formato: 'agent_prompt'
      const parts = promptName.split('_');
      agentType = parts[0];
      actualPromptName = parts.slice(1).join('_');
    } else {
      // Apenas o nome do agente, usar 'main' como prompt padrão
      agentType = promptName;
      actualPromptName = 'main';
    }
    
    // Tenta carregar o prompt
    const template = await this.loadPrompt(agentType, actualPromptName);
    
    if (!template) {
      this.logger.warn(`Prompt não encontrado: ${agentType}/${actualPromptName}`);
      throw new Error(`Prompt não encontrado: ${agentType}/${actualPromptName}`);
    }
    
    // Aplica as variáveis
    return this.applyVariables(template, variables);
  }

  /**
   * Limpa o cache de prompts
   */
  clearCache(): void {
    this.promptCache.clear();
    this.logger.log('Cache de prompts limpo');
  }
} 