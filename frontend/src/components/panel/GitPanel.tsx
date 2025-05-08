import React, { useState, useCallback, useMemo } from 'react';
import { FiGitCommit, FiGitBranch, FiFileText, FiRefreshCw, FiPlus, FiMinus } from 'react-icons/fi';

const GitPanel = React.memo(() => {
  const [expandedSections, setExpandedSections] = useState({
    changes: true,
    staged: false
  });

  // Otimizando o manipulador toggleSection com useCallback
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prevState => ({
      ...prevState,
      [section]: !prevState[section as keyof typeof prevState]
    }));
  }, []);

  // Memoizando o componente StatusIcon
  const StatusIcon = useMemo(() => {
    return ({ status }: { status: string }) => {
      switch (status) {
        case 'modified':
          return <div className="text-yellow-500">M</div>;
        case 'added':
          return <FiPlus className="text-green-500" />;
        case 'deleted':
          return <FiMinus className="text-red-500" />;
        default:
          return <div>?</div>;
      }
    };
  }, []);

  // Dados de exemplo
  const changes = [
    { id: 1, name: 'App.tsx', path: 'src/components', status: 'modified' },
    { id: 2, name: 'index.css', path: 'src', status: 'modified' }
  ];
  
  const staged = [
    { id: 3, name: 'README.md', path: '', status: 'modified' }
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho do Painel */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <FiGitBranch className="mr-2 text-primary-500" size={16} />
          <span className="text-sm font-medium">main</span>
        </div>
        <button 
          className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-primary-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
          title="Atualizar"
        >
          <FiRefreshCw size={14} />
        </button>
      </div>

      {/* Área de mudanças */}
      <div className="flex-1 overflow-auto">
        {/* Mudanças */}
        <div className="mb-2">
          <button 
            className="flex w-full items-center justify-between rounded py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => toggleSection('changes')}
          >
            <div className="flex items-center">
              <span className="text-xs font-medium">Mudanças</span>
              <span className="ml-2 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                {changes.length}
              </span>
            </div>
            <span>{expandedSections.changes ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.changes && (
            <div className="mt-1 space-y-1 pl-2">
              {changes.map(file => (
                <div 
                  key={file.id}
                  className="flex cursor-pointer items-center rounded py-1 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="mr-2 w-4">
                    <StatusIcon status={file.status} />
                  </div>
                  <FiFileText className="mr-2" size={14} />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Preparados (Staged) */}
        <div className="mb-2">
          <button 
            className="flex w-full items-center justify-between rounded py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => toggleSection('staged')}
          >
            <div className="flex items-center">
              <span className="text-xs font-medium">Preparados</span>
              <span className="ml-2 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                {staged.length}
              </span>
            </div>
            <span>{expandedSections.staged ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.staged && (
            <div className="mt-1 space-y-1 pl-2">
              {staged.map(file => (
                <div 
                  key={file.id}
                  className="flex cursor-pointer items-center rounded py-1 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="mr-2 w-4">
                    <StatusIcon status={file.status} />
                  </div>
                  <FiFileText className="mr-2" size={14} />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Área de mensagem de commit */}
      <div className="mt-3">
        <textarea
          placeholder="Mensagem de commit"
          className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-primary-500"
          rows={2}
        ></textarea>
        <div className="mt-2 flex justify-between">
          <button className="flex items-center rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            <FiGitCommit className="mr-1" size={12} />
            Commit em todos
          </button>
          <button className="flex items-center rounded bg-primary-500 px-2 py-1 text-xs text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700">
            <FiGitCommit className="mr-1" size={12} />
            Commit e Push
          </button>
        </div>
      </div>
    </div>
  );
});

export default GitPanel; 