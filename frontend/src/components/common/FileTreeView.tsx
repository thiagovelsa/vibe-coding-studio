import React, { useState } from 'react';
import { FiFileText, FiFolder, FiChevronRight, FiChevronDown, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { FileNode } from '../../context/WorkspaceContext'; // Importar tipo
import { AnimatedDiv } from './AnimatedDiv'; // Para hover

export interface FileSystemNode {
  id: string;          // Typically the path
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileSystemNode[]; // Children are now directly nested
  isLoading?: boolean;       // For lazy loading state
  isLoaded?: boolean;        // To track if children have been loaded
  // Add other fields like extension if needed by TreeNode
  extension?: string;
}

interface FileTreeViewProps {
  rootNode: FileSystemNode | null; // Pass the root node directly
  onFileClick: (node: FileSystemNode) => void; // Pass the whole node
  onLoadChildren: (nodePath: string) => Promise<void>; // Function to load children
}

interface TreeNodeProps {
  node: FileSystemNode;
  onFileClick: (node: FileSystemNode) => void;
  onLoadChildren: (nodePath: string) => Promise<void>;
  level: number;
  isInitiallyOpen?: boolean;
}

// Componente Recursivo para cada Nó (Arquivo/Pasta)
const TreeNode: React.FC<TreeNodeProps> = ({ 
    node, 
    onFileClick, 
    onLoadChildren,
    level, 
    isInitiallyOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(isInitiallyOpen);
    const { isDirectory, isLoading, isLoaded, children } = node;
    const indent = level * 16; // 16px de indentação por nível

    const handleToggleExpand = () => {
        if (isDirectory) {
            // Load children if it's a directory, not already loaded, and not currently loading
            if (!isLoaded && !isLoading) {
                onLoadChildren(node.path);
            }
            setIsOpen(!isOpen);
        }
    };

    const handleNodeClick = () => {
        if (!isDirectory) {
            onFileClick(node);
        } else {
            // Allow clicking the directory name itself to also toggle expand
            handleToggleExpand();
        }
    };

    // Determine icons
    let IconComponent = isDirectory ? FiFolder : FiFileText;
    const ChevronIcon = isOpen ? FiChevronDown : FiChevronRight;
    const iconColor = isDirectory 
        ? 'text-yellow-500 dark:text-yellow-400' 
        : 'text-blue-500 dark:text-blue-400'; // Example colors

    return (
        <div className="text-sm">
            <AnimatedDiv
                className="flex items-center py-1 px-2 rounded cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group relative"
                style={{ paddingLeft: `${indent + 8}px` }} 
                onClick={handleNodeClick}
                whileHover="hoverSlightBg" 
            >
                {/* Chevron for directories */}
                {isDirectory && (
                    <button 
                       onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }} 
                       className="mr-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 absolute left-1 group-hover:opacity-100 opacity-0 transition-opacity"
                       style={{ left: `${indent}px`}} // Position chevron based on indent
                       aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      <ChevronIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                )}
                
                {/* Loading Spinner */}
                {isLoading && (
                    <FiLoader className={`w-3.5 h-3.5 mr-1 flex-shrink-0 animate-spin ${iconColor}`} />
                )}
                
                {/* File/Folder Icon (hide if loading) */}
                {!isLoading && (
                    <IconComponent className={`w-4 h-4 mr-1 flex-shrink-0 ${iconColor}`} />
                )}

                <span className="truncate" title={node.path}>{node.name}</span>
            </AnimatedDiv>

            {/* Renderizar filhos se for um diretório aberto e tiver filhos */}
            <AnimatePresence initial={false}>
                {isDirectory && isOpen && children && children.length > 0 && (
                    <motion.div
                        key={`${node.id}-children`}
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        {children
                             // Ordenar: pastas primeiro, depois arquivos, alfabeticamente
                            .slice() // Create a shallow copy before sorting to avoid mutating prop
                            .sort((a, b) => {
                                if (a.isDirectory !== b.isDirectory) {
                                    return a.isDirectory ? -1 : 1;
                                }
                                return a.name.localeCompare(b.name);
                            })
                            .map(childNode => (
                                <TreeNode
                                    key={childNode.id}
                                    node={childNode}
                                    onFileClick={onFileClick}
                                    onLoadChildren={onLoadChildren} // Pass down loader
                                    level={level + 1}
                                    // isInitiallyOpen={false} // Sub-nodes default to closed
                                />
                            ))}
                    </motion.div>
                )}
                 {/* Optional: Show empty message if directory is loaded but has no children */}
                 {isDirectory && isOpen && isLoaded && (!children || children.length === 0) && (
                     <div style={{ paddingLeft: `${indent + 24}px` }} className="text-xs italic text-gray-400 dark:text-gray-500 py-0.5">
                         (vazio)
                     </div>
                 )}
            </AnimatePresence>
        </div>
    );
};

// Componente Principal da Árvore de Arquivos
export const FileTreeView: React.FC<FileTreeViewProps> = ({ 
    rootNode, 
    onFileClick, 
    onLoadChildren 
}) => {
    if (!rootNode) {
        // Display managed by Sidebar (loading/error/empty states)
        return null; 
    }

    return (
        <div>
            {/* Renderiza a raiz e seus descendentes */}
            <TreeNode
                node={rootNode}
                onFileClick={onFileClick}
                onLoadChildren={onLoadChildren}
                level={0}
                isInitiallyOpen={true} // Expand root by default
            />
        </div>
    );
};

// export default FileTreeView; // Descomente se necessário 