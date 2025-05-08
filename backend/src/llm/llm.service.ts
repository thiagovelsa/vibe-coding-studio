import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as fs from 'fs';
import * as path from 'path';
import { 
  LlmAdapter, 
  LlmResponse, 
  ModelConfig, 
  GenerateOptions,
  GenerateRequest,
  LlmProvider
} from './interfaces/llm.interface';
import { LoggerService } from '../logger/logger.service';
import { OpenAiAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { OllamaAdapter } from './adapters/ollama.adapter';

@Injectable()
export class LlmService implements OnModuleInit {
  private models: ModelConfig[] = [];
  private adapters: Map<LlmProvider, LlmAdapter> = new Map();
  private availableModels: Map<string, ModelConfig> = new Map();
  private llmAdapters: LlmAdapter[] = [];
  
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly openAiAdapter: OpenAiAdapter,
    private readonly anthropicAdapter: AnthropicAdapter,
    private readonly ollamaAdapter: OllamaAdapter,
  ) {
    this.llmAdapters = [
        this.openAiAdapter,
        this.anthropicAdapter,
        this.ollamaAdapter,
    ];
    
    try {
      this.loadModels();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Falha ao carregar configurações dos modelos: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Inicializa o serviço carregando configurações e adaptadores
   */
  async onModuleInit() {
    this.initializeAdapters();
    await this.loadModels();
    await this.discoverAvailableModels(); 
  }

  /**
   * Verifica se o serviço LLM está disponível
   * @returns true se pelo menos um modelo estiver disponível
   */
  async isAvailable(): Promise<boolean> {
    return this.availableModels.size > 0;
  }

  /**
   * Inicializa os adaptadores para diferentes provedores
   */
  private initializeAdapters() {
    for (const adapter of this.llmAdapters) {
      this.adapters.set(adapter.provider, adapter);
      this.logger.log(`Adaptador registrado para provedor: ${adapter.provider}`);
    }
  }

  /**
   * Carrega configurações de modelos do arquivo
   */
  private async loadModels() {
    try {
      const configPath = path.join(__dirname, '..', '..', '..', 'config', 'models.json');
      this.logger.debug(`Tentando carregar configuração de modelos de: ${configPath}`);
      
      if (!fs.existsSync(configPath)) {
        this.logger.warn(`Arquivo de configuração não encontrado: ${configPath}`);
        this.setDefaultModels();
        return;
      }
      
      const configData = await fs.promises.readFile(configPath, 'utf-8');
      this.models = JSON.parse(configData);
      this.logger.log(`Carregados ${this.models.length} modelos de configuração`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Falha ao carregar configurações dos modelos: ${errorMessage}`, errorStack);
      this.setDefaultModels();
    }
  }

  /**
   * Define modelos padrão em caso de falha ao carregar do arquivo
   */
  private setDefaultModels() {
    this.logger.log('Utilizando configuração de modelos padrão');
    this.models = [
      {
        provider: 'ollama',
        model: 'llama3',
        apiKeyEnvVar: null,
        baseUrlEnvVar: 'OLLAMA_BASE_URL',
        priority: 1,
        contextWindow: 8192,
        defaultOptions: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
        },
      },
    ];
  }

  /**
   * Descobre quais modelos estão disponíveis
   */
  private async discoverAvailableModels() {
    this.availableModels.clear();
    
    // Verificar cada modelo configurado
    for (const modelConfig of this.models) {
      const adapter = this.adapters.get(modelConfig.provider);
      if (!adapter) {
        this.logger.warn(`Adaptador não encontrado para o provedor: ${modelConfig.provider}`);
        continue;
      }

      try {
        const isAvailable = await adapter.isAvailable(modelConfig);
        if (isAvailable) {
          const modelId = `${modelConfig.provider}:${modelConfig.model}`;
          this.availableModels.set(modelId, modelConfig);
          this.logger.log(`Modelo disponível: ${modelId}`);
        } else {
          this.logger.warn(`Modelo não disponível: ${modelConfig.provider}:${modelConfig.model}`);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Erro ao verificar disponibilidade do modelo ${modelConfig.provider}:${modelConfig.model}: ${errorMessage}`,
          errorStack
        );
      }
    }

    this.logger.log(`Total de modelos disponíveis: ${this.availableModels.size}`);
  }

  /**
   * Gera texto usando o modelo especificado ou o melhor disponível
   * @param promptOrRequest Prompt de texto ou objeto de requisição
   * @param options Opções de geração (ignorado se promptOrRequest for um objeto)
   */
  async generate(
    promptOrRequest: string | GenerateRequest,
    options: GenerateOptions = {}
  ): Promise<LlmResponse> {
    // Extrai prompt e opções da entrada
    let prompt: string;
    let reqOptions: GenerateOptions;
    let modelId: string | undefined;
    
    if (typeof promptOrRequest === 'string') {
      prompt = promptOrRequest;
      reqOptions = options;
      modelId = undefined;
    } else {
      prompt = promptOrRequest.prompt;
      reqOptions = promptOrRequest.options || {};
      modelId = promptOrRequest.modelId;
    }
    
    // Se um modelo específico for solicitado, tenta usar apenas ele
    if (modelId) {
      const modelConfig = this.findModelByName(modelId);
      
      if (!modelConfig) {
        throw new Error(`Modelo '${modelId}' não encontrado`);
      }
      
      return this.generateWithModel(modelConfig, prompt, reqOptions);
    }
    
    // Caso contrário, tenta gerar com modelos por ordem de prioridade
    let lastError: Error | null = null;
    
    // Convertemos o Map para um array e ordenamos por prioridade
    const modelConfigs = Array.from(this.availableModels.values())
      .sort((a, b) => b.priority - a.priority);
    
    for (const modelConfig of modelConfigs) {
      try {
        return await this.generateWithModel(modelConfig, prompt, reqOptions);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Falha ao gerar com modelo ${modelConfig.provider}:${modelConfig.model}: ${errorMessage}`
        );
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Continua tentando o próximo modelo
      }
    }
    
    if (lastError) {
      this.logger.error(
        `Erro ao gerar texto com todos os modelos disponíveis: Último erro: ${lastError.message}`,
        lastError.stack
      );
      throw lastError;
    }
    
    throw new Error('Nenhum modelo de linguagem disponível');
  }

  /**
   * Gera texto com um modelo específico
   */
  private async generateWithModel(
    modelConfig: ModelConfig,
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<LlmResponse> {
    const adapter = this.adapters.get(modelConfig.provider);
    if (!adapter) {
      throw new Error(`Adaptador não encontrado para o provedor ${modelConfig.provider}`);
    }

    this.logger.log(`Gerando texto com o modelo ${modelConfig.provider}:${modelConfig.model}`);
    
    try {
      const result = await adapter.generate(modelConfig, prompt, options);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erro ao gerar texto com ${modelConfig.provider}:${modelConfig.model}: ${errorMessage}`,
        errorStack
      );
      throw error;
    }
  }

  /**
   * Retorna a lista de modelos disponíveis
   */
  getAvailableModels(): { id: string; provider: string; model: string; priority: number }[] {
    return Array.from(this.availableModels.entries()).map(([id, config]) => ({
      id,
      provider: config.provider,
      model: config.model,
      priority: config.priority,
    }));
  }

  /**
   * Gera embeddings para o texto fornecido
   * @param text Texto para o qual gerar embeddings
   * @returns Vetor de embeddings
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Implementação simplificada - pode ser expandida conforme necessário
    try {
      // Verificar se há modelos disponíveis
      if (this.availableModels.size === 0) {
        throw new Error('Nenhum modelo disponível para gerar embeddings');
      }
      
      // Pegar o primeiro modelo disponível
      const firstModelEntry = this.availableModels.entries().next().value;
      if (!firstModelEntry) {
        throw new Error('Falha ao obter modelo disponível');
      }
      
      const [_, modelConfig] = firstModelEntry;
      
      const adapter = this.getAdapterForProvider(modelConfig.provider);
      
      if (!adapter || typeof (adapter as any).generateEmbedding !== 'function') {
        throw new Error('Adapter não suporta geração de embeddings');
      }
      
      return await (adapter as any).generateEmbedding(text, modelConfig);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Erro ao gerar embeddings: ${errorMessage}`, errorStack);
      throw new Error(`Falha ao gerar embeddings: ${errorMessage}`);
    }
  }

  /**
   * Recarrega a configuração de modelos
   */
  async reloadModels(): Promise<number> {
    await this.loadModels();
    await this.discoverAvailableModels();
    return this.availableModels.size;
  }

  private async checkModelAvailability(modelConfig: ModelConfig): Promise<boolean> {
    try {
      const adapter = this.getAdapterForProvider(modelConfig.provider);
      
      if (!adapter) {
        this.logger.warn(`Provedor não suportado: ${modelConfig.provider}`);
        return false;
      }
      
      return await adapter.isAvailable(modelConfig);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
          `Erro ao verificar disponibilidade do modelo ${modelConfig.provider}:${modelConfig.model}: ${errorMessage}`,
          errorStack
      );
      return false;
    }
  }

  private findModelByName(name: string): ModelConfig | undefined {
    return this.models.find(model => `${model.provider}:${model.model}` === name);
  }

  private getAdapterForProvider(provider: LlmProvider): LlmAdapter | undefined {
    return this.adapters.get(provider);
  }
} 