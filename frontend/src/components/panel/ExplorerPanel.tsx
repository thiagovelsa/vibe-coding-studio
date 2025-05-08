import React, { useState } from 'react';
import { FiFolder, FiFile, FiFolderPlus, FiFilePlus, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { Logger } from '../../utils/Logger';

// Definição de tipos
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  expanded?: boolean;
  children?: FileItem[];
}

interface ExplorerPanelProps {
  // Props específicas do painel explorador podem ser adicionadas aqui
}

const ExplorerPanel: React.FC<ExplorerPanelProps> = () => {
  // Idealmente, buscaríamos os arquivos do workspace via contexto
  // Por enquanto, usamos dados mockados
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      path: '/src',
      expanded: true,
      children: [
        {
          id: '2',
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx'
        },
        {
          id: '3',
          name: 'main.tsx',
          type: 'file',
          path: '/src/main.tsx'
        },
        {
          id: '4',
          name: 'index.css',
          type: 'file',
          path: '/src/index.css'
        }
      ]
    },
    {
      id: '5',
      name: 'package.json',
      type: 'file',
      path: '/package.json'
    },
    {
      id: '6',
      name: 'README.md',
      type: 'file',
      path: '/README.md'
    }
  ]);

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'file') {
      Logger.info('Arquivo clicado:', item);
      // Implementar lógica para abrir arquivo via WorkspaceContext
    } else {
      // Toggle da expansão da pasta
      setFiles(prevFiles => toggleFolderExpanded(prevFiles, item.id));
    }
  };

  // Função para alternar o estado de expansão das pastas
  const toggleFolderExpanded = (items: FileItem[], id: string): FileItem[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, expanded: !item.expanded };
      }
      if (item.children) {
        return {
          ...item,
          children: toggleFolderExpanded(item.children, id)
        };
      }
      return item;
    });
  };

  // Função para renderizar cada item (arquivo ou pasta)
  const renderItem = (item: FileItem, level = 0): React.ReactNode => {
    const paddingLeft = `${level * 12}px`;
    const isFolder = item.type === 'folder';
    
    return (
      <React.Fragment key={item.id}>
        <div 
          className="flex items-center py-1 px-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-sm group"
          style={{ paddingLeft }}
          onClick={() => handleItemClick(item)}
        >
          <span className="mr-1 text-gray-500">
            {isFolder && (
              item.expanded ? 
                <FiChevronDown size={14} className="transform transition-transform" /> : 
                <FiChevronRight size={14} className="transform transition-transform" />
            )}
          </span>
          
          <span className="mr-1">
            {isFolder ? 
              <FiFolder size={14} className="text-blue-400" /> : 
              <FiFile size={14} className="text-gray-400" />}
          </span>
          
          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
            {item.name}
          </span>
        </div>
        
        {isFolder && item.expanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          VibeForge IDE
        </span>
        <div className="flex space-x-1">
          <button 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            title="Nova pasta"
          >
            <FiFolderPlus size={14} />
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            title="Novo arquivo"
          >
            <FiFilePlus size={14} />
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        {files.map(file => renderItem(file))}
      </div>
    </div>
  );
};

export default ExplorerPanel; 