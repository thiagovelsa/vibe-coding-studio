import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiClock, FiRefreshCw, FiCornerUpLeft, FiCornerUpRight, FiTrash2 } from 'react-icons/fi';
import { useHistoryContext, HistoryItem } from '../../lib/history';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryViewProps {
  title?: string;
  maxHeight?: string | number;
  showControls?: boolean;
  filterTypes?: string[];
  onItemSelect?: (item: HistoryItem) => void;
  className?: string;
  compact?: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  title = 'Histórico',
  maxHeight = '300px',
  showControls = true,
  filterTypes,
  onItemSelect,
  className = '',
  compact = false
}) => {
  const { 
    historyState, 
    undo, 
    redo, 
    clearHistory, 
    canUndo, 
    canRedo 
  } = useHistoryContext();
  
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Aplicar filtragem e ordenar do mais recente para o mais antigo
  useEffect(() => {
    // Combinar passado, presente e futuro em uma lista
    const allItems = [
      ...historyState.past,
      ...(historyState.present ? [historyState.present] : []),
      ...historyState.future
    ];
    
    // Filtrar por tipo, se especificado
    const filtered = filterTypes?.length
      ? allItems.filter(item => filterTypes.includes(item.type))
      : allItems;
    
    // Ordenar por timestamp (mais recente primeiro)
    const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    
    setFilteredHistory(sorted);
  }, [historyState, filterTypes]);
  
  // Formatar tempo relativo
  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return 'há algum tempo';
    }
  };
  
  // Renderizar um item do histórico
  const renderHistoryItem = (item: HistoryItem, index: number) => {
    const isPresent = historyState.present?.id === item.id;
    const isPast = historyState.past.some(p => p.id === item.id);
    const isFuture = historyState.future.some(f => f.id === item.id);
    
    const isExpanded = expanded === item.id;
    const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;
    
    // Determinar cor com base no estado do item
    let statusColor = '';
    if (isPresent) statusColor = 'bg-blue-500';
    else if (isPast) statusColor = 'bg-gray-400';
    else if (isFuture) statusColor = 'bg-purple-400';
    
    return (
      <motion.div
        key={item.id}
        className={`border-b border-gray-200 dark:border-gray-700 last:border-0 
                   ${isPresent ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
      >
        <div 
          className={`relative flex items-center gap-2 p-2 ${compact ? 'py-1' : 'py-2'} 
                    cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50
                    ${isPresent ? 'font-medium' : ''}`}
          onClick={() => {
            if (hasMetadata || item.data) {
              setExpanded(isExpanded ? null : item.id);
            }
            
            if (onItemSelect) {
              onItemSelect(item);
            }
          }}
        >
          {/* Indicador de estado */}
          <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
          
          {/* Descrição principal */}
          <div className="flex-1 overflow-hidden">
            <div className="text-sm truncate">{item.description}</div>
            
            {!compact && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                <FiClock className="inline mr-1" size={12} />
                {formatTime(item.timestamp)}
                
                <span className="mx-1">•</span>
                
                <span className="uppercase text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                  {item.type}
                </span>
              </div>
            )}
          </div>
          
          {/* Ícone de expansão, se tiver dados adicionais */}
          {(hasMetadata || item.data) && (
            <FiChevronRight 
              className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              size={compact ? 16 : 20}
            />
          )}
        </div>
        
        {/* Detalhes expandidos */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-gray-50 dark:bg-gray-800/30"
            >
              <div className="p-3 text-sm">
                {/* Metadados adicionais */}
                {hasMetadata && (
                  <div className="mb-2">
                    <h4 className="font-medium text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Metadados
                    </h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(item.metadata || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <span className="text-gray-600 dark:text-gray-400 mr-1">{key}:</span>
                          <span className="text-gray-900 dark:text-gray-200">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Dados principais (opcional) */}
                {item.data && (
                  <div>
                    <h4 className="font-medium text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Dados
                    </h4>
                    <div className="text-xs overflow-hidden text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                      {typeof item.data === 'object' 
                        ? JSON.stringify(item.data, null, 2)
                        : String(item.data)
                      }
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };
  
  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium flex items-center">
          <FiRefreshCw className="mr-2" />
          {title}
        </h3>
        
        {showControls && (
          <div className="flex items-center space-x-1">
            <button
              className={`p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700
                        ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={undo}
              disabled={!canUndo}
              title="Desfazer"
            >
              <FiCornerUpLeft size={16} />
            </button>
            
            <button
              className={`p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700
                        ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={redo}
              disabled={!canRedo}
              title="Refazer"
            >
              <FiCornerUpRight size={16} />
            </button>
            
            <button
              className="p-1.5 rounded-md text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={clearHistory}
              title="Limpar histórico"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Lista do histórico */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredHistory.length > 0 ? (
          <AnimatePresence initial={false}>
            {filteredHistory.map((item, index) => renderHistoryItem(item, index))}
          </AnimatePresence>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            Nenhum histórico disponível
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para mostrar o estado atual do histórico (atividade)
interface HistoryStateIndicatorProps {
  showCounts?: boolean;
}

export const HistoryStateIndicator: React.FC<HistoryStateIndicatorProps> = ({
  showCounts = true
}) => {
  const { historyState, canUndo, canRedo } = useHistoryContext();
  
  return (
    <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
      <span className={`${canUndo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
        <FiCornerUpLeft className="inline-block mr-1" />
        {showCounts && (
          <span>{historyState.past.length}</span>
        )}
      </span>
      
      <span className="mx-2 text-gray-400">|</span>
      
      <span className={`${canRedo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
        <FiCornerUpRight className="inline-block mr-1" />
        {showCounts && (
          <span>{historyState.future.length}</span>
        )}
      </span>
    </div>
  );
};

// Componente para mostrar um item relacionado ao histórico
interface HistoryItemViewProps {
  item: HistoryItem;
  showTimestamp?: boolean;
  showType?: boolean;
  showData?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const HistoryItemView: React.FC<HistoryItemViewProps> = ({
  item,
  showTimestamp = true,
  showType = true,
  showData = false,
  isActive = false,
  onClick
}) => {
  return (
    <div
      className={`p-2 border-b border-gray-200 dark:border-gray-700 last:border-0
                ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <FiClock className="text-gray-400 dark:text-gray-500" />
        <div className="flex-1">
          <div className="text-sm font-medium">{item.description}</div>
          
          {showTimestamp && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(item.timestamp).toLocaleString()}
            </div>
          )}
        </div>
        
        {showType && (
          <div className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
            {item.type}
          </div>
        )}
      </div>
      
      {showData && item.data && (
        <div className="mt-2 text-xs overflow-hidden text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
          {typeof item.data === 'object' 
            ? JSON.stringify(item.data, null, 2)
            : String(item.data)
          }
        </div>
      )}
    </div>
  );
}; 