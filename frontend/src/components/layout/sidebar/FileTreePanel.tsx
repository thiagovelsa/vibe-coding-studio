import React, { useState, useEffect, useCallback, useContext } from 'react';
import { WorkspaceContext, FileNode, useWorkspace } from '../../../context/WorkspaceContext';
import { useFileSystemService } from '../../../services/file-system.service';
import { CollapsibleSection } from '../../common/CollapsibleSection';
import { OptimizedFileExplorer } from '../OptimizedFileExplorer';
import { FiLoader } from 'react-icons/fi';

interface MinimalFileSystemNode {
  id: string;
  path: string;
}

interface FileTreePanelProps {
  className?: string;
}

const FileTreePanel: React.FC<FileTreePanelProps> = React.memo(({ className }) => {
  const { state: workspaceState, openFile } = useWorkspace();
  
  const handleFileSelect = useCallback((node: MinimalFileSystemNode) => {
    const fileNodeToOpen = Object.values(workspaceState.files).find((f: FileNode) => f.path === node.path);
    if (fileNodeToOpen) {
      openFile(fileNodeToOpen.id);
    } else {
      console.warn(`FileTreePanel: Não foi possível encontrar FileNode para o path: ${node.path}`);
    }
  }, [openFile, workspaceState.files]);

  const messageContainerClasses = "p-4 text-center flex flex-col items-center justify-center h-full";
  const loadingTextClasses = "text-sm text-text-muted dark:text-text-darkMuted flex items-center";

  return (
    <div
      className={`h-full flex flex-col ${className || ''}`}
      role="region"
      aria-label="Explorador de Arquivos"
    >
      <CollapsibleSection
        title={workspaceState.name || "Workspace"}
        defaultOpen={true}
        panelClassName="pt-1 pb-0 px-0"
        className="flex-shrink-0"
      />

      <div className="flex-grow overflow-hidden relative">
        {workspaceState.rootPath ? (
          <OptimizedFileExplorer
            rootPath={workspaceState.rootPath}
            onFileClick={handleFileSelect}
          />
        ) : (
          <div className={messageContainerClasses}>
            <span className={loadingTextClasses}>Nenhum workspace aberto.</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default FileTreePanel; 