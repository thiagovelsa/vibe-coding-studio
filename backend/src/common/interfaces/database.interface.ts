export interface ChromaCollection {
  name: string;
  metadata?: Record<string, any>;
}

export interface ChromaEmbedding {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
  document?: string;
}

export interface QueryResult {
  ids: string[][];
  distances: number[][];
  metadatas: Record<string, any>[][];
  documents?: string[][];
}

export interface DatabaseConnectionOptions {
  type: string;
  database: string;
  entities: any[];
  synchronize: boolean;
  logging: boolean;
} 