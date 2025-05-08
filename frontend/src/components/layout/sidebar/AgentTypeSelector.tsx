import React, { useMemo } from 'react';
import { FiCode, FiFileText, FiShield, FiActivity } from 'react-icons/fi';
import { AgentType } from '../../../types';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../context/ThemeContext';

interface AgentTypeOption {
  id: AgentType;
  name: string;
  description: string;
}

interface AgentTypeSelectorProps {
  agentTypes: AgentTypeOption[];
  selectedAgentType: AgentType | null;
  onChange: (agentType: AgentType) => void;
}

const AgentTypeSelector: React.FC<AgentTypeSelectorProps> = React.memo(({ 
  agentTypes, 
  selectedAgentType, 
  onChange 
}) => {
  const { theme } = useTheme();
  
  // Estilos memoizados baseados no tema
  const styles = useMemo(() => ({
    button: (selected: boolean) => cn(
      "w-full text-left p-2 rounded-md transition-colors flex items-center",
      selected
        ? theme === 'dark' ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800"
        : theme === 'dark' ? "hover:bg-gray-700" : "hover:bg-gray-100",
      theme === 'dark' ? "border border-gray-700" : "border border-gray-200"
    ),
    iconContainer: cn(
      "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center mr-2",
      theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
    )
  }), [theme]);

  // Mapeamento de ícones por tipo de agente
  const getAgentIcon = (agentType: string) => {
    switch(agentType) {
      case 'coder':
        return <FiCode className="w-4 h-4" />;
      case 'product':
        return <FiFileText className="w-4 h-4" />;
      case 'security':
        return <FiShield className="w-4 h-4" />;
      case 'test':
        return <FiActivity className="w-4 h-4" />;
      default:
        return <FiCode className="w-4 h-4" />;
    }
  };

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1 dark:text-gray-300">
        Tipo de Agente
      </label>
      <div 
        className="space-y-2"
        role="radiogroup"
        aria-label="Tipos de agente disponíveis"
      >
        {agentTypes.map((agentType) => (
          <button
            key={agentType.id}
            type="button"
            className={styles.button(selectedAgentType === agentType.id)}
            onClick={() => onChange(agentType.id)}
            role="radio"
            aria-checked={selectedAgentType === agentType.id}
            aria-label={`${agentType.name}: ${agentType.description}`}
          >
            <div className={styles.iconContainer}>
              {getAgentIcon(agentType.id)}
            </div>
            <div>
              <div className="font-medium text-sm">{agentType.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {agentType.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

export default AgentTypeSelector; 