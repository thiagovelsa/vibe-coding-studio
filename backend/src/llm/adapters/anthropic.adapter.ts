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
export class AnthropicAdapter implements LlmAdapter {
  readonly provider: LlmProvider = 'anthropic';
  private httpClient: AxiosInstance;
  private readonly logger = new Logger(AnthropicAdapter.name);

  constructor(private configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      timeout: 120000, // 2 minutos para lidar com modelos mais lentos
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
    });
  }

  /**
   * Gera texto usando a API da Anthropic (Claude)
   */
  async generate(
    modelConfig: ModelConfig,
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<LlmResponse> {
    try {
      // Verificar se a API key está disponível
      const apiKey = this.getApiKey(modelConfig);
      if (!apiKey) {
        throw new Error('API key da Anthropic não encontrada');
      }

      // Configurar os headers com a API key
      const headers = {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };

      const mergedOptions = { ...modelConfig.defaultOptions, ...options };
      
      this.logger.debug(`Gerando texto com modelo ${modelConfig.model}`, {
        provider: this.provider,
        model: modelConfig.model,
      });

      // Preparar a requisição para a API da Anthropic
      const systemPrompt = mergedOptions.systemPrompt || '';
      
      // A API da Anthropic (Claude) espera um formato específico
      const requestPayload = {
        model: modelConfig.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        top_p: mergedOptions.topP,
        stop_sequences: mergedOptions.stop,
      } as Record<string, any>;

      // Remover propriedades undefined
      Object.keys(requestPayload).forEach(key => {
        if (requestPayload[key] === undefined) {
          delete requestPayload[key];
        }
      });

      // Fazer a requisição para a API da Anthropic
      const startTime = Date.now();
      const response = await this.httpClient.post('/messages', requestPayload, { headers });
      const endTime = Date.now();

      const anthropicResponse = response.data;
      const responseText = anthropicResponse.content[0].text;
      const stopReason = anthropicResponse.stop_reason;

      // Calcular tokens utilizados (se disponíveis na resposta)
      const promptTokens = anthropicResponse.usage?.input_tokens || 
        Math.ceil((prompt.length + (systemPrompt?.length || 0)) / 4);
      const completionTokens = anthropicResponse.usage?.output_tokens ||
        Math.ceil(responseText.length / 4);

      this.logger.debug(`Resposta gerada em ${endTime - startTime}ms`, {
        model: modelConfig.model,
        elapsedMs: endTime - startTime,
      });

      // Retornar a resposta padronizada
      return {
        text: responseText,
        model: modelConfig.model,
        provider: this.provider,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        finishReason: this.mapStopReason(stopReason),
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(
        `Erro ao gerar texto com Anthropic (${modelConfig.model}): ${errorMessage}`,
        error.stack,
      );
      throw new Error(`Falha ao gerar texto com Anthropic: ${errorMessage}`);
    }
  }

  /**
   * Verifica se o adaptador está disponível tentando fazer um request simples
   */
  async isAvailable(modelConfig: ModelConfig): Promise<boolean> {
    try {
      const apiKey = this.getApiKey(modelConfig);
      if (!apiKey) {
        this.logger.warn('API key da Anthropic não está configurada');
        return false;
      }

      // A Anthropic não tem um endpoint para verificar status,
      // então vamos apenas checar se a API key parece válida
      return apiKey.length > 20;
    } catch (error: any) {
      this.logger.warn(`Anthropic não está disponível: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtém a API key da Anthropic a partir da configuração
   */
  private getApiKey(modelConfig?: ModelConfig): string {
    // Verificar se a modelConfig tem uma variável de ambiente específica
    if (modelConfig?.apiKeyEnvVar) {
      const apiKey = this.configService.get(modelConfig.apiKeyEnvVar);
      if (typeof apiKey === 'string') {
        return apiKey;
      }
    }
    // Tentar obter de configuração global (não implementado no ConfigService ainda)
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    return typeof apiKey === 'string' ? apiKey : '';
  }

  /**
   * Mapeia os códigos de parada da Anthropic para o formato padronizado
   */
  private mapStopReason(stopReason: string): LlmResponse['finishReason'] {
    switch (stopReason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
} 