import React from 'react';
import { FiAlertTriangle, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { useProblems } from '../../context/ProblemsContext';
import { useUIState } from '../../context/UIStateContext';
import { AnimatedButton } from '../common/AnimatedButton';

interface StatusBarProps {
  // Props?
}

export const StatusBar: React.FC<StatusBarProps> = React.memo(() => {
  const { state: problemsState } = useProblems();
  const { state: uiState, toggleBottomPanel } = useUIState();
  const { bottomPanel } = uiState;
  const problemCount = problemsState.problems.length;

  const handleToggleBottomPanel = () => {
    toggleBottomPanel();
  };

  const statusBg = 'bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm';
  const borderColor = 'border-gray-200 dark:border-gray-700';

  return (
    <div className={`h-6 flex items-center justify-between px-3 text-xs border-t ${borderColor} ${statusBg} flex-shrink-0`} role="status" aria-label="Status Bar">
      {/* Lado Esquerdo: Infos (Git, Cursor, etc. - Placeholders) */}
      <div className="flex items-center space-x-4">
        <span>main*</span> {/* Git branch placeholder */}
        <span>Ln 1, Col 1</span> {/* Cursor position placeholder */}
        {/* Outras infos */}
      </div>

      {/* Lado Direito: Ações/Status (Problemas, Notificações, etc.) */}
      <div className="flex items-center space-x-3">
        {/* Botão de Problemas/Toggle Painel Inferior */}
        <AnimatedButton 
          variant="ghost" 
          size="xs" 
          className={`flex items-center space-x-1 ${problemCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={handleToggleBottomPanel}
          title={`${bottomPanel.visible ? 'Hide' : 'Show'} Problems/Terminal Panel`}
          aria-label={`${problemCount} issues found. ${bottomPanel.visible ? 'Hide' : 'Show'} Problems panel`}
          aria-pressed={bottomPanel.visible}
        >
          <FiAlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span aria-hidden="true">{problemCount}</span>
          {bottomPanel.visible ? <FiChevronDown className="w-3.5 h-3.5 ml-1" aria-hidden="true" /> : <FiChevronUp className="w-3.5 h-3.5 ml-1" aria-hidden="true" />}
        </AnimatedButton>
        {/* Outros icones/status (notificações, etc.) */}
      </div>
    </div>
  );
}); 