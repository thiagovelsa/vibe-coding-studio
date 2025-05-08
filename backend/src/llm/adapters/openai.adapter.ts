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
export class OpenAiAdapter implements LlmAdapter {
  readonly provider: LlmProvider = 'openai';
  private httpClient: AxiosInstance;
  private readonly logger = new Logger(OpenAiAdapter.name);

  constructor(private configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: 'https://api.openai.com/v1',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Gera texto usando a API da OpenAI
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
        throw new Error('API key da OpenAI não encontrada');
      }

      // Configurar os headers com a API key
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
      };

      const mergedOptions = { ...modelConfig.defaultOptions, ...options };
      
      this.logger.debug(`Gerando texto com modelo ${modelConfig.model}`, {
        provider: this.provider,
        model: modelConfig.model,
      });

      // Preparar a requisição para a API da OpenAI
      const messages = [];
      
      // Adicionar o system prompt se fornecido
      if (mergedOptions.systemPrompt) {
        messages.push({
          role: 'system',
          content: mergedOptions.systemPrompt,
        });
      }

      // Adicionar a mensagem do usuário
      messages.push({
        role: 'user',
        content: prompt,
      });

      const requestPayload = {
        model: modelConfig.model,
        messages,
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.maxTokens,
        top_p: mergedOptions.topP,
        frequency_penalty: mergedOptions.frequencyPenalty,
        presence_penalty: mergedOptions.presencePenalty,
        stop: mergedOptions.stop,
      } as Record<string, any>;

      // Remover propriedades undefined
      Object.keys(requestPayload).forEach((key: string) => {
        if (requestPayload[key] === undefined) {
          delete requestPayload[key];
        }
      });

      // Fazer a requisição para a API da OpenAI
      const startTime = Date.now();
      const response = await this.httpClient.post('/chat/completions', requestPayload, { headers });
      const endTime = Date.now();

      const openAiResponse = response.data;
      const responseText = openAiResponse.choices[0].message.content;
      const finishReason = openAiResponse.choices[0].finish_reason;

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
          promptTokens: openAiResponse.usage?.prompt_tokens || 0,
          completionTokens: openAiResponse.usage?.completion_tokens || 0,
          totalTokens: openAiResponse.usage?.total_tokens || 0,
        },
        finishReason: this.mapFinishReason(finishReason),
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(
        `Erro ao gerar texto com OpenAI (${modelConfig.model}): ${errorMessage}`,
        error.stack,
      );
      throw new Error(`Falha ao gerar texto com OpenAI: ${errorMessage}`);
    }
  }

  /**
   * Verifica se o adaptador está disponível tentando listar modelos
   */
  async isAvailable(modelConfig: ModelConfig): Promise<boolean> {
    try {
      const apiKey = this.getApiKey(modelConfig);
      if (!apiKey) {
        this.logger.warn('API key da OpenAI não está configurada');
        return false;
      }

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
      };

      // Tentar fazer uma requisição simples para verificar
      await this.httpClient.get('/models', { headers });
      
      this.logger.debug('OpenAI API está disponível');
      return true;
    } catch (error: any) {
      this.logger.warn(`OpenAI não está disponível: ${error.message}`);
      return false;
    }
  }

  /**
   * Lista modelos disponíveis na OpenAI
   */
  async listModels(): Promise<string[]> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        return [];
      }
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
      };
      const response = await this.httpClient.get('/models', { headers });
      // Filtrar apenas modelos GPT
      const models: { id: string }[] = response.data.data || [];
      return models
        .filter((model: { id: string }) => 
          model.id.includes('gpt') || 
          model.id.includes('text-') || 
          model.id.includes('davinci')
        )
        .map((model: { id: string }) => model.id);
    } catch (error: any) {
      this.logger.error(`Erro ao listar modelos da OpenAI: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Obtém a API key da OpenAI a partir da configuração
   */
  private getApiKey(modelConfig?: ModelConfig): string {
    // Verificar se a modelConfig tem uma variável de ambiente específica
    if (modelConfig?.apiKeyEnvVar) {
      const apiKey = this.configService.get(modelConfig.apiKeyEnvVar);
      if (typeof apiKey === 'string') {
        return apiKey;
      }
    }
    // Tentar obter de configuração global
    const apiKey = this.configService.get('OPENAI_API_KEY');
    return typeof apiKey === 'string' ? apiKey : '';
  }

  /**
   * Mapeia os códigos de fim de geração da OpenAI para o formato padronizado
   */
  private mapFinishReason(finishReason: string): LlmResponse['finishReason'] {
    switch (finishReason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
} 