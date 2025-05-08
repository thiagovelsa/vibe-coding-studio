import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSave, FiFile, FiFolder, FiTrash2, FiCheck, FiX, FiLoader } from 'react-icons/fi';

export type FileOperation = 'save' | 'open' | 'create' | 'delete' | 'rename' | 'upload' | 'download';
export type OperationStatus = 'pending' | 'success' | 'error';

interface FileOperationInfo {
  type: FileOperation;
  filePath: string;
  fileName: string;
  status: OperationStatus;
  error?: string;
}

interface FileFeedbackProps {
  operation: FileOperationInfo;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number;
  onComplete?: () => void;
}

export const FileFeedback: React.FC<FileFeedbackProps> = ({
  operation,
  position = 'bottom-right',
  duration = 3000,
  onComplete
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (operation.status === 'pending') return; // Não fecha automaticamente se estiver pendente
    
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [operation.status, duration]);

  useEffect(() => {
    // Reset visibility when operation changes
    setVisible(true);
  }, [operation]);

  const handleAnimationComplete = () => {
    if (!visible && onComplete) {
      onComplete();
    }
  };

  // Posicionamento
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // Obter ícone para a operação
  const getOperationIcon = () => {
    switch (operation.type) {
      case 'save':
        return <FiSave className="w-5 h-5" />;
      case 'open':
        return <FiFile className="w-5 h-5" />;
      case 'create':
        return <FiFile className="w-5 h-5" />;
      case 'delete':
        return <FiTrash2 className="w-5 h-5" />;
      case 'rename':
        return <FiFile className="w-5 h-5" />;
      case 'upload':
        return <FiFile className="w-5 h-5" />;
      case 'download':
        return <FiFile className="w-5 h-5" />;
      default:
        return <FiFile className="w-5 h-5" />;
    }
  };

  // Obter ícone de status
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'success':
        return <FiCheck className="w-4 h-4 text-green-500" />;
      case 'error':
        return <FiX className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <FiLoader className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  // Mensagem da operação
  const getMessage = () => {
    const fileName = operation.fileName;
    
    switch (operation.type) {
      case 'save':
        return operation.status === 'success' 
          ? `Arquivo "${fileName}" salvo com sucesso`
          : operation.status === 'error'
            ? `Erro ao salvar "${fileName}"`
            : `Salvando "${fileName}"...`;
      
      case 'open':
        return operation.status === 'success'
          ? `Arquivo "${fileName}" aberto`
          : operation.status === 'error'
            ? `Erro ao abrir "${fileName}"`
            : `Abrindo "${fileName}"...`;
      
      case 'create':
        return operation.status === 'success'
          ? `Arquivo "${fileName}" criado`
          : operation.status === 'error'
            ? `Erro ao criar "${fileName}"`
            : `Criando "${fileName}"...`;
      
      case 'delete':
        return operation.status === 'success'
          ? `Arquivo "${fileName}" excluído`
          : operation.status === 'error'
            ? `Erro ao excluir "${fileName}"`
            : `Excluindo "${fileName}"...`;
      
      case 'rename':
        return operation.status === 'success'
          ? `Arquivo renomeado para "${fileName}"`
          : operation.status === 'error'
            ? `Erro ao renomear para "${fileName}"`
            : `Renomeando para "${fileName}"...`;
      
      case 'upload':
        return operation.status === 'success'
          ? `Arquivo "${fileName}" enviado`
          : operation.status === 'error'
            ? `Erro ao enviar "${fileName}"`
            : `Enviando "${fileName}"...`;
      
      case 'download':
        return operation.status === 'success'
          ? `Arquivo "${fileName}" baixado`
          : operation.status === 'error'
            ? `Erro ao baixar "${fileName}"`
            : `Baixando "${fileName}"...`;
      
      default:
        return operation.status === 'error'
          ? `Erro na operação do arquivo`
          : `Processando arquivo...`;
    }
  };

  // Estilização baseada no status
  const getStatusClasses = () => {
    switch (operation.status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50 text-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200';
      case 'pending':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed z-50 ${positionClasses[position]} ${getStatusClasses()} border rounded-lg shadow-md max-w-sm`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={handleAnimationComplete}
        >
          <div className="flex items-center p-3">
            <div className="flex-shrink-0 mr-3">
              {getOperationIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {getMessage()}
              </p>
              {operation.error && operation.status === 'error' && (
                <p className="text-xs mt-1 truncate text-red-500">
                  {operation.error}
                </p>
              )}
            </div>
            <div className="ml-3 flex-shrink-0">
              {getStatusIcon()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para gerenciar facilmente o estado do feedback de arquivo
export const useFileFeedback = (initialDuration = 3000) => {
  const [operations, setOperations] = useState<FileOperationInfo[]>([]);

  const addOperation = (operation: FileOperationInfo) => {
    // Adiciona operação ao estado, removendo operações duplicadas para o mesmo arquivo e tipo
    setOperations(prevOperations => {
      const filteredOperations = prevOperations.filter(
        op => !(op.filePath === operation.filePath && op.type === operation.type)
      );
      return [...filteredOperations, operation];
    });
  };

  const updateOperation = (filePath: string, type: FileOperation, status: OperationStatus, error?: string) => {
    setOperations(prevOperations => 
      prevOperations.map(op => 
        op.filePath === filePath && op.type === type
          ? { ...op, status, error }
          : op
      )
    );
  };

  const removeOperation = (filePath: string, type: FileOperation) => {
    setOperations(prevOperations => 
      prevOperations.filter(op => !(op.filePath === filePath && op.type === type))
    );
  };

  // Helpers para criar operações comuns
  const startSaveOperation = (filePath: string, fileName: string) => {
    addOperation({
      type: 'save',
      filePath,
      fileName,
      status: 'pending'
    });
  };

  const completeSaveOperation = (filePath: string, success: boolean, error?: string) => {
    updateOperation('save', filePath, success ? 'success' : 'error', error);
  };

  return {
    operations,
    addOperation,
    updateOperation,
    removeOperation,
    startSaveOperation,
    completeSaveOperation
  };
}; 