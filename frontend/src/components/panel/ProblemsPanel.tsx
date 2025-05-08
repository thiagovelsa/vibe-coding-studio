import React, { useState, useEffect, useMemo } from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiX, FiFilter, FiRefreshCw, FiEye, FiEyeOff, FiCheck, FiTrash2, FiFileText } from 'react-icons/fi';
import { useProblems, ProblemType, Problem } from '../../context/ProblemsContext';
import { useErrorManager } from '../../context/ErrorManagerContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useUIState } from '../../context/UIStateContext';
import { ErrorSeverity, ErrorSource } from '../../lib/ErrorManager';
import { AnimatedButton } from '../common/AnimatedButton';
import { ErrorNotification } from '../common/ErrorNotification';
import { Logger } from '../../lib/Logger';
import { motion, AnimatePresence } from 'framer-motion';

export const ProblemsPanel: React.FC = React.memo(() => {
  const { 
    state: problemsState, 
    getFilteredProblems,
    setFilterTypes,
    setFilterSources,
    setFilterOnlyActive,
    setSelectedProblem,
    getSelectedProblem,
    resolveProblem,
    unresolveProblem,
    removeProblem,
    clearAllProblems,
    clearResolvedProblems
  } = useProblems();
  
  const { state: errorState } = useErrorManager();
  const { openFile } = useWorkspace();
  const { setActiveBottomTab } = useUIState();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ProblemType[]>([
    ProblemType.ERROR,
    ProblemType.WARNING,
    ProblemType.INFO
  ]);

  // Filtragem de problemas
  const filteredProblems = useMemo(() => getFilteredProblems(), [getFilteredProblems]);
  const selectedProblem = useMemo(() => getSelectedProblem(), [getSelectedProblem]);

  // Estatísticas de problemas
  const errorCount = useMemo(() => 
    filteredProblems.filter(p => p.type === ProblemType.ERROR && !p.isResolved).length, 
    [filteredProblems]
  );
  
  const warningCount = useMemo(() => 
    filteredProblems.filter(p => p.type === ProblemType.WARNING && !p.isResolved).length, 
    [filteredProblems]
  );
  
  const infoCount = useMemo(() => 
    filteredProblems.filter(p => p.type === ProblemType.INFO && !p.isResolved).length, 
    [filteredProblems]
  );

  // Lista de fontes disponíveis para filtro
  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    problemsState.problems.forEach(p => sources.add(p.source));
    return Array.from(sources);
  }, [problemsState.problems]);

  // Atualizar filtros no contexto quando mudarem localmente
  useEffect(() => {
    setFilterTypes(selectedTypes);
  }, [selectedTypes, setFilterTypes]);

  useEffect(() => {
    setFilterSources(selectedSources);
  }, [selectedSources, setFilterSources]);

  // Navegar para a localização do problema
  const navigateToProblem = async (problem: Problem) => {
    try {
      if (problem.location?.fileId) {
        await openFile(problem.location.fileId);
        
        // TODO: Implementar a navegação para a linha/coluna específica
        // Isso geralmente envolve chamar algum método do editor de código
        // depois que o arquivo estiver aberto.
        
        Logger.info(`Navegado para o problema em: ${problem.location.filePath || problem.location.fileId}`);
      }
    } catch (error) {
      Logger.error(`Erro ao navegar para o problema: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Renderização do ícone baseado no tipo do problema
  const renderProblemIcon = (type: ProblemType) => {
    switch (type) {
      case ProblemType.ERROR:
        return <FiAlertCircle className="text-red-500" size={16} />;
      case ProblemType.WARNING:
        return <FiAlertTriangle className="text-amber-500" size={16} />;
      case ProblemType.INFO:
        return <FiInfo className="text-blue-500" size={16} />;
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setSelectedTypes([ProblemType.ERROR, ProblemType.WARNING, ProblemType.INFO]);
    setSelectedSources([]);
    setFilterOnlyActive(true);
  };

  return (
    <div className="flex flex-col h-full bg-panel dark:bg-panel-dark">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-border dark:border-border-dark p-2">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-title dark:text-title-dark">Problemas</h2>
          
          <div className="flex gap-2">
            <span className="flex items-center text-xs">
              <FiAlertCircle className="text-red-500 mr-1" size={12} />
              {errorCount}
            </span>
            <span className="flex items-center text-xs">
              <FiAlertTriangle className="text-amber-500 mr-1" size={12} />
              {warningCount}
            </span>
            <span className="flex items-center text-xs">
              <FiInfo className="text-blue-500 mr-1" size={12} />
              {infoCount}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1">
          <AnimatedButton
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 rounded hover:bg-hover dark:hover:bg-hover-dark"
            title="Filtros"
          >
            <FiFilter size={14} />
          </AnimatedButton>
          
          <AnimatedButton
            onClick={() => clearResolvedProblems()}
            className="p-1 rounded hover:bg-hover dark:hover:bg-hover-dark"
            title="Limpar problemas resolvidos"
          >
            <FiCheck size={14} />
          </AnimatedButton>
          
          <AnimatedButton
            onClick={() => clearAllProblems()}
            className="p-1 rounded hover:bg-hover dark:hover:bg-hover-dark"
            title="Limpar todos os problemas"
          >
            <FiTrash2 size={14} />
          </AnimatedButton>
        </div>
      </div>
      
      {/* Área de filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border dark:border-border-dark overflow-hidden"
          >
            <div className="p-2 flex flex-col gap-2">
              <div>
                <h3 className="text-xs font-medium mb-1">Tipos</h3>
                <div className="flex flex-wrap gap-1">
                  <AnimatedButton
                    onClick={() => setSelectedTypes(prev => 
                      prev.includes(ProblemType.ERROR) 
                        ? prev.filter(t => t !== ProblemType.ERROR) 
                        : [...prev, ProblemType.ERROR]
                    )}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      selectedTypes.includes(ProblemType.ERROR)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : 'bg-panel-secondary dark:bg-panel-darkSecondary'
                    }`}
                  >
                    <FiAlertCircle size={12} />
                    Erros
                  </AnimatedButton>
                  
                  <AnimatedButton
                    onClick={() => setSelectedTypes(prev => 
                      prev.includes(ProblemType.WARNING) 
                        ? prev.filter(t => t !== ProblemType.WARNING) 
                        : [...prev, ProblemType.WARNING]
                    )}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      selectedTypes.includes(ProblemType.WARNING)
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                        : 'bg-panel-secondary dark:bg-panel-darkSecondary'
                    }`}
                  >
                    <FiAlertTriangle size={12} />
                    Avisos
                  </AnimatedButton>
                  
                  <AnimatedButton
                    onClick={() => setSelectedTypes(prev => 
                      prev.includes(ProblemType.INFO) 
                        ? prev.filter(t => t !== ProblemType.INFO) 
                        : [...prev, ProblemType.INFO]
                    )}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      selectedTypes.includes(ProblemType.INFO)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-panel-secondary dark:bg-panel-darkSecondary'
                    }`}
                  >
                    <FiInfo size={12} />
                    Informações
                  </AnimatedButton>
                </div>
              </div>
              
              {availableSources.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium mb-1">Fontes</h3>
                  <div className="flex flex-wrap gap-1">
                    {availableSources.map(source => (
                      <AnimatedButton
                        key={source}
                        onClick={() => setSelectedSources(prev => 
                          prev.includes(source) 
                            ? prev.filter(s => s !== source) 
                            : [...prev, source]
                        )}
                        className={`px-2 py-1 rounded text-xs ${
                          selectedSources.includes(source) || selectedSources.length === 0
                            ? 'bg-accent/20 dark:bg-accent-dark/20'
                            : 'bg-panel-secondary dark:bg-panel-darkSecondary'
                        }`}
                      >
                        {source}
                      </AnimatedButton>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-xs font-medium mb-1">Status</h3>
                <div className="flex gap-1">
                  <AnimatedButton
                    onClick={() => setFilterOnlyActive(true)}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      problemsState.filter.onlyActive
                        ? 'bg-accent/20 dark:bg-accent-dark/20'
                        : 'bg-panel-secondary dark:bg-panel-darkSecondary'
                    }`}
                  >
                    <FiEye size={12} />
                    Apenas não resolvidos
                  </AnimatedButton>
                  
                  <AnimatedButton
                    onClick={() => setFilterOnlyActive(false)}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      !problemsState.filter.onlyActive
                        ? 'bg-accent/20 dark:bg-accent-dark/20'
                        : 'bg-panel-secondary dark:bg-panel-darkSecondary'
                    }`}
                  >
                    <FiEyeOff size={12} />
                    Todos
                  </AnimatedButton>
                </div>
              </div>
              
              <div className="flex justify-end">
                <AnimatedButton
                  onClick={clearFilters}
                  className="px-2 py-1 rounded text-xs bg-panel-secondary dark:bg-panel-darkSecondary"
                >
                  Limpar filtros
                </AnimatedButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lista de problemas */}
      <div className="flex-1 overflow-auto">
        {filteredProblems.length > 0 ? (
          <ul className="divide-y divide-border dark:divide-border-dark">
            {filteredProblems.map(problem => (
              <li
                key={problem.id}
                className={`px-3 py-2 ${
                  problemsState.selectedProblemId === problem.id
                    ? 'bg-accent/10 dark:bg-accent-dark/10'
                    : 'hover:bg-hover dark:hover:bg-hover-dark'
                } ${
                  problem.isResolved ? 'opacity-70' : ''
                }`}
                onClick={() => setSelectedProblem(problem.id)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    {renderProblemIcon(problem.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{problem.message}</p>
                    
                    <div className="flex items-center gap-1 mt-1 text-xs text-content-secondary dark:text-content-secondary-dark">
                      <span>{problem.source}</span>
                      
                      {problem.location?.filePath && (
                        <>
                          <span>•</span>
                          <button
                            className="hover:underline flex items-center gap-0.5 truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToProblem(problem);
                            }}
                            title={problem.location.filePath}
                          >
                            <FiFileText size={10} />
                            <span className="truncate max-w-[150px] inline-block">
                              {problem.location.filePath.split('/').pop()}
                            </span>
                            {problem.location.line && (
                              <span>:{problem.location.line}</span>
                            )}
                          </button>
                        </>
                      )}
                      
                      {problem.code && (
                        <>
                          <span>•</span>
                          <span className="opacity-75">
                            {problem.code}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <AnimatedButton
                      onClick={(e) => {
                        e.stopPropagation();
                        problem.isResolved
                          ? unresolveProblem(problem.id)
                          : resolveProblem(problem.id);
                      }}
                      className="p-1 rounded-full text-content-secondary dark:text-content-secondary-dark hover:bg-hover dark:hover:bg-hover-dark"
                      title={problem.isResolved ? "Marcar como não resolvido" : "Marcar como resolvido"}
                    >
                      {problem.isResolved ? <FiRefreshCw size={12} /> : <FiCheck size={12} />}
                    </AnimatedButton>
                    
                    <AnimatedButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProblem(problem.id);
                      }}
                      className="p-1 rounded-full text-content-secondary dark:text-content-secondary-dark hover:bg-hover dark:hover:bg-hover-dark"
                      title="Remover"
                    >
                      <FiX size={12} />
                    </AnimatedButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-content-secondary dark:text-content-secondary-dark">
            <FiInfo size={24} className="mb-2" />
            <p className="text-sm">Nenhum problema encontrado</p>
            <p className="text-xs mt-1">
              {problemsState.problems.length > 0
                ? "Tente ajustar os filtros para ver mais problemas"
                : "O sistema não detectou nenhum problema"}
            </p>
          </div>
        )}
      </div>
      
      {/* Detalhes do problema selecionado */}
      {selectedProblem && (
        <div className="border-t border-border dark:border-border-dark p-3 bg-panel-secondary dark:bg-panel-darkSecondary">
          <h3 className="text-sm font-medium mb-2">Detalhes do problema</h3>
          
          {selectedProblem.applicationError ? (
            <ErrorNotification
              error={selectedProblem.applicationError}
              showDetails={true}
              onDismiss={() => setSelectedProblem(null)}
              onRetry={
                selectedProblem.applicationError.retryable
                  ? () => {
                      // TODO: Implementar retry baseado no erro original
                      // Isso pode envolver chamar a função original que falhou
                      console.log('Tentando novamente a operação...');
                    }
                  : undefined
              }
            />
          ) : (
            <div className="bg-panel dark:bg-panel-dark rounded-lg p-3 text-sm">
              <p className="mb-2">{selectedProblem.message}</p>
              
              {selectedProblem.details && (
                <pre className="bg-black/10 dark:bg-white/10 p-2 rounded text-xs mt-2 overflow-auto max-h-32">
                  {selectedProblem.details}
                </pre>
              )}
              
              <div className="flex gap-2 mt-3">
                {selectedProblem.location?.fileId && (
                  <AnimatedButton
                    onClick={() => navigateToProblem(selectedProblem)}
                    className="px-2 py-1 text-xs bg-accent/20 dark:bg-accent-dark/20 rounded flex items-center gap-1"
                  >
                    <FiFileText size={12} />
                    Ir para o arquivo
                  </AnimatedButton>
                )}
                
                <AnimatedButton
                  onClick={() => 
                    selectedProblem.isResolved
                      ? unresolveProblem(selectedProblem.id)
                      : resolveProblem(selectedProblem.id)
                  }
                  className="px-2 py-1 text-xs bg-panel-hover dark:bg-panel-darkHover rounded flex items-center gap-1"
                >
                  {selectedProblem.isResolved
                    ? <>
                        <FiRefreshCw size={12} />
                        Marcar como não resolvido
                      </>
                    : <>
                        <FiCheck size={12} />
                        Marcar como resolvido
                      </>
                  }
                </AnimatedButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}); 