import React, { memo, useState, CSSProperties } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { FileSystemNode } from '../common/FileTreeView';
import { FiFolder, FiChevronRight, FiChevronDown, FiFileText, FiFile, FiDatabase, FiGitBranch, FiCode, FiImage, FiArchive, FiSettings } from 'react-icons/fi';

interface FileTreeNodeProps {
  node: FileSystemNode;
  depth: number;
  onFileClick: (node: FileSystemNode) => void;
  onLoadChildren: (nodePath: string) => Promise<void>;
  isExpanded: boolean;
  onToggleExpand: (node: FileSystemNode) => void;
  isSelected: boolean;
  style?: CSSProperties;
}

interface VirtualizedFileTreeProps {
  nodes: FileSystemNode[];
  onFileClick: (node: FileSystemNode) => void;
  onLoadChildren: (nodePath: string) => Promise<void>;
  expandedPaths: Set<string>;
  setExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFilePath: string | null;
  className?: string;
  style?: CSSProperties;
  itemHeight?: number;
}

const getFileIcon = (fileName: string, isDirectory?: boolean): React.ElementType => {
  if (isDirectory) return FiFolder;

  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return FiCode; 
    case 'js': case 'jsx': return FiCode; 
    case 'json': return FiDatabase;
    case 'md': return FiFileText;
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': return FiImage;
    case 'zip': case 'tar': case 'gz': return FiArchive;
    case 'css': case 'scss': case 'less': return FiFileText; 
    case 'html': return FiFileText;
    case 'txt': return FiFileText;
    case 'gitignore': case 'npmrc': case 'env': return FiSettings; 
    default: return FiFile;
  }
};

const FileTreeNode = memo(({
  node,
  depth,
  onFileClick,
  onLoadChildren,
  isExpanded,
  onToggleExpand,
  isSelected, 
  style
}: FileTreeNodeProps) => {

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(node);
    if (node.isDirectory && !isExpanded && !node.children?.length && !node.isLoaded) { 
      onLoadChildren(node.path);
    }
  };

  const handleClick = () => {
    if (node.isDirectory) {
      handleToggle({ stopPropagation: () => {} } as React.MouseEvent); 
    } else {
      onFileClick(node);
    }
  };

  const paddingLeft = depth * 16 + (node.isDirectory ? 0 : 16); 

  const Icon = getFileIcon(node.name, node.isDirectory);
  const ChevronIcon = isExpanded ? FiChevronDown : FiChevronRight;

  const baseNodeClasses = `
    flex items-center py-1 px-2 rounded-md cursor-pointer text-xs
    transition-colors duration-150 ease-in-out group
  `; 

  const selectedNodeClasses = isSelected
    ? 'bg-accent/20 dark:bg-accent-dark/25 text-accent dark:text-accent-dark font-medium' 
    : 'text-text-muted dark:text-text-darkMuted hover:bg-white/10 dark:hover:bg-black/15 hover:text-text dark:hover:text-text-dark';

  const iconColorClasses = isSelected
    ? 'text-accent dark:text-accent-dark'
    : 'text-text-muted/80 dark:text-text-darkMuted/80 group-hover:text-text-muted dark:group-hover:text-text-darkMuted';

  const chevronColorClasses = isSelected
    ? 'text-accent/80 dark:text-accent-dark/80'
    : 'text-text-muted/70 dark:text-text-darkMuted/70 group-hover:text-text-muted/90 dark:group-hover:text-text-darkMuted/90';

  return (
    <div
      className={`${baseNodeClasses} ${selectedNodeClasses}`}
      onClick={handleClick}
      style={{ ...style, paddingLeft: `${paddingLeft}px` }} 
      role={node.isDirectory ? "treeitem" : "none"}
      aria-expanded={node.isDirectory ? isExpanded : undefined}
      aria-selected={isSelected} 
      aria-level={depth + 1}
      aria-label={`${node.name}${node.isDirectory ? ' (pasta)' : ' (arquivo)'}`}
      id={`filetree-${node.path.replace(/[^\w-]/g, '_')}`} 
    >
      {node.isDirectory ? (
        <ChevronIcon
          className={`w-4 h-4 mr-1 flex-shrink-0 ${chevronColorClasses}`}
          onClick={handleToggle} 
          aria-hidden="true"
        />
      ) : (
        <span className="w-4 mr-1 flex-shrink-0" /> 
      )}
      <Icon className={`w-4 h-4 mr-1.5 flex-shrink-0 ${iconColorClasses}`} aria-hidden="true" />
      <span className="truncate flex-grow" title={node.name}>{node.name}</span>
      {node.isLoading && <span className="ml-auto text-xs animate-pulse text-text-muted dark:text-text-darkMuted">...</span>}
    </div>
  );
}, (prevProps, nextProps) => {
    return (
        prevProps.node === nextProps.node &&
        prevProps.depth === nextProps.depth &&
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.onFileClick === nextProps.onFileClick && 
        prevProps.onLoadChildren === nextProps.onLoadChildren &&
        prevProps.onToggleExpand === nextProps.onToggleExpand
    );
});

export const VirtualizedFileTree: React.FC<VirtualizedFileTreeProps> = ({
  nodes,
  onFileClick,
  onLoadChildren,
  expandedPaths,
  setExpandedPaths,
  selectedFilePath, 
  className,
  style,
  itemHeight = 28, 
}) => {

  const toggleExpand = (node: FileSystemNode) => {
    if (!node.isDirectory) return;
    setExpandedPaths(prev => {
      const newPaths = new Set(prev);
      if (newPaths.has(node.path)) newPaths.delete(node.path);
      else newPaths.add(node.path);
      return newPaths;
    });
  };

  const flattenNodes = (
    nodeList: FileSystemNode[],
    currentDepth = 0
  ): { node: FileSystemNode; depth: number }[] => {
    let result: { node: FileSystemNode; depth: number }[] = [];
    for (const node of nodeList) {
      result.push({ node, depth: currentDepth });
      if (node.isDirectory && expandedPaths.has(node.path) && node.children) {
        result = result.concat(flattenNodes(node.children, currentDepth + 1));
      }
    }
    return result;
  };

  const flatNodes = flattenNodes(nodes, 0); 

  if (nodes.length === 0 && flatNodes.length === 0) { 
    return <div className="text-xs text-text-muted dark:text-text-darkMuted py-2 px-3" aria-live="polite">Nenhum arquivo ou pasta.</div>;
  }
  
  return (
    <div
        role="tree"
        aria-label="Explorador de Arquivos"
        className={`w-full overflow-y-auto custom-scrollbar ${className || ''}`} 
        style={style} 
    >
      <Virtuoso
        className="w-full h-full"
        totalCount={flatNodes.length}
        itemContent={index => {
          const { node, depth: nodeDepth } = flatNodes[index];
          const isSelected = node.path === selectedFilePath; 
          return (
            <FileTreeNode
              key={node.path} 
              node={node}
              depth={nodeDepth}
              onFileClick={onFileClick}
              onLoadChildren={onLoadChildren}
              isExpanded={expandedPaths.has(node.path)}
              onToggleExpand={toggleExpand}
              isSelected={isSelected} 
            />
          );
        }}
        fixedItemHeight={itemHeight}
      />
    </div>
  );
}; 