import React, { useCallback, useMemo } from 'react';
import { AgentType } from '../../../types';
import { cn } from '../../../lib/utils';
import { CollapsibleSection } from '../../common/CollapsibleSection';
import { FiCode, FiArchive, FiShield, FiCheckCircle, FiCheck } from 'react-icons/fi';

interface AgentSelectionPanelProps {
  selectedAgentType: AgentType | null;
  onAgentSelect: (agentType: AgentType) => void;
  className?: string;
}

// Mapeamento de tipos de agente para ícones
const agentIcons: Record<AgentType, React.ElementType> = {
  coder: FiCode,
  product: FiArchive,
  security: FiShield,
  test: FiCheckCircle,
};

const AgentSelectionPanel: React.FC<AgentSelectionPanelProps> = React.memo(({
  selectedAgentType,
  onAgentSelect,
  className
}) => {
  const agents = useMemo(() => [
    {
      type: 'coder' as AgentType,
      name: 'Agente de Código',
      description: 'Auxilia em tarefas de codificação, correção de bugs e revisão.',
      iconComponent: agentIcons.coder,
    },
    {
      type: 'product' as AgentType,
      name: 'Agente de Produto',
      description: 'Assiste com requisitos e especificações de produto.',
      iconComponent: agentIcons.product,
    },
    {
      type: 'security' as AgentType,
      name: 'Agente de Segurança',
      description: 'Analisa o código em busca de vulnerabilidades.',
      iconComponent: agentIcons.security,
    },
    {
      type: 'test' as AgentType,
      name: 'Agente de Teste',
      description: 'Gera casos de teste e auxilia na fase de testes.',
      iconComponent: agentIcons.test,
    }
  ], []);

  const handleAgentSelect = useCallback((agentType: AgentType) => {
    onAgentSelect(agentType);
  }, [onAgentSelect]);

  // --- Estilos para os botões de agente ---
  const agentButtonBaseClasses = `
    w-full text-left p-3 rounded-lg
    transition-all duration-200 ease-in-out
    border border-transparent
    group relative
  `;

  const agentButtonSelectedClasses = `
    bg-accent/20 dark:bg-accent-dark/25
    border-accent/50 dark:border-accent-dark/60
    shadow-md
    text-text dark:text-text-dark
  `;

  const agentButtonUnselectedClasses = `
    bg-white/5 dark:bg-black/10
    hover:bg-white/10 dark:hover:bg-black/15
    hover:border-border dark:hover:border-border-dark
    text-text-muted dark:text-text-darkMuted
    hover:text-text dark:hover:text-text-dark
  `;
  // --- Fim dos estilos para os botões de agente ---

  return (
    <div
      className={cn(
        "w-full",
        className
      )}
      role="region"
      aria-label="Seleção de tipo de Agente"
    >
      <CollapsibleSection
        title="Tipos de Agente"
        defaultOpen={true}
      >
        <div
          className="space-y-2.5"
          role="radiogroup"
          aria-labelledby="agent-selection-title"
        >
          {agents.map((agent) => (
            <button
              key={agent.type}
              className={cn(
                agentButtonBaseClasses,
                selectedAgentType === agent.type
                  ? agentButtonSelectedClasses
                  : agentButtonUnselectedClasses
              )}
              onClick={() => handleAgentSelect(agent.type)}
              role="radio"
              aria-checked={selectedAgentType === agent.type}
              aria-label={`${agent.name}: ${agent.description}`}
              id={`agent-type-${agent.type}`}
            >
              <div className="flex items-center">
                <div className="mr-3 p-1.5 bg-white/10 dark:bg-black/15 rounded-md">
                  <agent.iconComponent
                    className={cn(
                      "w-5 h-5",
                      selectedAgentType === agent.type
                        ? "text-accent dark:text-accent-dark"
                        : "text-text-muted dark:text-text-darkMuted group-hover:text-accent dark:group-hover:text-accent-dark"
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <div className={cn(
                      "font-medium text-sm",
                       selectedAgentType === agent.type
                        ? "text-text dark:text-text-dark"
                        : "text-text-muted dark:text-text-darkMuted group-hover:text-text dark:group-hover:text-text-dark"
                    )}
                  >
                    {agent.name}
                  </div>
                  <div className={cn(
                      "text-xs",
                      selectedAgentType === agent.type
                        ? "text-text-muted dark:text-text-darkMuted"
                        : "text-text-muted/80 dark:text-text-darkMuted/80 group-hover:text-text-muted dark:group-hover:text-text-darkMuted"
                    )}
                  >
                    {agent.description}
                  </div>
                </div>
                {selectedAgentType === agent.type && (
                  <FiCheck className="ml-auto h-5 w-5 text-accent dark:text-accent-dark opacity-80" />
                )}
              </div>
            </button>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
});

export default AgentSelectionPanel; 