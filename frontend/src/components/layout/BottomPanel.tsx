import React from 'react';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { FiTerminal, FiAlertTriangle } from 'react-icons/fi';
import { useUIState, BottomPanelId } from '../../context/UIStateContext';
import { AnimatedDiv } from '../common/AnimatedDiv';
import { AnimatedButton } from '../common/AnimatedButton';
import { variants } from '../../lib/animations';
import { ProblemsPanel } from '../panel/ProblemsPanel';

// --- Componentes Placeholder --- 
const TerminalPanelContent: React.FC = () => (
  <div className="p-4 h-full bg-black text-green-400 font-mono text-sm">Terminal Placeholder...</div>
);
const OutputPanelContent: React.FC = () => (
  <div className="p-4 h-full">Output Placeholder...</div>
);
// ... outros placeholders

interface BottomPanelProps {
  // Props necessárias?
}

export const BottomPanel: React.FC<BottomPanelProps> = React.memo(() => {
  const { state, setActiveBottomPanel } = useUIState();
  const { activePanel, panels } = state.bottomPanel;

  const panelOptions: { id: BottomPanelId; label: string; icon: React.ElementType }[] = [
    { id: 'terminal', label: 'Terminal', icon: FiTerminal },
    { id: 'problems', label: 'Problems', icon: FiAlertTriangle },
    // Adicionar outros painéis aqui (Output, Debug Console, etc.)
  ];

  const renderPanelContent = (panelId: BottomPanelId | null) => {
    switch (panelId) {
      case 'terminal':
        return <TerminalPanelContent />;
      case 'problems':
        return <ProblemsPanel />;
      // case 'output':
      //   return <OutputPanelContent />;
      default:
        return <div className="p-4 text-sm text-gray-500">Selecione um painel.</div>;
    }
  };

  const headerBg = 'bg-gray-100 dark:bg-gray-800';
  const borderColor = 'border-gray-200 dark:border-gray-700';

  return (
    <AnimatedDiv
      className="h-full flex flex-col bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700/50 overflow-hidden"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="region"
      aria-label="Bottom Panel"
    >
      {/* Header com Abas/Seletores */}
      <div className={`flex items-center px-2 border-b ${borderColor} ${headerBg} flex-shrink-0`} role="tablist" aria-label="Bottom Panel Tabs">
        {panelOptions.map((option) => (
          <AnimatedButton
            key={option.id}
            onClick={() => setActiveBottomPanel(option.id)}
            variant="ghost"
            size="sm"
            className={`px-3 py-1.5 text-xs rounded-none border-b-2 transition-colors duration-150 
              ${activePanel === option.id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400 font-medium'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}
            `}
            title={option.label}
            role="tab"
            aria-selected={activePanel === option.id}
            aria-controls={`bottom-panel-${option.id}`}
            id={`tab-${option.id}`}
          >
            <option.icon className="w-4 h-4 mr-1.5" aria-hidden="true" />
            {option.label}
             {/* Contador de problemas? */}
             {option.id === 'problems' && /* Lógica para contar problemas */ false && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-[10px]">
                    {/* {problemsState.problems.length} */} 
                </span>
             )}
          </AnimatedButton>
        ))}
      </div>

      {/* Conteúdo do Painel Ativo */}
      <div className="flex-1 overflow-auto">
        <div 
          id={`bottom-panel-${activePanel}`} 
          role="tabpanel" 
          aria-labelledby={`tab-${activePanel}`}
          className="h-full"
        >
          {renderPanelContent(activePanel)}
        </div>
      </div>
    </AnimatedDiv>
  );
}); 