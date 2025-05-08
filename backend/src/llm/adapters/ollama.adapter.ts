import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../../config/config.service';
import { 
  LlmAdapter, 
  LlmResponse, 
  ModelConfig, 
  GenerateOptions, 
  LlmProvider 
} from '../interfaces/llm.interface';

@Injectable()
export class OllamaAdapter implements LlmAdapter {
  readonly provider: LlmProvider = 'ollama';
  private httpClient: AxiosInstance;
  private readonly logger = new Logger(OllamaAdapter.name);

  constructor(private configService: ConfigService) {
    // Criar cliente HTTP com configuração básica
    this.httpClient = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Gera texto usando o API do Ollama
   */
  async generate(
    modelConfig: ModelConfig,
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<LlmResponse> {
    try {
      const baseUrl = this.getBaseUrl(modelConfig);
      const mergedOptions = { ...modelConfig.defaultOptions, ...options };
      
      this.logger.debug(`Gerando texto com modelo ${modelConfig.model}`, {
        provider: this.provider,
        model: modelConfig.model,
      });

      // Mapear opções para o formato de requisição do Ollama
      const requestPayload = {
        model: modelConfig.model,
        prompt,
        system: mergedOptions.systemPrompt || '',
        options: {
          temperature: mergedOptions.temperature,
          top_p: mergedOptions.topP,
          top_k: mergedOptions.topK,
          num_predict: mergedOptions.maxTokens,
          stop: mergedOptions.stop
        } as Record<string, any>
      };

      // Remover opções com valor undefined
      Object.keys(requestPayload.options).forEach((key: string) => {
        if (requestPayload.options[key] === undefined) {
          delete requestPayload.options[key];
        }
      });

      // Realizar requisição para a API do Ollama
      const startTime = Date.now();
      const response = await this.httpClient.post(
        `${baseUrl}/api/generate`,
        requestPayload,
      );
      const endTime = Date.now();

      // A resposta vem no formato { response: string, ... }
      const responseText = response.data.response;
      
      // Estimar o número de tokens (aproximação grosseira) para o uso
      const promptChars = prompt.length;
      const responseChars = responseText.length;
      const promptTokens = Math.ceil(promptChars / 4);
      const completionTokens = Math.ceil(responseChars / 4);

      this.logger.debug(`Resposta gerada em ${endTime - startTime}ms`, {
        model: modelConfig.model,
        elapsedMs: endTime - startTime,
      });

      // Padronizar a resposta
      return {
        text: responseText,
        model: modelConfig.model,
        provider: this.provider,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        finishReason: 'stop',
      };
    } catch (error: any) {
      this.logger.error(
        `Erro ao gerar texto com Ollama (${modelConfig.model}): ${error.message}`,
        error.stack,
      );
      throw new Error(`Falha ao gerar texto com Ollama: ${error.message}`);
    }
  }

  /**
   * Verifica se o Ollama está disponível tentando fazer um ping
   */
  async isAvailable(modelConfig: ModelConfig): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl(modelConfig);
      // Verificar se o serviço está rodando com uma requisição simples
      const response = await this.httpClient.get(`${baseUrl}/api/version`);
      
      this.logger.debug(`Ollama disponível: ${JSON.stringify(response.data)}`);
      return true;
    } catch (error: any) {
      this.logger.warn(`Ollama não está disponível: ${error.message}`);
      return false;
    }
  }

  /**
   * Lista os modelos disponíveis no Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await this.httpClient.get('/api/models');
      
      // Lista de modelos disponíveis
      const { data } = response;
      const models = data.models || [];
      
      return models.map((model: any) => model.name);
    } catch (error: any) {
      this.logger.error(`Erro ao listar modelos do Ollama: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Obtém a URL base do Ollama a partir da configuração
   */
  private getBaseUrl(modelConfig?: ModelConfig): string {
    if (modelConfig?.baseUrlEnvVar) {
      const envValue = this.configService.get(modelConfig.baseUrlEnvVar);
      if (typeof envValue === 'string') {
        return envValue;
      }
    }
    return this.configService.ollamaConfig.baseUrl;
  }

  getApiKey(): string {
    const envValue = this.configService.get('OLLAMA_API_KEY');
    return typeof envValue === 'string' ? envValue : '';
  }
} 