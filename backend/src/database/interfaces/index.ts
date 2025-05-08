// Interfaces básicas
export * from './database.interface';

// Interfaces relacionais
export type {
  RelationalDatabaseService,
  TableSchema,
  QueryParams,
  QueryResult,
  RunStatus,
  AgentLogStatus,
  CodeVersionStatus,
  RunHistoryRecord,
  AgentLogRecord,
  CodeVersionRecord,
  RunHistoryFilter,
  AgentLogFilter,
  CodeVersionFilter,
  ExportedRun
} from './relational-database.interface';

// Interfaces vetoriais
export type { VectorDocument } from './vector-storage.interface';
export type {
  SimilaritySearchResult,
  VectorStorage
} from './vector-storage.interface';

// Interfaces de memória vetorial
export type { VectorMemoryStorage } from './vector-memory.interface';
export type { MemorySearchOptions } from './vector-memory.interface';

// Interfaces de armazenamento vetorial
export type { VectorStoreAdapter } from './vector-store.interface'; 