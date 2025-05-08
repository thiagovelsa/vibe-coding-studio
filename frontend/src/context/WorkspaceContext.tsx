import React, { createContext, useReducer, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFileSystemService } from '../services/file-system.service';
// import { getLanguageFromExtension } from '../utils/languageUtils'; // Removed problematic import
import { useUIState, OpenTab as UIStateOpenTab } from './UIStateContext';
import { errorManager, ErrorSeverity, ErrorSource } from '../lib/ErrorManager';
import { FileFeedback, FileOperation, useFileFeedback } from '../components/common/FileFeedback';
import { Logger } from '../lib/Logger';

// Types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  parent: string | null;
  children?: string[];
  content?: string;
  lastModified?: string;
  size?: number;
  extension?: string;
  metadata?: Record<string, any>;
}

// New type for the hierarchical tree structure
export type TreeFileNode = Omit<FileNode, 'children'> & {
  children?: TreeFileNode[];
};

export interface OpenFile {
  id: string;
  fileId: string;
  content: string;
  path: string;
  name: string;
  isDirty: boolean;
  language: string;
  lastModified: string;
  cursor?: { line: number; column: number };
}

interface WorkspaceState {
  name: string;
  rootPath: string | null;
  files: Record<string, FileNode>;
  rootDirectory: string | null;
  openFiles: OpenFile[];
  activeFileId: string | null;
  recentFiles: string[];
  isLoading: boolean;
  error: string | null;
}

type WorkspaceAction =
  | { type: 'SET_WORKSPACE'; payload: { name: string; rootPath: string } }
  | { type: 'SET_FILES'; payload: Record<string, FileNode> }
  | { type: 'ADD_FILE'; payload: FileNode }
  | { type: 'UPDATE_FILE'; payload: { id: string; updates: Partial<FileNode> } }
  | { type: 'DELETE_FILE'; payload: string }
  | { type: 'SET_ACTIVE_FILE'; payload: string | null }
  | { type: 'OPEN_FILE'; payload: OpenFile }
  | { type: 'CLOSE_FILE'; payload: string }
  | { type: 'UPDATE_OPEN_FILE'; payload: { id: string; updates: Partial<OpenFile> } }
  | { type: 'SET_FILE_DIRTY'; payload: { id: string; isDirty: boolean } }
  | { type: 'ADD_RECENT_FILE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOT_DIRECTORY'; payload: string | null };

// Initial state
const initialWorkspaceState: WorkspaceState = {
  name: 'Sem Título',
  rootPath: null,
  files: {},
  rootDirectory: null,
  openFiles: [],
  activeFileId: null,
  recentFiles: [],
  isLoading: false,
  error: null,
};

// Reducer
const workspaceReducer = (state: WorkspaceState, action: WorkspaceAction): WorkspaceState => {
  switch (action.type) {
    case 'SET_WORKSPACE':
      return {
        ...state,
        name: action.payload.name,
        rootPath: action.payload.rootPath,
      };
    case 'SET_FILES':
      return {
        ...state,
        files: action.payload,
      };
    case 'ADD_FILE':
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.id]: action.payload,
        },
      };
    case 'UPDATE_FILE':
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.id]: {
            ...state.files[action.payload.id],
            ...action.payload.updates,
            lastModified: new Date().toISOString(),
          },
        },
      };
    case 'DELETE_FILE':
      const newFiles = { ...state.files };
      delete newFiles[action.payload];
      return {
        ...state,
        files: newFiles,
      };
    case 'SET_ACTIVE_FILE':
      return {
        ...state,
        activeFileId: action.payload,
      };
    case 'OPEN_FILE':
      // Verifica se o arquivo já está aberto
      const fileIndex = state.openFiles.findIndex(f => f.fileId === action.payload.fileId);
      
      if (fileIndex >= 0) {
        // Se já estiver aberto, apenas atualiza
        const updatedOpenFiles = [...state.openFiles];
        updatedOpenFiles[fileIndex] = {
          ...updatedOpenFiles[fileIndex],
          content: action.payload.content,
          lastModified: action.payload.lastModified,
        };
        
        return {
          ...state,
          openFiles: updatedOpenFiles,
          activeFileId: updatedOpenFiles[fileIndex].id,
        };
      } else {
        // Senão, adiciona aos arquivos abertos
        return {
          ...state,
          openFiles: [...state.openFiles, action.payload],
          activeFileId: action.payload.id,
        };
      }
    case 'CLOSE_FILE':
      return {
        ...state,
        openFiles: state.openFiles.filter(file => file.id !== action.payload),
        activeFileId: state.activeFileId === action.payload
          ? state.openFiles.length > 1
            ? state.openFiles.find(f => f.id !== action.payload)?.id || null
            : null
          : state.activeFileId,
      };
    case 'UPDATE_OPEN_FILE':
      return {
        ...state,
        openFiles: state.openFiles.map(file => 
          file.id === action.payload.id
            ? { ...file, ...action.payload.updates, lastModified: new Date().toISOString() }
            : file
        ),
      };
    case 'SET_FILE_DIRTY':
      return {
        ...state,
        openFiles: state.openFiles.map(file => 
          file.id === action.payload.id
            ? { ...file, isDirty: action.payload.isDirty }
            : file
        ),
      };
    case 'ADD_RECENT_FILE':
      // Remove o arquivo se já existir na lista e adiciona no início
      const newRecentFiles = [
        action.payload,
        ...state.recentFiles.filter(id => id !== action.payload),
      ].slice(0, 10); // Mantém apenas os 10 mais recentes
      
      return {
        ...state,
        recentFiles: newRecentFiles,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_ROOT_DIRECTORY':
      return {
        ...state,
        rootDirectory: action.payload,
      };
    default:
      return state;
  }
};

// Context
interface WorkspaceContextType {
  state: WorkspaceState;
  openWorkspace: (name: string, rootPath: string) => Promise<void>;
  openFile: (fileId: string) => Promise<void>;
  closeFile: (fileId: string) => void;
  saveFile: (fileId: string, content: string) => Promise<boolean>;
  createFile: (path: string, name: string, content?: string) => Promise<string | null>;
  createDirectory: (path: string, name: string) => Promise<string | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  updateFileContent: (fileId: string, content: string) => void;
  getFileTree: () => TreeFileNode[];
  registerFeedbackHandlers: (handlers: any) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Provider
interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);
  const fileSystemService = useFileSystemService();
  const { openTab, setActiveTab, closeTab, updateTab } = useUIState();

  // Variável para armazenar as funções de feedback
  // Esta variável será preenchida por componentes que usam o contexto
  const feedbackHandlers = React.useRef<{
    addOperation?: (operation: any) => void;
    updateOperation?: (filePath: string, type: FileOperation, status: 'success' | 'error' | 'pending', error?: string) => void;
    removeOperation?: (filePath: string, type: FileOperation) => void;
  }>({});
  
  // Método para registrar handlers de feedback
  const registerFeedbackHandlers = useCallback((handlers: typeof feedbackHandlers.current) => {
    feedbackHandlers.current = handlers;
  }, []);

  // Load workspace from localStorage on mount
  useEffect(() => {
    try {
      const savedWorkspace = localStorage.getItem('vf-workspace');
      if (savedWorkspace) {
        const { name, rootPath } = JSON.parse(savedWorkspace);
        dispatch({
          type: 'SET_WORKSPACE',
          payload: { name, rootPath },
        });
        
        // Simular carregamento de arquivos do workspace
        loadMockFiles(rootPath);
      }
    } catch (error) {
      console.error('Erro ao carregar workspace do localStorage:', error);
    }
  }, []);

  // Mock function to load files
  const loadMockFiles = useCallback(async (rootPath: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulação de carga de arquivos
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const rootId = 'root';
      const srcId = 'src';
      const componentsId = 'components';
      const contextId = 'context';
      const servicesId = 'services';

      const mockFiles: Record<string, FileNode> = {
        [rootId]: { id: rootId, name: 'VibeForge', path: rootPath, type: 'directory', parent: null, children: ['package.json', 'tsconfig.json', srcId, 'README.md'], lastModified: new Date().toISOString() },
        'package.json': { id: 'package.json', name: 'package.json', path: `${rootPath}/package.json`, type: 'file', parent: rootId, extension: 'json', lastModified: new Date().toISOString() },
        'tsconfig.json': { id: 'tsconfig.json', name: 'tsconfig.json', path: `${rootPath}/tsconfig.json`, type: 'file', parent: rootId, extension: 'json', lastModified: new Date().toISOString() },
        'README.md': { id: 'README.md', name: 'README.md', path: `${rootPath}/README.md`, type: 'file', parent: rootId, extension: 'md', lastModified: new Date().toISOString() },
        [srcId]: { id: srcId, name: 'src', path: `${rootPath}/src`, type: 'directory', parent: rootId, children: [componentsId, contextId, servicesId, 'index.ts'], lastModified: new Date().toISOString() },
        'index.ts': { id: 'index.ts', name: 'index.ts', path: `${rootPath}/src/index.ts`, type: 'file', parent: srcId, extension: 'ts', lastModified: new Date().toISOString() },
        [componentsId]: { id: componentsId, name: 'components', path: `${rootPath}/src/components`, type: 'directory', parent: srcId, children: ['Button.tsx'], lastModified: new Date().toISOString() },
        'Button.tsx': { id: 'Button.tsx', name: 'Button.tsx', path: `${rootPath}/src/components/Button.tsx`, type: 'file', parent: componentsId, extension: 'tsx', lastModified: new Date().toISOString() },
        [contextId]: { id: contextId, name: 'context', path: `${rootPath}/src/context`, type: 'directory', parent: srcId, children: ['ThemeContext.tsx'], lastModified: new Date().toISOString() },
        'ThemeContext.tsx': { id: 'ThemeContext.tsx', name: 'ThemeContext.tsx', path: `${rootPath}/src/context/ThemeContext.tsx`, type: 'file', parent: contextId, extension: 'tsx', lastModified: new Date().toISOString() },
        [servicesId]: { id: servicesId, name: 'services', path: `${rootPath}/src/services`, type: 'directory', parent: srcId, children: ['api.service.ts'], lastModified: new Date().toISOString() },
        'api.service.ts': { id: 'api.service.ts', name: 'api.service.ts', path: `${rootPath}/src/services/api.service.ts`, type: 'file', parent: servicesId, extension: 'ts', lastModified: new Date().toISOString() },
      };

      dispatch({ type: 'SET_FILES', payload: mockFiles });
      dispatch({ type: 'SET_ROOT_DIRECTORY', payload: rootId });

    } catch (error: any) {
      console.error('Erro ao carregar arquivos mock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar arquivos.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      errorManager.captureError(error, {
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.FILE_SYSTEM,
        context: { action: 'loadMockFiles' },
        userFriendlyMessage: errorMessage
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const openWorkspace = useCallback(async (name: string, rootPath: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        await loadMockFiles(rootPath);
        dispatch({
            type: 'SET_WORKSPACE',
            payload: { name, rootPath },
        });
        localStorage.setItem('vf-workspace', JSON.stringify({ name, rootPath }));
    } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Falha ao abrir workspace' });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
}, [dispatch, loadMockFiles]);

  const openFile = useCallback(async (fileId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const file = state.files[fileId];
      
      if (!file) {
        throw new Error(`Arquivo com ID ${fileId} não encontrado`);
      }
      
      // Mostrar feedback de operação iniciada
      if (feedbackHandlers.current.addOperation) {
        feedbackHandlers.current.addOperation({
          type: 'open',
          filePath: file.path,
          fileName: file.name,
          status: 'pending'
        });
      }
      
      // Log da operação
      Logger.info(`[WorkspaceContext] Opening file: ${file.path}`);
      
      // Read actual file content instead of mock
      const fileContent = await fileSystemService.readFile(file.path);
      // Extract content string from the FileContent object
      const content = fileContent.content;
      
      // Identificar linguagem baseado na extensão
      const language = getLanguageFromExtension(file.extension || '');
      
      // Criar objeto de arquivo aberto
      const openFile: OpenFile = {
        id: uuidv4(),
        fileId,
        content,
        path: file.path,
        name: file.name,
        isDirty: false,
        language,
        lastModified: new Date().toISOString(),
      };
      
      // Adicionar ao estado
      dispatch({
        type: 'OPEN_FILE',
        payload: openFile,
      });
      
      // Adicionar à lista de recentes
      dispatch({
        type: 'ADD_RECENT_FILE',
        payload: fileId,
      });
      
      // Abrir aba no UI
      const tab: UIStateOpenTab = {
        id: openFile.id,
        type: 'file',
        title: file.name,
        path: file.path,
        icon: '', // Pode ser definido baseado no tipo de arquivo
        data: {
          fileId,
          language,
        },
      };
      
      openTab(tab);
      setActiveTab(tab.id);
      
      // Mostrar feedback de sucesso
      if (feedbackHandlers.current.updateOperation) {
        feedbackHandlers.current.updateOperation(file.path, 'open', 'success');
        
        // Remover o feedback após um tempo
        setTimeout(() => {
          if (feedbackHandlers.current.removeOperation) {
            feedbackHandlers.current.removeOperation(file.path, 'open');
          }
        }, 3000);
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      Logger.error('[WorkspaceContext] Erro ao abrir arquivo:', error);
      
      errorManager.captureError(error, {
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.FILE_SYSTEM,
        context: { fileId, action: 'open' },
        userFriendlyMessage: `Erro ao abrir arquivo.`
      });
      
      // Mostrar feedback de erro
      if (feedbackHandlers.current.updateOperation && state.files[fileId]) {
        feedbackHandlers.current.updateOperation(
          state.files[fileId].path, 
          'open', 
          'error', 
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  }, [state.files, openTab, setActiveTab, fileSystemService]);

  const closeFile = useCallback((fileId: string) => {
    // Apenas despacha a action para remover do estado do workspace
    dispatch({ type: 'CLOSE_FILE', payload: fileId });
    // <<< Chamar closeTab do UIStateContext >>>
    closeTab(fileId); // Usa o mesmo ID
  }, [closeTab]);

  const saveFile = useCallback(async (fileId: string, content: string): Promise<boolean> => {
    const openFileInstance = state.openFiles.find(f => f.id === fileId);
    if (!openFileInstance) {
        dispatch({ type: 'SET_ERROR', payload: 'Arquivo não está aberto para salvar.'});
        return false;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
        // Add feedback for operation starting
        if (feedbackHandlers.current.addOperation) {
            feedbackHandlers.current.addOperation({
                filePath: openFileInstance.path,
                fileName: openFileInstance.name,
                type: 'save',
                status: 'pending'
            });
        }

        // Use actual file system service using saveFile with proper options
        await fileSystemService.saveFile({
            path: openFileInstance.path, 
            content: content
        });

        dispatch({ type: 'SET_FILE_DIRTY', payload: { id: fileId, isDirty: false } });
        dispatch({ 
            type: 'UPDATE_OPEN_FILE', 
            payload: { id: fileId, updates: { content, isDirty: false, lastModified: new Date().toISOString() } } 
        });
        dispatch({ 
            type: 'UPDATE_FILE', 
            payload: { id: openFileInstance.fileId, updates: { lastModified: new Date().toISOString() } } 
        });
        
        updateTab({ id: fileId, dirty: false });

        if (feedbackHandlers.current.updateOperation) {
          feedbackHandlers.current.updateOperation(openFileInstance.path, 'save', 'success');
          setTimeout(() => {
            if (feedbackHandlers.current.removeOperation) {
              feedbackHandlers.current.removeOperation(openFileInstance.path, 'save');
            }
          }, 3000);
        }
        return true;
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        dispatch({ type: 'SET_ERROR', payload: `Falha ao salvar arquivo: ${errorMessage}` });
        if (feedbackHandlers.current.updateOperation) {
            feedbackHandlers.current.updateOperation(openFileInstance.path, 'save', 'error', errorMessage);
        }
        errorManager.captureError(error, {
            severity: ErrorSeverity.ERROR,
            source: ErrorSource.FILE_SYSTEM,
            context: { fileId: openFileInstance.fileId, action: 'save' },
            userFriendlyMessage: `Falha ao salvar o arquivo ${openFileInstance.name}.`
        });
        return false;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.openFiles, dispatch, fileSystemService, updateTab]);

  const createFile = useCallback(async (path: string, name: string, content: string = ''): Promise<string | null> => {
     dispatch({ type: 'SET_LOADING', payload: true });
     dispatch({ type: 'SET_ERROR', payload: null });
     
     // Registrar operação no feedback
     if (feedbackHandlers.current.addOperation) {
       feedbackHandlers.current.addOperation({
         path: `${path}/${name}`,
         operation: 'create',
         status: 'pending'
       });
     }
     
     try {
        // Chamar o serviço real de sistema de arquivos em vez de mock
        const fullPath = `${path}/${name}`;
        await fileSystemService.saveFile({
          path: fullPath,
          content: content
        });
         
        const newFileId = `${name}-${uuidv4().substring(0,4)}`;
        const newFileNode: FileNode = {
            id: newFileId,
            name: name,
            path: fullPath,
            type: 'file',
            parent: path,
            extension: name.includes('.') ? name.split('.').pop() : '',
            lastModified: new Date().toISOString(),
            content: content,
        };
        dispatch({ type: 'ADD_FILE', payload: newFileNode });
        const parentNode = Object.values(state.files).find(f => f.path === path && f.type === 'directory');
        if(parentNode) {
            dispatch({ 
                type: 'UPDATE_FILE', 
                payload: { id: parentNode.id, updates: { children: [...(parentNode.children || []), newFileId] } }
            });
        }
         
        // Atualizar feedback para success
        if (feedbackHandlers.current.updateOperation) {
          feedbackHandlers.current.updateOperation(fullPath, 'create', 'success');
          setTimeout(() => {
            if (feedbackHandlers.current.removeOperation) {
              feedbackHandlers.current.removeOperation(fullPath, 'create');
            }
          }, 3000);
        }
         
        return newFileId;
     } catch (error: any) {
         dispatch({ type: 'SET_ERROR', payload: `Falha ao criar arquivo: ${error.message || 'Erro desconhecido'}` });
         
         // Atualizar feedback para error
         if (feedbackHandlers.current.updateOperation) {
           feedbackHandlers.current.updateOperation(
             `${path}/${name}`, 
             'create', 
             'error', 
             error.message || 'Erro desconhecido'
           );
         }
         
         errorManager.captureError(error, {
           severity: ErrorSeverity.ERROR,
           source: ErrorSource.FILE_SYSTEM,
           context: { path, name, action: 'create_file' },
           userFriendlyMessage: `Falha ao criar o arquivo ${name}.`
         });
         
         return null;
     } finally {
         dispatch({ type: 'SET_LOADING', payload: false });
     }
  }, [dispatch, state.files, fileSystemService]);

  const createDirectory = useCallback(async (path: string, name: string): Promise<string | null> => {
     dispatch({ type: 'SET_LOADING', payload: true });
     dispatch({ type: 'SET_ERROR', payload: null });
     
     // Registrar operação no feedback
     if (feedbackHandlers.current.addOperation) {
       feedbackHandlers.current.addOperation({
         path: `${path}/${name}`,
         operation: 'create',
         status: 'pending'
       });
     }
     
     try {
        // Chamar o serviço real de sistema de arquivos em vez de mock
        const fullPath = `${path}/${name}`;
        await fileSystemService.createDirectory({
          path: fullPath
        });
         
        const newDirId = `${name}-dir-${uuidv4().substring(0,4)}`;
        const newDirNode: FileNode = {
            id: newDirId,
            name: name,
            path: fullPath,
            type: 'directory',
            parent: path,
            children: [],
            lastModified: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_FILE', payload: newDirNode });
        const parentNode = Object.values(state.files).find(f => f.path === path && f.type === 'directory');
        if(parentNode) {
             dispatch({ 
                type: 'UPDATE_FILE', 
                payload: { id: parentNode.id, updates: { children: [...(parentNode.children || []), newDirId] } }
            });
        }
         
        // Atualizar feedback para success
        if (feedbackHandlers.current.updateOperation) {
          feedbackHandlers.current.updateOperation(fullPath, 'create', 'success');
          setTimeout(() => {
            if (feedbackHandlers.current.removeOperation) {
              feedbackHandlers.current.removeOperation(fullPath, 'create');
            }
          }, 3000);
        }
         
        return newDirId;
     } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: `Falha ao criar diretório: ${error.message || 'Erro desconhecido'}` });
        
        // Atualizar feedback para error
        if (feedbackHandlers.current.updateOperation) {
          feedbackHandlers.current.updateOperation(
            `${path}/${name}`, 
            'create', 
            'error', 
            error.message || 'Erro desconhecido'
          );
        }
        
        errorManager.captureError(error, {
          severity: ErrorSeverity.ERROR,
          source: ErrorSource.FILE_SYSTEM,
          context: { path, name, action: 'create_directory' },
          userFriendlyMessage: `Falha ao criar o diretório ${name}.`
        });
        
        return null;
     } finally {
         dispatch({ type: 'SET_LOADING', payload: false });
     }
  }, [dispatch, state.files, fileSystemService]);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    const fileNode = state.files[fileId];
    if (!fileNode) {
        dispatch({ type: 'SET_ERROR', payload: 'Arquivo não encontrado para deletar.'});
        return false;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    // Add feedback for operation
    if (feedbackHandlers.current.addOperation) {
        feedbackHandlers.current.addOperation({
            filePath: fileNode.path,
            fileName: fileNode.name,
            type: 'delete',
            status: 'pending'
        });
    }
    
    try {
        // Delete actual file using file system service
        if (fileNode.type === 'file') {
            await fileSystemService.deleteFile(fileNode.path);
        } else {
            // For directories, use recursive delete option
            await fileSystemService.deleteFile(fileNode.path, true);
        }
        
        dispatch({ type: 'DELETE_FILE', payload: fileId });
        const openInstance = state.openFiles.find(f => f.fileId === fileId);
        if (openInstance) {
            dispatch({ type: 'CLOSE_FILE', payload: openInstance.id });
            closeTab(openInstance.id);
        }
        
        if(fileNode.parent) {
            const parentNode = Object.values(state.files).find(f => f.path === fileNode.parent && f.type === 'directory');
            if(parentNode && parentNode.children) {
                 dispatch({ 
                    type: 'UPDATE_FILE', 
                    payload: { id: parentNode.id, updates: { children: parentNode.children.filter(id => id !== fileId) } }
                });
            }
        }
        
        // Show success feedback
        if (feedbackHandlers.current.updateOperation) {
            feedbackHandlers.current.updateOperation(fileNode.path, 'delete', 'success');
            
            // Remove feedback after a delay
            setTimeout(() => {
                if (feedbackHandlers.current.removeOperation) {
                    feedbackHandlers.current.removeOperation(fileNode.path, 'delete');
                }
            }, 3000);
        }
        
        return true;
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        dispatch({ type: 'SET_ERROR', payload: `Falha ao deletar: ${errorMessage}` });
        
        // Show error feedback
        if (feedbackHandlers.current.updateOperation) {
            feedbackHandlers.current.updateOperation(
                fileNode.path,
                'delete',
                'error',
                errorMessage
            );
        }
        
        errorManager.captureError(error, {
            severity: ErrorSeverity.ERROR,
            source: ErrorSource.FILE_SYSTEM,
            context: { fileId, action: 'delete' },
            userFriendlyMessage: `Falha ao deletar ${fileNode.type === 'file' ? 'arquivo' : 'diretório'} ${fileNode.name}.`
        });
        
        return false;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.files, state.openFiles, dispatch, fileSystemService, closeTab]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    dispatch({ 
        type: 'UPDATE_OPEN_FILE', 
        payload: { id: fileId, updates: { content, isDirty: true } } 
    });
    // Corrected: Use 'dirty' for updateTab
    updateTab({ id: fileId, dirty: true });
  }, [dispatch, updateTab]);

  const memoizedFileTree = useMemo((): TreeFileNode[] => {
    if (!state.rootDirectory || !state.files[state.rootDirectory]) {
      return [];
    }
    const buildTreeRecursive = (nodeId: string): TreeFileNode => {
      const nodeDetails = state.files[nodeId];
      if (!nodeDetails) {
        console.error(`[WorkspaceContext] Node with id ${nodeId} not found while building tree.`);
        // Return a valid TreeFileNode structure for error case
        const { children, ...restOfErrorNode } = { id: nodeId, name: 'Error: Missing Node', path: '', type: 'file' as 'file' | 'directory', parent: null, children: undefined }; 
        return restOfErrorNode;
      }

      const { children: childIds, ...restOfNode } = nodeDetails;

      if (restOfNode.type === 'directory' && childIds && childIds.length > 0) {
        return {
          ...restOfNode,
          children: childIds.map(childId => buildTreeRecursive(childId))
                            .sort((a, b) => {
                               if (a.type === 'directory' && b.type === 'file') return -1;
                               if (a.type === 'file' && b.type === 'directory') return 1;
                               return a.name.localeCompare(b.name);
                             }),
        };
      }
      // For files or empty directories
      return { ...restOfNode, children: restOfNode.type === 'directory' ? [] : undefined }; 
    };
    return [buildTreeRecursive(state.rootDirectory)];
  }, [state.files, state.rootDirectory]);

  const getFileTreeCallback = useCallback(() => memoizedFileTree, [memoizedFileTree]);

  // <<< Add useEffect to check URL parameters on mount >>>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialWorkspacePath = params.get('workspace');

    if (initialWorkspacePath) {
      try {
        const decodedPath = decodeURIComponent(initialWorkspacePath);
        console.log(`[WorkspaceContext] Found initial workspace path in URL: ${decodedPath}`);
        // Extract name from path for simplicity, or use a default name
        const name = decodedPath.split(/[\\/]/).pop() || 'Workspace Carregado'; 
        openWorkspace(name, decodedPath)
          .catch(err => {
            console.error(`[WorkspaceContext] Failed to auto-open workspace from URL: ${decodedPath}`, err);
            // Optionally set an error state or show a toast
          });
      } catch (error) {
        console.error('[WorkspaceContext] Failed to decode workspace path from URL', error);
      }
    } else {
      console.log('[WorkspaceContext] No initial workspace path found in URL.');
      // Allow default loading logic (e.g., from localStorage) to proceed if implemented elsewhere
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Valor do contexto
  const contextValue: WorkspaceContextType = {
    state,
    openWorkspace,
    openFile,
    closeFile,
    saveFile,
    createFile,
    createDirectory,
    deleteFile,
    updateFileContent,
    getFileTree: getFileTreeCallback,
    registerFeedbackHandlers
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// Hook para usar o contexto
export const useWorkspace = (): WorkspaceContextType => {
  const context = React.useContext(WorkspaceContext);
  
  if (!context) {
    throw new Error('useWorkspace deve ser usado dentro de um WorkspaceProvider');
  }
  
  return context;
};

// Utility function (deve ser movida para utils/languageUtils.ts ou similar no futuro)
function getLanguageFromExtension(extension: string): string {
  const ext = extension.toLowerCase();
  switch (ext) {
    case 'js': return 'javascript';
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'c': return 'c';
    case 'cpp': return 'cpp';
    case 'cs': return 'csharp';
    case 'go': return 'go';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'rs': return 'rust';
    case 'swift': return 'swift';
    case 'kt': return 'kotlin';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'scss': return 'scss';
    case 'less': return 'less';
    case 'json': return 'json';
    case 'xml': return 'xml';
    case 'yaml':
    case 'yml': return 'yaml';
    case 'md': return 'markdown';
    case 'sh': return 'shell';
    case 'sql': return 'sql';
    case 'dockerfile': return 'dockerfile';
    default: return 'plaintext';
  }
} 