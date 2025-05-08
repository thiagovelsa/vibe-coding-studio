export interface ChromaEmbedding {
    ids: string[];
    embeddings?: number[][];
    metadatas?: object[];
    documents?: string[];
}

// Você pode precisar ajustar esta interface QueryResult com base na estrutura real retornada pela sua versão do ChromaDB
export interface ChromaQueryResult {
    ids: string[][];
    embeddings: number[][][] | null;
    metadatas: object[][] | null;
    documents: string[][] | null;
    uris: string[][] | null;
    data: null;
    distances: number[][] | null;
    // Adicione quaisquer outras propriedades que sua versão retorna
} 