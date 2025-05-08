import React from 'react';
import { FiCode, FiFileText, FiClipboard, FiShield } from 'react-icons/fi';
import { AgentType } from '../context/AgentContext';

interface AgentOption {
  type: AgentType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface AgentSelectorProps {
  activeAgent: AgentType | null;
  onSelectAgent: (agentType: AgentType) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  activeAgent,
  onSelectAgent,
}) => {
  const agentOptions: AgentOption[] = [
    {
      type: 'coder',
      name: 'Assistente de Código',
      description: 'Gera e refatora código com base em requisitos',
      icon: <FiCode className="h-6 w-6 text-blue-500" />,
    },
    {
      type: 'product',
      name: 'Assistente de Produto',
      description: 'Analisa requisitos e cria histórias de usuário',
      icon: <FiFileText className="h-6 w-6 text-green-500" />,
    },
    {
      type: 'test',
      name: 'Assistente de Testes',
      description: 'Cria planos de teste e scripts de automação',
      icon: <FiClipboard className="h-6 w-6 text-purple-500" />,
    },
    {
      type: 'security',
      name: 'Assistente de Segurança',
      description: 'Identifica vulnerabilidades e recomenda correções',
      icon: <FiShield className="h-6 w-6 text-red-500" />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
        Selecione um Assistente
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agentOptions.map((agent) => (
          <div
            key={agent.type}
            className={`cursor-pointer rounded-lg border p-4 transition-colors ${
              activeAgent === agent.type
                ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
            }`}
            onClick={() => onSelectAgent(agent.type)}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              {agent.icon}
            </div>
            <h3 className="mb-1 font-medium text-gray-900 dark:text-gray-100">{agent.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentSelector; 