import { useContext } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';

/**
 * Hook para acessar as funcionalidades de gerenciamento de workspace
 * @returns Funções e estado para interagir com o workspace e arquivos
 */
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  
  if (!context) {
    throw new Error('useWorkspace deve ser usado dentro de um WorkspaceProvider');
  }
  
  return context;
};

/**
 * Hook para obter informações de um arquivo específico
 * @param fileId ID do arquivo
 * @returns Informações e funções relacionadas ao arquivo
 */
export function useFile(fileId: string) {
  const { state, openFile, saveFile, deleteFile, updateFileContent } = useWorkspace();
  
  // Obter informações do arquivo
  const fileNode = state.files[fileId];
  
  // Verificar se o arquivo está aberto
  const openFileInfo = state.openFiles.find(file => file.fileId === fileId);
  
  // Verificar se é o arquivo ativo
  const isActive = openFileInfo ? state.activeFileId === openFileInfo.id : false;
  
  return {
    fileNode,
    openFileInfo,
    isOpen: !!openFileInfo,
    isActive,
    isDirty: openFileInfo?.isDirty || false,
    
    // Funções específicas para o arquivo
    open: () => openFile(fileId),
    save: () => openFileInfo ? saveFile(openFileInfo.id, openFileInfo.content) : Promise.resolve(false),
    delete: () => deleteFile(fileId),
    updateContent: (content: string) => {
      if (openFileInfo) {
        updateFileContent(openFileInfo.id, content);
      }
    },
  };
} 