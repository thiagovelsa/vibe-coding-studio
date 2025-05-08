import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { ChromaEmbedding, ChromaQueryResult } from '@/types/chroma.types';

@Injectable()
export class DatabaseService implements OnModuleInit {
    private chromaClient!: ChromaClient;
    private collections: Map<string, Collection> = new Map();
    private readonly logger = new Logger(DatabaseService.name);
    private sessionsCollection!: Collection;
    private messagesCollection!: Collection;

    constructor(
        private readonly configService: ConfigService,
    ) {
        const baseUrl = this.configService.get<string>('CHROMA_DB_URL');
        if (!baseUrl) {
            throw new Error('CHROMA_DB_URL não está definida nas variáveis de ambiente.');
        }
        this.chromaClient = new ChromaClient({ path: baseUrl });
        this.logger.log(`Conectado ao ChromaDB em ${baseUrl}`);
    }

    async onModuleInit() {
        await this.initializeCollections();
    }

    private async initializeCollections() {
        try {
            this.sessionsCollection = await this.getOrCreateCollection('sessions');
            this.messagesCollection = await this.getOrCreateCollection('messages');
            this.logger.log('Coleções ChromaDB inicializadas com sucesso.');
        } catch (error: any) {
            this.logger.error('Falha ao inicializar coleções ChromaDB', error.stack);
            throw new Error('Failed to initialize ChromaDB collections');
        }
    }

    private async getOrCreateCollection(collectionName: string): Promise<Collection> {
        try {
            this.logger.log(`Tentando obter ou criar coleção: ${collectionName}`);
            const collection = await this.chromaClient.getOrCreateCollection({ name: collectionName });
            this.logger.log(`Coleção ${collectionName} obtida/criada.`);
            this.collections.set(collectionName, collection);
            return collection;
        } catch (error: any) {
            this.logger.error(`Falha ao obter/criar coleção ${collectionName}`, error.stack);
            throw error;
        }
    }

    private async getCollection(collectionName: string): Promise<Collection> {
        const collection = this.collections.get(collectionName);
        if (!collection) {
            this.logger.warn(`Coleção ${collectionName} não encontrada no cache, tentando obter/criar novamente.`);
            return await this.getOrCreateCollection(collectionName);
        }
        return collection;
    }

    async addEmbedding(collectionName: string, params: ChromaEmbedding): Promise<any> {
        try {
            const collection = await this.getCollection(collectionName);
            const result = await collection.add(params as any);
            this.logger.log(`Documento ${params.ids} adicionado à coleção ${collectionName}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Falha ao adicionar embedding à coleção ${collectionName}`, error.stack);
            throw error;
        }
    }

    async queryEmbeddings(collectionName: string, params: { ids?: string[], where?: object, whereDocument?: object, include?: any[] }): Promise<ChromaQueryResult> {
        try {
            const collection = await this.getCollection(collectionName);
            const result = await collection.get(params as any);
            this.logger.log(`Consulta na coleção ${collectionName} para IDs ${params.ids?.join(',')} retornou ${result.ids?.[0]?.length ?? 0} resultados`);
            return result as unknown as ChromaQueryResult;
        } catch (error: any) {
            this.logger.error(`Falha ao consultar embeddings na coleção ${collectionName}`, error.stack);
            throw error;
        }
    }

    async deleteEmbeddings(collectionName: string, ids: string[]): Promise<void> {
        try {
            const collection = await this.getCollection(collectionName);
            await collection.delete({ ids });
            this.logger.log(`Documentos removidos da coleção ${collectionName}: ${ids.join(', ')}`);
        } catch (error: any) {
            this.logger.error(`Falha ao deletar embeddings da coleção ${collectionName}`, error.stack);
            throw error;
        }
    }

    async addSessionEmbedding(params: ChromaEmbedding) {
        return this.addEmbedding('sessions', params);
    }

    async addMessageEmbedding(params: ChromaEmbedding) {
        return this.addEmbedding('messages', params);
    }

    async querySessionEmbeddings(params: { ids?: string[], where?: object, whereDocument?: object, include?: any[] }) {
        return this.queryEmbeddings('sessions', params);
    }

    async queryMessageEmbeddings(params: { ids?: string[], where?: object, whereDocument?: object, include?: any[] }) {
        return this.queryEmbeddings('messages', params);
    }

    async deleteSessionEmbeddings(ids: string[]) {
        return this.deleteEmbeddings('sessions', ids);
    }

    async deleteMessageEmbeddings(ids: string[]) {
        return this.deleteEmbeddings('messages', ids);
    }
} 