import { useState, useCallback, useEffect } from 'react';
import { useFileSystemService, FileInfo, FileType } from '../services/file-system.service';
import { FileSystemNode } from '../components/common/FileTreeView';
import { toast } from 'react-toastify';

interface UseFileTreeResult {
  rootNode: FileSystemNode | null;
  isLoading: boolean;
  error: string | null;
  loadChildren: (nodePath: string) => Promise<void>;
  expandedPaths: Set<string>;
  setExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const useFileTree = (rootPath: string | null): UseFileTreeResult => {
  const fileSystemService = useFileSystemService();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const [rootNode, setRootNode] = useState<FileSystemNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertFileInfoToNode = useCallback((fileInfo: FileInfo): FileSystemNode => {
    const isDirectory = fileInfo.type === FileType.DIRECTORY;
    const hasChildren = !!fileInfo.children && fileInfo.children.length > 0;
    
    return {
      id: fileInfo.path,
      name: fileInfo.name,
      isDirectory,
      path: fileInfo.path,
      children: hasChildren ? fileInfo.children?.map(convertFileInfoToNode) : undefined,
      isLoaded: hasChildren,
      isLoading: false,
    };
  }, []);

  const updateNodeInTree = useCallback((
    node: FileSystemNode | null,
    nodeId: string,
    updates: Partial<FileSystemNode>
  ): FileSystemNode | null => {
    if (!node) return null;
    
    if (node.id === nodeId) {
      return { ...node, ...updates };
    }
    
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => 
          updateNodeInTree(child, nodeId, updates)
        ).filter(Boolean) as FileSystemNode[],
      };
    }
    
    return node;
  }, []);

  const addChildrenToNode = useCallback((
    node: FileSystemNode | null,
    parentId: string,
    children: FileSystemNode[]
  ): FileSystemNode | null => {
    if (!node) return null;
    
    if (node.id === parentId) {
      return { ...node, children, isLoading: false, isLoaded: true };
    }
    
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => 
          addChildrenToNode(child, parentId, children)
        ).filter(Boolean) as FileSystemNode[],
      };
    }
    
    return node;
  }, []);

  const loadChildren = useCallback(async (nodePath: string): Promise<void> => {
    const nodeId = nodePath;
    
    setRootNode(prevTree => updateNodeInTree(prevTree, nodeId, { isLoading: true }));
    
    try {
      const childrenInfo = await fileSystemService.getFileTree(nodePath, 1);
      let childrenNodes: FileSystemNode[] = [];
      
      if (childrenInfo && childrenInfo.children) {
        childrenNodes = childrenInfo.children.map(convertFileInfoToNode);
      }
      
      setRootNode(prevTree => addChildrenToNode(prevTree, nodeId, childrenNodes));
    } catch (error: any) {
      toast.error(`Erro ao carregar conteúdo de ${nodePath.split(/[\\/]/).pop()}.`);
      setRootNode(prevTree => updateNodeInTree(prevTree, nodeId, { isLoading: false, isLoaded: false }));
    }
  }, [fileSystemService, convertFileInfoToNode, updateNodeInTree, addChildrenToNode]);

  const loadRootTree = useCallback(async (root: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const rootInfo = await fileSystemService.getFileTree(root, 1);
      
      if (rootInfo) {
        const newRootNode = convertFileInfoToNode(rootInfo);
        setRootNode(newRootNode);
        
        // Expandir automaticamente o nó raiz
        setExpandedPaths(new Set([rootInfo.path]));
      } else {
        setRootNode(null);
      }
    } catch (error: any) {
      setError(error.message || 'Falha ao carregar a árvore de arquivos inicial.');
      setRootNode(null);
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService, convertFileInfoToNode]);

  useEffect(() => {
    if (rootPath) {
      loadRootTree(rootPath);
    } else {
      setRootNode(null);
      setIsLoading(false);
      setError(null);
      setExpandedPaths(new Set());
    }
  }, [rootPath, loadRootTree]);

  return {
    rootNode,
    isLoading,
    error,
    loadChildren,
    expandedPaths,
    setExpandedPaths
  };
}; 