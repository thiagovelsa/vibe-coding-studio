import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '@logger/logger.service';
import { LlmService } from '@llm/llm.service';
import * as crypto from 'crypto';

/**
 * Serviço responsável por converter texto em embeddings vetoriais.
 */
@Injectable()
export class EmbeddingService {
  /** Dimensão dos vetores de embedding */
  private readonly embeddingDimension: number;
  
  /** Modelo a ser usado para gerar embeddings */
  private readonly embeddingModel: string;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly llmService: LlmService,
  ) {
    this.embeddingDimension = this.configService.get('EMBEDDING_DIMENSION') 
      ? parseInt(this.configService.get('EMBEDDING_DIMENSION'), 10)
      : 1536; // Dimensão padrão dos embeddings OpenAI
      
    this.embeddingModel = this.configService.get('EMBEDDING_MODEL') || 'text-embedding-ada-002';
    
    this.loggerService.log(`EmbeddingService initialized with model ${this.embeddingModel}`);
  }
  
  /**
   * Gera um embedding vetorial para o texto fornecido.
   * @param text Texto para o qual gerar o embedding
   * @returns Vetor de embeddings
   */
  async embedText(text: string): Promise<number[]> {
    try {
      // Limita o tamanho do texto para evitar tokens excessivos
      const trimmedText = this.truncateText(text);
      
      // Tenta usar o LlmService para gerar embeddings reais
      try {
        const embedding = await this.llmService.generateEmbedding(trimmedText);
        
        return embedding;
      } catch (llmError: unknown) {
        const errorMessage = this.getErrorMessage(llmError);
        this.loggerService.warn(`Failed to generate embedding with LLM: ${errorMessage}`);
        this.loggerService.warn('Falling back to deterministic hash-based embeddings');
        
        // Fallback para embeddings baseados em hash (não ideal para produção,
        // mas funciona como solução temporária quando o serviço de embeddings não está disponível)
        return this.generateHashBasedEmbedding(trimmedText);
      }
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.loggerService.error(`Error generating embedding: ${errorMessage}`);
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }
  
  /**
   * Extrai a mensagem de erro de uma exceção, lidando com o tipo 'unknown'
   * @param error Objeto de erro
   * @returns Mensagem de erro como string
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  
  /**
   * Trunca o texto para um tamanho máximo para evitar exceder limites de tokens.
   * @param text Texto para truncar
   * @returns Texto truncado
   */
  private truncateText(text: string): string {
    const maxChars = 8000; // ~2048 tokens para a maioria dos tokenizadores
    
    if (text.length <= maxChars) {
      return text;
    }
    
    // Mantém o início e o fim do texto, removendo o meio
    const halfMax = Math.floor(maxChars / 2);
    return text.substring(0, halfMax) + '...' + text.substring(text.length - halfMax);
  }
  
  /**
   * Gera embeddings baseados em hash (fallback).
   * Esta NÃO é uma solução ideal para produção, mas serve como fallback.
   * @param text Texto para o qual gerar o embedding
   * @returns Vetor de embeddings
   */
  private generateHashBasedEmbedding(text: string): number[] {
    // Cria um hash deterministico do texto
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    
    // Usa o hash para gerar um vetor pseudoaleatório deterministico
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    // Preenche o vetor com valores derivados do hash
    for (let i = 0; i < this.embeddingDimension; i++) {
      const hashPart = hash.substring(i % 32, (i % 32) + 8);
      const value = parseInt(hashPart, 16);
      // Normaliza para o intervalo [-1, 1]
      embedding[i] = (value / 0xffffffff) * 2 - 1;
    }
    
    // Normaliza o vetor para ter comprimento 1 (importante para similaridade de cosseno)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  /**
   * Calcula a similaridade de cosseno entre dois vetores de embedding.
   * @param embedding1 Primeiro vetor de embedding
   * @param embedding2 Segundo vetor de embedding
   * @returns Similaridade de cosseno (entre -1 e 1, com 1 sendo idênticos)
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  /**
   * Calcula a distância euclidiana entre dois vetores de embedding.
   * @param embedding1 Primeiro vetor de embedding
   * @param embedding2 Segundo vetor de embedding
   * @returns Distância euclidiana
   */
  calculateEuclideanDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }
    
    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sum += diff * diff;
    }
    
    return Math.sqrt(sum);
  }
} 