import React from 'react';
import { useFileTree } from '../../hooks/useFileTree';
import { VirtualizedFileTree } from '../common/VirtualizedFileTree'; 
import { FileSystemNode } from '../common/FileTreeView';
import { FiLoader, FiAlertTriangle, FiRefreshCw, FiFolderMinus } from 'react-icons/fi';
import { AnimatedButton } from '../common/AnimatedButton';
import { AnimatePresence, motion } from 'framer-motion';

interface FileExplorerProps {
  rootPath: string | null;
  onFileClick: (node: FileSystemNode) => void;
  selectedFilePath: string | null; 
  className?: string; 
}

export const OptimizedFileExplorer: React.FC<FileExplorerProps> = ({
  rootPath,
  onFileClick,
  selectedFilePath, 
  className,
}) => {
  const {
    rootNode,
    isLoading,
    error,
    loadChildren, 
    expandedPaths,
    setExpandedPaths
  } = useFileTree(rootPath); 

  const headerClasses = `
    flex justify-between items-center p-2 flex-shrink-0
    border-b border-border/30 dark:border-border-dark/30
  `;
  const titleClasses = "text-xs font-semibold text-text-muted dark:text-text-darkMuted uppercase tracking-wider";

  const refreshButtonClasses = `
    p-1.5 rounded-md
    text-text-muted/80 dark:text-text-darkMuted/80
    hover:text-accent dark:hover:text-accent-dark
    hover:bg-accent/10 dark:hover:bg-accent-dark/10
    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark
  `;

  const contentAreaClasses = `
    flex-grow overflow-y-auto custom-scrollbar
    px-1 py-1
    relative min-h-[100px]
  `;

  const messageContainerClasses = "flex flex-col items-center justify-center h-full text-center p-4";
  const messageTextClasses = "text-xs text-text-muted dark:text-text-darkMuted";
  const errorMessageTextClasses = "text-xs text-red-500 dark:text-red-400";

  const handleRefresh = () => {
    if (rootPath) {
       setExpandedPaths(new Set()); 
       if (rootNode) {
         if (typeof rootNode.path === 'string') {
            loadChildren(rootNode.path); 
         } else {
            console.warn("OptimizedFileExplorer: rootNode.path is not a string, cannot refresh.")
         }
       } else {
         setExpandedPaths(new Set());
       }
    }
  };


  return (
    <div className={`h-full overflow-hidden flex flex-col bg-transparent ${className || ''}`}>
      <div className={headerClasses}>
        <h3 className={titleClasses}>Explorador</h3> 
        {rootPath && (
          <AnimatedButton
            onClick={handleRefresh}
            className={refreshButtonClasses}
            title="Atualizar Explorador"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
          </AnimatedButton>
        )}
      </div>

      <div className={contentAreaClasses}>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="explorer-loading"
              className={`${messageContainerClasses} py-10`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiLoader className="w-5 h-5 animate-spin text-accent dark:text-accent-dark mb-2" />
              <span className={messageTextClasses}>Carregando...</span>
            </motion.div>
          )}

          {!isLoading && error && (
            <motion.div
              key="explorer-error"
              className={`${messageContainerClasses} space-y-2`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <FiAlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
              <p className={errorMessageTextClasses}>
                Falha ao carregar arquivos.
              </p>
              <AnimatedButton
                onClick={handleRefresh} 
                className="border border-red-500/50 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-md text-xs font-medium"
              >
                Tentar Novamente
              </AnimatedButton>
            </motion.div>
          )}

          {!isLoading && !error && !rootPath && ( 
            <motion.div
              key="explorer-no-workspace"
              className={`${messageContainerClasses} space-y-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiFolderMinus className="w-8 h-8 text-text-muted dark:text-text-darkMuted mb-1" />
              <p className={messageTextClasses}>Nenhum workspace aberto.</p>
            </motion.div>
          )}

          {!isLoading && !error && rootPath && (!rootNode || !rootNode.children || rootNode.children.length === 0) && (
            <motion.div
              key="explorer-empty-workspace"
              className={`${messageContainerClasses} space-y-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
                <FiFolderMinus className="w-8 h-8 text-text-muted dark:text-text-darkMuted mb-1" />
                <p className={messageTextClasses}>Workspace vazio.</p>
            </motion.div>
          )}

          {!isLoading && !error && rootPath && rootNode && rootNode.children && rootNode.children.length > 0 && (
            <motion.div
              key="explorer-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <VirtualizedFileTree
                nodes={rootNode.children} 
                onFileClick={onFileClick}
                onLoadChildren={loadChildren} 
                expandedPaths={expandedPaths}
                setExpandedPaths={setExpandedPaths}
                selectedFilePath={selectedFilePath} 
                className="h-full w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}; 