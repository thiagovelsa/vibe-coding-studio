import React from 'react';
import { DraggableItem } from './DraggableItem';
import { FiFile, FiFolder, FiFileText, FiCode, FiImage, FiGrip } from 'react-icons/fi';
import { getFileIconByExtension } from '../../utils/fileUtils';

interface FileItemDraggableProps {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  lastModified?: string;
  onDragStart?: (id: string, type: string, data?: any) => void;
  onDragEnd?: (id: string, type: string, dropped: boolean, data?: any) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
  className?: string;
  showIcon?: boolean;
  showDragHandle?: boolean;
  compact?: boolean;
}

export const FileItemDraggable: React.FC<FileItemDraggableProps> = ({
  id,
  name,
  path,
  type,
  extension,
  size,
  lastModified,
  onDragStart,
  onDragEnd,
  onClick,
  onDoubleClick,
  isSelected = false,
  className = '',
  showIcon = true,
  showDragHandle = false,
  compact = false
}) => {
  // Dados para arrastar
  const dragData = {
    id,
    name,
    path,
    type,
    extension,
    size,
    lastModified
  };
  
  // Objeto de propriedades comuns
  const fileProps = {
    id,
    type: `file-${type}`, // Tipo para o sistema de drag and drop: file-file ou file-directory
    data: dragData,
    onDragStart,
    onDragEnd,
    className: `group cursor-pointer select-none 
              ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800/30'} 
              ${className}`,
    dragIndicator: showDragHandle ? <FiGrip size={16} /> : undefined,
    preview: renderFilePreview()
  };
  
  // Renderizar ícone do arquivo baseado no tipo/extensão
  function getFileIcon() {
    if (type === 'directory') {
      return <FiFolder className="text-yellow-500 dark:text-yellow-400" />;
    }
    
    if (extension) {
      const IconComponent = getFileIconByExtension(extension);
      if (IconComponent) {
        return <IconComponent className="text-blue-500 dark:text-blue-400" />;
      }
    }
    
    return <FiFile className="text-blue-500 dark:text-blue-400" />;
  }
  
  // Preview durante o arrasto
  function renderFilePreview() {
    return (
      <div className="flex items-center justify-center w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex flex-col items-center justify-center p-1">
          {getFileIcon()}
          <span className="text-xs truncate max-w-[60px] mt-1">{name}</span>
        </div>
      </div>
    );
  }
  
  return (
    <DraggableItem {...fileProps}>
      <div 
        className={`flex items-center p-2 ${compact ? 'py-1' : 'py-2'} rounded-md`}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        {showIcon && (
          <div className="flex-shrink-0 mr-2 text-lg">
            {getFileIcon()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
            {name}
          </p>
          
          {!compact && lastModified && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(lastModified).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {!compact && type === 'file' && size !== undefined && (
          <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {formatFileSize(size)}
          </div>
        )}
      </div>
    </DraggableItem>
  );
};

// Componente para uma lista de arquivos arrastáveis
interface FileListDraggableProps {
  files: Array<{
    id: string;
    name: string;
    path: string;
    type: 'file' | 'directory';
    extension?: string;
    size?: number;
    lastModified?: string;
  }>;
  onFileClick?: (fileId: string) => void;
  onFileDoubleClick?: (fileId: string) => void;
  onDragStart?: (id: string, type: string, data?: any) => void;
  onDragEnd?: (id: string, type: string, dropped: boolean, data?: any) => void;
  selectedFileId?: string;
  className?: string;
  compact?: boolean;
}

export const FileListDraggable: React.FC<FileListDraggableProps> = ({
  files,
  onFileClick,
  onFileDoubleClick,
  onDragStart,
  onDragEnd,
  selectedFileId,
  className = '',
  compact = false
}) => {
  // Ordenar: diretórios primeiro, depois arquivos - ambos em ordem alfabética
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
  
  return (
    <div className={`space-y-1 ${className}`}>
      {sortedFiles.map(file => (
        <FileItemDraggable
          key={file.id}
          id={file.id}
          name={file.name}
          path={file.path}
          type={file.type}
          extension={file.extension}
          size={file.size}
          lastModified={file.lastModified}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onClick={() => onFileClick && onFileClick(file.id)}
          onDoubleClick={() => onFileDoubleClick && onFileDoubleClick(file.id)}
          isSelected={selectedFileId === file.id}
          compact={compact}
        />
      ))}
    </div>
  );
};

// Utilidades
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 