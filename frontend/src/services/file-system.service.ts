import { useState, useCallback } from 'react';
import { useApi, handleApiError } from './api.service';
import { useWebSocket } from './websocket.service';
import { Logger } from '../lib/Logger';

// Tipos de arquivos suportados
export enum FileType {
  FILE = 'file',
  DIRECTORY = 'directory',
  SYMLINK = 'symlink'
}

// Tipos de operações em arquivos
export enum FileOperationType {
  CREATE = 'create',
  MODIFY = 'modify',
  DELETE = 'delete',
  RENAME = 'rename',
  MOVE = 'move'
}

// Informações de arquivo/diretório
export interface FileInfo {
  path: string;
  name: string;
  type: FileType;
  size: number;
  lastModified: string;
  extension?: string;
  children?: FileInfo[];
  content?: string;
  isOpen?: boolean;
  isSelected?: boolean;
  metadata?: {
    gitStatus?: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed' | 'unmodified';
    readOnly?: boolean;
    hidden?: boolean;
    [key: string]: any;
  };
  encoding?: string;
}

// Alterações em um arquivo
export interface FileChange {
  type: FileOperationType;
  path: string;
  oldPath?: string;
  content?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
  };
}

// Histórico de alterações em um arquivo
export interface FileHistory {
  path: string;
  changes: FileChange[];
}

// Conteúdo de um arquivo
export interface FileContent {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
  size: number;
  lastModified: string;
}

// Opções para salvar um arquivo
export interface SaveFileOptions {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
  createParentDirectories?: boolean;
}

// Opções para criar um diretório
export interface CreateDirectoryOptions {
  path: string;
  recursive?: boolean;
}

// Opções para mover/renomear um arquivo
export interface MoveFileOptions {
  oldPath: string;
  newPath: string;
  overwrite?: boolean;
}

// Opções para copiar um arquivo
export interface CopyFileOptions {
  sourcePath: string;
  targetPath: string;
  overwrite?: boolean;
}

// Opções para buscar arquivos
export interface SearchFilesOptions {
  basePath: string;
  pattern: string;
  includeContent?: boolean;
  caseSensitive?: boolean;
  maxResults?: number;
  includeHidden?: boolean;
  excludePatterns?: string[];
}

// Resultado de busca de arquivos
export interface SearchResult {
  path: string;
  matches: {
    line: number;
    content: string;
    startColumn: number;
    endColumn: number;
  }[];
}

// Estado do serviço de sistema de arquivos
export interface FileSystemState {
  currentDirectory: string;
  openFiles: FileInfo[];
  selectedFiles: FileInfo[];
  recentFiles: FileInfo[];
  fileTree: FileInfo | null;
  watchedDirectories: string[];
  loading: boolean;
  error: Error | null;
}

// Interface do serviço de sistema de arquivos
export interface FileSystemService extends FileSystemState {
  // Navegação e listagem
  listDirectory: (path: string) => Promise<FileInfo[]>;
  getFileTree: (rootPath: string, depth?: number) => Promise<FileInfo | null>;
  getFileInfo: (path: string) => Promise<FileInfo | null>;
  
  // Operações de arquivos
  readFile: (path: string, encoding?: 'utf-8' | 'base64') => Promise<FileContent>;
  saveFile: (options: SaveFileOptions) => Promise<FileInfo>;
  createDirectory: (options: CreateDirectoryOptions) => Promise<FileInfo>;
  deleteFile: (path: string, recursive?: boolean) => Promise<void>;
  moveFile: (options: MoveFileOptions) => Promise<FileInfo>;
  copyFile: (options: CopyFileOptions) => Promise<FileInfo>;
  
  // Observadores de arquivos
  watchDirectory: (path: string) => Promise<void>;
  unwatchDirectory: (path: string) => Promise<void>;
  
  // Histórico e busca
  getFileHistory: (path: string) => Promise<FileHistory>;
  searchFiles: (options: SearchFilesOptions) => Promise<SearchResult[]>;
  
  // Gerenciamento de arquivos abertos
  openFile: (path: string) => Promise<FileInfo>;
  closeFile: (path: string) => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  unselectFile: (path: string) => Promise<void>;
  
  // Utilitários
  uploadFile: (path: string, file: File) => Promise<FileInfo>;
  downloadFile: (path: string) => Promise<Blob>;
  changeDirectory: (path: string) => Promise<void>;
}

export function useFileSystemService(): FileSystemService {
  const [currentDirectory, setCurrentDirectory] = useState<string>('');
  const [openFiles, setOpenFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
  const [fileTree, setFileTree] = useState<FileInfo | null>(null);
  const [watchedDirectories, setWatchedDirectories] = useState<string[]>([]);
  
  const api = useApi();
  
  // WebSocket para receber atualizações em tempo real do sistema de arquivos
  const { messages } = useWebSocket({
    onOpen: () => {
      Logger.info('FileSystem WebSocket conectado');
    },
  });
  
  // Processa mensagens WebSocket
  useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    
    try {
      const { type, payload } = lastMessage;
      
      switch (type) {
        case 'file:created':
        case 'file:modified':
        case 'file:deleted':
        case 'file:renamed':
        case 'file:moved': {
          const fileChange = payload as FileChange;
          const path = fileChange.path;
          
          // Se a alteração for em um diretório observado, atualiza a listagem
          if (watchedDirectories.some(dir => path.startsWith(dir))) {
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            listDirectory(dirPath);
          }
          
          // Se a alteração for em um arquivo aberto, atualiza o conteúdo
          if (openFiles.some(file => file.path === path)) {
            getFileInfo(path).then(updatedFile => {
              setOpenFiles(prev => prev.map(file => 
                file.path === path ? { ...file, ...updatedFile } : file
              ));
            });
          }
          
          // Se o arquivo é parte do fileTree, atualiza a árvore
          if (fileTree && path.startsWith(fileTree.path)) {
            getFileTree(fileTree.path);
          }
          break;
        }
      }
    } catch (error) {
      Logger.error('Erro ao processar mensagem WebSocket do sistema de arquivos:', error);
    }
  }, [messages, watchedDirectories, openFiles, fileTree]);
  
  // Navegação e listagem
  const listDirectory = useCallback(async (path: string): Promise<FileInfo[]> => {
    try {
      const response = await api.api?.get<FileInfo[]>(`/filesystem/list`, { 
        params: { path } 
      });
      const data = response?.data;
      setCurrentDirectory(path);
      return data ?? [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }, [api]);
  
  const getFileTree = useCallback(async (rootPath: string, depth = 3): Promise<FileInfo | null> => {
    try {
      const response = await api.api?.get<FileInfo>(`/filesystem/tree`, { 
        params: { path: rootPath, depth } 
      });
      const data = response?.data;
      setFileTree(data ?? null);
      return data ?? null;
    } catch (error) {
      handleApiError(error);
      setFileTree(null);
      return null;
    }
  }, [api]);
  
  const getFileInfo = useCallback(async (path: string): Promise<FileInfo | null> => {
    try {
      const response = await api.api?.get<FileInfo>(`/filesystem/info`, {
        params: { path }
      });
      return response?.data || null;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }, [api]);
  
  // Operações de arquivos
  const readFile = useCallback(async (
    path: string, 
    encoding: 'utf-8' | 'base64' = 'utf-8'
  ): Promise<FileContent> => {
    const response = await api.api?.get<FileContent>(`/filesystem/read`, { 
      params: { path, encoding } 
    });
    const data = response?.data;
    
    if (!data) {
      return {
        path,
        content: '',
        encoding,
        size: 0,
        lastModified: new Date().toISOString()
      };
    }
    
    // Adiciona à lista de arquivos recentes
    const fileInfo = await getFileInfo(path);
    if (fileInfo) {
      setRecentFiles(prev => {
        const filtered = prev.filter(f => f.path !== path);
        return [fileInfo, ...filtered].slice(0, 10);
      });
    }
    
    return data;
  }, [api, getFileInfo]);
  
  const saveFile = useCallback(async (options: SaveFileOptions): Promise<FileInfo> => {
    const response = await api.api?.post<FileInfo>(`/filesystem/write`, options);
    const data = response?.data;
    
    // Atualiza o arquivo na lista de abertos, se estiver aberto
    setOpenFiles(prev => prev.map(file => 
      file.path === options.path ? { ...file, ...data } : file
    ));
    
    return data ?? {
      path: '',
      name: '',
      type: FileType.FILE,
      size: 0,
      lastModified: '',
      content: '',
      encoding: 'utf-8',
    };
  }, [api]);
  
  const createDirectory = useCallback(async (
    options: CreateDirectoryOptions
  ): Promise<FileInfo> => {
    const response = await api.api?.post<FileInfo>(`/filesystem/mkdir`, options);
    const data = response?.data;
    
    return data ?? {
      path: '',
      name: '',
      type: FileType.DIRECTORY,
      size: 0,
      lastModified: '',
    };
  }, [api]);
  
  const deleteFile = useCallback(async (
    path: string, 
    recursive = false
  ): Promise<void> => {
    await api.api?.delete(`/filesystem/delete`, { 
      params: { path, recursive } 
    });
    
    // Remove dos arquivos abertos
    setOpenFiles(prev => prev.filter(file => !file.path.startsWith(path)));
    
    // Remove dos arquivos selecionados
    setSelectedFiles(prev => prev.filter(file => !file.path.startsWith(path)));
    
    // Remove dos arquivos recentes
    setRecentFiles(prev => prev.filter(file => !file.path.startsWith(path)));
  }, [api]);
  
  const moveFile = useCallback(async (options: MoveFileOptions): Promise<FileInfo> => {
    const response = await api.api?.post<FileInfo>(`/filesystem/move`, options);
    const data = response?.data;
    if (!data) throw new Error("Move operation failed");
    
    const updateFileLists = (
      files: FileInfo[],
      oldPath: string,
      newPath: string,
      newData: FileInfo
    ): FileInfo[] => {
      return files.map(file => {
        if (file.path === oldPath) {
          return { ...file, ...newData };
        } else if (file.path.startsWith(oldPath + '/')) {
          // Atualiza caminhos de arquivos dentro do diretório movido
          const relativePath = file.path.substring(oldPath.length);
          return { ...file, path: newPath + relativePath };
        }
        return file;
      });
    };
    
    setOpenFiles(prev => updateFileLists(prev, options.oldPath, options.newPath, data));
    setSelectedFiles(prev => updateFileLists(prev, options.oldPath, options.newPath, data));
    setRecentFiles(prev => updateFileLists(prev, options.oldPath, options.newPath, data));
    
    return data;
  }, [api]);
  
  const copyFile = useCallback(async (options: CopyFileOptions): Promise<FileInfo> => {
    const response = await api.api?.post<FileInfo>(`/filesystem/copy`, options);
    const data = response?.data;
    
    return data ?? {
      path: '',
      name: '',
      type: FileType.FILE,
      size: 0,
      lastModified: '',
      content: '',
      encoding: 'utf-8',
    };
  }, [api]);
  
  // Observadores de arquivos
  const watchDirectory = useCallback(async (path: string): Promise<void> => {
    await api.api?.post(`/filesystem/watch`, { path });
    
    setWatchedDirectories(prev => {
      if (prev.includes(path)) return prev;
      return [...prev, path];
    });
  }, [api]);
  
  const unwatchDirectory = useCallback(async (path: string): Promise<void> => {
    await api.api?.post(`/filesystem/unwatch`, { path });
    
    setWatchedDirectories(prev => prev.filter(dir => dir !== path));
  }, [api]);
  
  // Histórico e busca
  const getFileHistory = useCallback(async (path: string): Promise<FileHistory> => {
    const response = await api.api?.get<FileHistory>(`/filesystem/history`, { 
      params: { path } 
    });
    const data = response?.data;
    
    return data ?? { path: '', changes: [] };
  }, [api]);
  
  const searchFiles = useCallback(async (
    options: SearchFilesOptions
  ): Promise<SearchResult[]> => {
    const response = await api.api?.post<SearchResult[]>(`/filesystem/search`, options);
    const data = response?.data;
    
    return data ?? [];
  }, [api]);
  
  // Gerenciamento de arquivos abertos
  const openFile = useCallback(async (path: string): Promise<FileInfo> => {
    const existingFile = openFiles.find(file => file.path === path);
    if (existingFile) {
      return existingFile;
    }
    
    const fileInfo = await getFileInfo(path);
    if (!fileInfo) throw new Error(`File not found: ${path}`);
    
    if (fileInfo.type === FileType.FILE) {
      const content = await readFile(path);
      fileInfo.content = content.content;
    }
    
    const updatedFileInfo: FileInfo = { ...fileInfo, isOpen: true };
    
    setOpenFiles(prev => [...prev, updatedFileInfo]);
    
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.path !== path);
      return [updatedFileInfo, ...filtered].slice(0, 10);
    });
    
    return updatedFileInfo;
  }, [openFiles, getFileInfo, readFile]);
  
  const closeFile = useCallback(async (path: string): Promise<void> => {
    setOpenFiles(prev => prev.filter(file => file.path !== path));
  }, []);
  
  const selectFile = useCallback(async (path: string): Promise<void> => {
    if (!selectedFiles.some(file => file.path === path)) {
      const fileInfo = await getFileInfo(path);
      if (!fileInfo) return;
      const updatedFileInfo: FileInfo = { ...fileInfo, isSelected: true };
      setSelectedFiles(prev => [...prev, updatedFileInfo]);
    }
  }, [selectedFiles, getFileInfo]);
  
  const unselectFile = useCallback(async (path: string): Promise<void> => {
    setSelectedFiles(prev => prev.filter(file => file.path !== path));
  }, []);
  
  // Utilitários
  const uploadFile = useCallback(async (path: string, file: File): Promise<FileInfo> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const baseUrl = api.api?.defaults.baseURL || '';
    const token = '';
    
    const response = await fetch(`${baseUrl}/filesystem/upload?path=${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data ?? {
      path: '',
      name: '',
      type: FileType.FILE,
      size: 0,
      lastModified: '',
      content: '',
      encoding: 'utf-8',
    };
  }, [api]);
  
  const downloadFile = useCallback(async (path: string): Promise<Blob> => {
    const baseUrl = api.api?.defaults.baseURL || '';
    const token = '';
    
    const response = await fetch(`${baseUrl}/filesystem/download?path=${encodeURIComponent(path)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.blob();
  }, [api]);
  
  const changeDirectory = useCallback(async (path: string): Promise<void> => {
    await listDirectory(path);
    setCurrentDirectory(path);
  }, [listDirectory]);
  
  return {
    // Estado
    currentDirectory,
    openFiles,
    selectedFiles,
    recentFiles,
    fileTree,
    watchedDirectories,
    loading: api.loading,
    error: api.error,
    
    // Navegação e listagem
    listDirectory,
    getFileTree,
    getFileInfo,
    
    // Operações de arquivos
    readFile,
    saveFile,
    createDirectory,
    deleteFile,
    moveFile,
    copyFile,
    
    // Observadores de arquivos
    watchDirectory,
    unwatchDirectory,
    
    // Histórico e busca
    getFileHistory,
    searchFiles,
    
    // Gerenciamento de arquivos abertos
    openFile,
    closeFile,
    selectFile,
    unselectFile,
    
    // Utilitários
    uploadFile,
    downloadFile,
    changeDirectory,
  };
} 