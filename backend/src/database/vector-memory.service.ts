import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '@logger/logger.service';
import { EmbeddingService } from './embedding.service';
import {
  VectorDocument,
  SimilaritySearchResult,
  VectorStorage
} from './interfaces';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço que implementa armazenamento vetorial usando ChromaDB
 */
@Injectable()
export class VectorMemoryService implements OnModuleInit, VectorStorage {
  /** URL base da API ChromaDB */
  private readonly baseUrl: string;
  
  /** Cliente HTTP para comunicação com ChromaDB */
  private readonly client: AxiosInstance;
  
  /** Dimensão dos vetores de embedding */
  private readonly embeddingDimension: number;
  
  /** Coleções padrão a serem criadas durante inicialização */
  private readonly defaultCollections = [
    'conversations', // Armazena históricos de conversas
    'code-contexts', // Armazena snippets de código e contexto
    'requirements',  // Armazena requisitos e especificações
    'knowledge',     // Armazena conhecimento geral persistente
  ];
  
  /** Indica se o serviço está disponível */
  private isServiceAvailable = false;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.baseUrl = this.configService.get('CHROMA_DB_URL') || 'http://localhost:8000';
    this.embeddingDimension = this.configService.get('EMBEDDING_DIMENSION') 
      ? parseInt(this.configService.get('EMBEDDING_DIMENSION'), 10)
      : 1536;
      
    // Configura o cliente HTTP
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Configura interceptor para logar erros de API
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          this.loggerService.error(
            `ChromaDB API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
            error.stack
          );
        } else if (error.request) {
          this.loggerService.error(
            `ChromaDB connection error: ${error.message}`,
            error.stack
          );
        } else {
          this.loggerService.error(
            `Error in ChromaDB request: ${error.message}`,
            error.stack
          );
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Inicializa o serviço e as coleções necessárias quando o módulo é carregado
   */
  async onModuleInit() {
    try {
      await this.initialize();
    } catch (error) {
      this.loggerService.error('Failed to initialize VectorMemoryService:', error);
    }
  }
  
  /**
   * Inicializa o serviço e as coleções necessárias
   */
  async initialize(): Promise<void> {
    try {
      // Verifica se o ChromaDB está disponível
      await this.client.get('/api/v1/heartbeat');
      
      // Cria coleções padrão
      for (const collection of this.defaultCollections) {
        await this.createCollectionIfNotExists(collection);
      }
      
      this.isServiceAvailable = true;
      this.loggerService.log('VectorMemoryService initialized successfully');
    } catch (error: unknown) {
      this.isServiceAvailable = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error('Failed to initialize vector memory service', error);
      throw new Error(`Failed to initialize vector memory service: ${errorMessage}`);
    }
  }
  
  /**
   * Verifica se o serviço está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.get('/api/v1/heartbeat');
      return true;
    } catch (error) {
      this.loggerService.warn('ChromaDB is not available');
      return false;
    }
  }
  
  /**
   * Cria uma coleção se ela não existir
   * @param name Nome da coleção
   * @param metadata Metadados da coleção
   */
  private async createCollectionIfNotExists(name: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Verifica se a coleção já existe
      await this.client.get(`/api/v1/collections/${name}`);
      this.loggerService.log(`Collection ${name} already exists`);
    } catch (error: unknown) {
      // Verificar se o erro é porque a coleção não existe (código 404)
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response && 
          error.response.status === 404) {
        await this.createCollection(name, metadata);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Cria uma nova coleção
   * @param collection Nome da coleção
   * @param metadata Metadados opcionais da coleção
   */
  async createCollection(collection: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await this.client.post('/api/v1/collections', {
        name: collection,
        metadata: metadata || { description: `Collection for ${collection}` }
      });
      
      this.loggerService.log(`Created collection: ${collection}`);
    } catch (error: unknown) {
      // Se a coleção já existe, ignora o erro
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response && 
          error.response.status === 409) {
        this.loggerService.log(`Collection ${collection} already exists`);
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error(`Failed to create collection ${collection}`, error);
      throw new Error(`Failed to create collection ${collection}: ${errorMessage}`);
    }
  }
  
  /**
   * Lista todas as coleções disponíveis
   */
  async listCollections(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/v1/collections');
      return response.data.map((collection: { name: string }) => collection.name);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error('Failed to list collections', error);
      throw new Error(`Failed to list collections: ${errorMessage}`);
    }
  }
  
  /**
   * Armazena um documento com seu embedding
   * @param collection Nome da coleção
   * @param document Documento a ser armazenado
   */
  async storeDocument(collection: string, document: VectorDocument): Promise<void> {
    if (!this.isServiceAvailable) {
      throw new Error('Vector memory service is not available');
    }
    
    try {
      // Garante que o documento tem um ID
      const docId = document.id || uuidv4();
      // Usa o embedding fornecido ou gera um novo
      const embedding = document.embedding || 
        await this.embeddingService.embedText(document.text ?? document.content ?? '');
      // Padroniza: sempre armazene 'text' (e 'content' para compatibilidade)
      const text = document.text ?? document.content ?? '';
      await this.client.post(`/api/v1/collections/${collection}/add`, {
        ids: [docId],
        embeddings: [embedding],
        metadatas: [document.metadata || {}],
        documents: [text]
      });
      this.loggerService.log(`Stored document in collection ${collection} with ID ${docId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error(`Failed to store document in collection ${collection}`, error);
      throw new Error(`Failed to store document: ${errorMessage}`);
    }
  }
  
  /**
   * Armazena múltiplos documentos com seus embeddings
   * @param collection Nome da coleção
   * @param documents Documentos a serem armazenados
   */
  async storeManyDocuments(collection: string, documents: VectorDocument[]): Promise<void> {
    if (!this.isServiceAvailable) {
      throw new Error('Vector memory service is not available');
    }
    
    if (documents.length === 0) {
      return;
    }
    
    try {
      const ids: string[] = [];
      const embeddings: number[][] = [];
      const metadatas: Record<string, any>[] = [];
      const texts: string[] = [];
      
      // Processa cada documento
      for (const doc of documents) {
        // Garante que o documento tem um ID
        const docId = doc.id || uuidv4();
        ids.push(docId);
        
        // Usa o embedding fornecido ou gera um novo
        if (doc.embedding) {
          embeddings.push(doc.embedding);
        } else {
          // Se precisar gerar embeddings, faz um por um para evitar exceder limites de tokens
          const embedding = await this.embeddingService.embedText(doc.text ?? doc.content ?? '');
          embeddings.push(embedding);
        }
        
        metadatas.push(doc.metadata || {});
        texts.push(doc.text ?? doc.content ?? '');
      }
      
      // Adiciona os documentos à coleção
      await this.client.post(`/api/v1/collections/${collection}/add`, {
        ids,
        embeddings,
        metadatas,
        documents: texts
      });
      
      this.loggerService.log(`Stored ${documents.length} documents in collection ${collection}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error(`Failed to store documents in collection ${collection}`, error);
      throw new Error(`Failed to store documents: ${errorMessage}`);
    }
  }
  
  /**
   * Busca documentos similares a um vetor de embedding
   * @param collection Nome da coleção
   * @param embedding Vetor de embedding para busca
   * @param options Opções de busca
   */
  async searchSimilar(
    collection: string,
    embedding: number[],
    options?: any
  ): Promise<SimilaritySearchResult[]> {
    if (!this.isServiceAvailable) {
      throw new Error('Vector memory service is not available');
    }
    
    try {
      const limit = options?.limit || 5;
      
      // Prepara a requisição de busca
      const requestData: any = {
        query_embeddings: [embedding],
        n_results: limit
      };
      
      // Adiciona filtro se fornecido
      if (options?.filter) {
        requestData.where = options.filter;
      }
      
      // Realiza a busca
      const response = await this.client.post(
        `/api/v1/collections/${collection}/query`,
        requestData
      );
      
      // Processa os resultados
      const results: SimilaritySearchResult[] = [];
      
      if (response.data.ids?.[0] && response.data.ids[0].length > 0) {
        const ids = response.data.ids[0];
        const documents = response.data.documents?.[0] || [];
        const metadatas = response.data.metadatas?.[0] || [];
        const distances = response.data.distances?.[0] || [];
        
        for (let i = 0; i < ids.length; i++) {
          // Converte distância em pontuação (distância menor = similaridade maior)
          // A distância de ChromaDB é baseada em similaridade de cosseno, que varia de -1 a 1
          // Convertemos para uma pontuação de 0 a 1, onde 1 é máxima similaridade
          const score = 1 - (distances[i] || 0) / 2;
          
          // Filtra por pontuação mínima se especificada
          if (options?.minScore !== undefined && score < options.minScore) {
            continue;
          }
          
          // Padroniza: sempre retorna 'text', mantém 'content' para compatibilidade
          results.push({
            id: ids[i],
            text: documents[i] || '',
            content: documents[i] || '', // compatibilidade
            score,
            metadata: metadatas[i] || {}
          });
        }
      }
      
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error(`Failed to search in collection ${collection}`, error);
      throw new Error(`Failed to search for similar documents: ${errorMessage}`);
    }
  }
  
  /**
   * Busca documentos similares a um texto
   * @param collection Nome da coleção 
   * @param text Texto para busca
   * @param options Opções de busca
   */
  async searchSimilarByText(
    collection: string,
    text: string,
    options?: any
  ): Promise<SimilaritySearchResult[]> {
    // Converte o texto em embedding e realiza a busca
    const embedding = await this.embeddingService.embedText(text);
    return this.searchSimilar(collection, embedding, options);
  }
  
  /**
   * Recupera um documento pelo ID
   * @param collection Nome da coleção
   * @param id ID do documento
   */
  async getDocument(collection: string, id: string): Promise<VectorDocument | null> {
    if (!this.isServiceAvailable) {
      throw new Error('Vector memory service is not available');
    }
    
    try {
      // Busca o documento por ID
      const response = await this.client.post(`/api/v1/collections/${collection}/get`, {
        ids: [id],
        include: ['embeddings', 'metadatas', 'documents']
      });
      
      // Verifica se encontrou o documento
      if (response.data.ids?.length === 0) {
        return null;
      }
      
      // Extrai os dados do documento
      // Padroniza: sempre retorna 'text', mantém 'content' para compatibilidade
      return {
        id: response.data.ids[0],
        text: response.data.documents?.[0] || '',
        content: response.data.documents?.[0] || '', // compatibilidade
        embedding: response.data.embeddings?.[0] || [],
        metadata: response.data.metadatas?.[0] || {}
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error(`Failed to get document ${id} from collection ${collection}`, error);
      throw new Error(`Failed to get document: ${errorMessage}`);
    }
  }
  
  /**
   * Remove um documento pelo ID
   * @param id ID do documento
   */
  async deleteDocument(id: string): Promise<boolean> {
    if (!this.isServiceAvailable) {
      throw new Error('Vector memory service is not available');
    }
    try {
      // Remove o documento
      await this.client.post(`/api/v1/collections/conversations/delete`, {
        ids: [id]
      });
      this.loggerService.log(`Deleted document ${id} from collection conversations`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      this.loggerService.error(`Failed to delete document ${id} from collection conversations`, error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
  
  /**
   * Armazena uma conversa para memória de longo prazo
   * @param agentType Tipo de agente participante (ex: 'product', 'coder')
   * @param messages Array de mensagens da conversa
   * @param sessionId ID da sessão ou conversa
   * @param metadata Metadados adicionais
   */
  async storeConversation(
    agentType: string,
    messages: Array<{ role: string; content: string }>,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    // Converte as mensagens em um único texto
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
    
    // Gera um ID para o documento
    const documentId = `conv-${sessionId}-${Date.now()}`;
    
    // Cria metadados enriquecidos para a conversa
    const docMetadata = {
      type: 'conversation',
      agentType,
      sessionId,
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      ...metadata
    };
    
    // Cria o embedding para o texto da conversa
    const embedding = await this.embeddingService.embedText(conversationText);
    
    // Armazena a conversa
    await this.storeDocument('conversations', {
      id: documentId,
      text: conversationText,
      content: conversationText, // compatibilidade
      embedding,
      metadata: docMetadata
    });
    
    return documentId;
  }
  
  /**
   * Armazena código-fonte e seu contexto
   * @param files Array de arquivos com nome e conteúdo
   * @param context Contexto adicional sobre o código
   * @param projectId ID do projeto (opcional)
   * @param metadata Metadados adicionais
   */
  async storeCodeContext(
    files: Array<{ name: string; content: string }>,
    context: string,
    projectId?: string,
    metadata: Record<string, any> = {}
  ): Promise<string[]> {
    const documentIds: string[] = [];
    
    // Processa cada arquivo
    for (const file of files) {
      // Combina o nome do arquivo, contexto e conteúdo
      const documentText = `Arquivo: ${file.name}\nContexto: ${context}\n\n${file.content}`;
      
      // Gera um ID para o documento
      const documentId = `code-${projectId || 'global'}-${Date.now()}-${documentIds.length}`;
      
      // Cria metadados para o arquivo
      const docMetadata = {
        type: 'code',
        fileName: file.name,
        projectId: projectId || 'global',
        timestamp: new Date().toISOString(),
        ...metadata
      };
      
      // Cria o embedding para o código
      const embedding = await this.embeddingService.embedText(documentText);
      
      // Armazena o código
      await this.storeDocument('code-contexts', {
        id: documentId,
        text: documentText,
        content: documentText, // compatibilidade
        embedding,
        metadata: docMetadata
      });
      
      documentIds.push(documentId);
    }
    
    return documentIds;
  }
  
  /**
   * Recupera contexto similar a uma consulta
   * @param query Texto da consulta
   * @param collections Coleções a serem pesquisadas (padrão: todas)
   * @param limit Número máximo de resultados
   */
  async retrieveSimilarContext(
    query: string,
    collections?: string[],
    limit: number = 5
  ): Promise<SimilaritySearchResult[]> {
    const allResults: SimilaritySearchResult[] = [];
    
    // Lista de coleções a pesquisar
    const searchCollections = collections || this.defaultCollections;
    
    // Gera o embedding da consulta
    const queryEmbedding = await this.embeddingService.embedText(query);
    
    // Pesquisa em cada coleção
    for (const collection of searchCollections) {
      try {
        const results = await this.searchSimilar(collection, queryEmbedding, {
          limit,
          minScore: 0.7 // Filtra resultados com baixa relevância
        });
        
        // Adiciona o nome da coleção aos metadados para identificação
        results.forEach(result => {
          if (!result.metadata) result.metadata = {};
          result.metadata.collection = collection;
        });
        
        allResults.push(...results);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.loggerService.warn(`Error searching collection ${collection}: ${errorMessage}`);
        // Continua com outras coleções mesmo que uma falhe
      }
    }
    
    // Ordena por similaridade (maior primeiro)
    allResults.sort((a, b) => b.score - a.score);
    
    // Limita o número total de resultados
    return allResults.slice(0, limit);
  }
  
  /**
   * Resume o contexto para uma consulta específica
   * @param query Consulta para recuperar contexto relevante
   * @param llmService Serviço LLM para gerar o resumo
   */
  async summarizeContext(
    query: string,
    llmServiceFn: (prompt: string) => Promise<string>
  ): Promise<string> {
    // Recupera contexto relevante
    const relevantContext = await this.retrieveSimilarContext(query);
    
    if (relevantContext.length === 0) {
      return 'Nenhum contexto relevante encontrado.';
    }
    
    // Formata o contexto para o prompt
    const contextText = relevantContext
      .map((ctx, index) => {
        // Usa 'text' como principal, fallback para 'content' por compatibilidade
        const ctxText = ctx.text ?? ctx.content ?? '';
        const meta = ctx.metadata ?? {};
        return `[${index + 1}] ${meta.type || 'Unknown'} (score: ${ctx.score.toFixed(2)}):\n${ctxText.substring(0, 500)}${ctxText.length > 500 ? '...' : ''}`;
      })
      .join('\n\n---\n\n');
    
    // Cria o prompt para resumo
    const prompt = `
Resumo o seguinte contexto relacionado à consulta: "${query}"

${contextText}

Resume os pontos principais do contexto acima que são relevantes para a consulta. 
Seja conciso, objetivo e inclua apenas informações pertinentes.
`;
    
    // Gera o resumo
    const summary = await llmServiceFn(prompt);
    return summary;
  }

  // Métodos obrigatórios da interface VectorStorage
  async addDocument(document: VectorDocument): Promise<string> {
    await this.storeDocument('conversations', document);
    return document.id;
  }
  async search(params: { embedding: number[], limit?: number, threshold?: number, filter?: Record<string, any> }): Promise<SimilaritySearchResult[]> {
    return this.searchSimilar('conversations', params.embedding, params);
  }
  async updateDocument(id: string, document: Partial<VectorDocument>): Promise<boolean> {
    // Exemplo simplificado: deleta e adiciona novamente
    await this.deleteDocument(id);
    await this.addDocument({ ...document, id } as VectorDocument);
    return true;
  }
} 