import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { AgentProvider, AgentType } from '../../context/AgentContext';
import AgentSelector from '../AgentSelector';
import AgentWorkspace from '../AgentWorkspace';

const AiPanel: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Simulação de conexão com backend
  useEffect(() => {
    const connectToBackend = async () => {
      // Simulação de um atraso de conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
    };

    connectToBackend();
  }, []);

  const handleSelectAgent = (agentType: AgentType) => {
    setActiveAgent(agentType);
  };

  const handleCloseWorkspace = () => {
    setActiveAgent(null);
  };

  return (
    <AgentProvider>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Cabeçalho do painel */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            ASSISTENTE IA {activeAgent ? `• ${activeAgent.toUpperCase()}` : ''}
          </span>
          {activeAgent && (
            <button
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
              title="Fechar espaço de trabalho"
              onClick={handleCloseWorkspace}
            >
              <FiX size={14} />
            </button>
          )}
        </div>
        
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-hidden">
          {!isConnected ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mx-auto"></div>
                <p>Conectando ao backend de IA...</p>
              </div>
            </div>
          ) : activeAgent ? (
            <AgentWorkspace
              agentType={activeAgent}
            />
          ) : (
            <AgentSelector
              activeAgent={activeAgent}
              onSelectAgent={handleSelectAgent}
            />
          )}
        </div>
        
        {/* Rodapé com status de conexão */}
        <div className="border-t border-gray-200 px-3 py-1 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {isConnected ? (
            <span className="flex items-center">
              <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
              Conectado aos serviços de IA
            </span>
          ) : (
            <span className="flex items-center">
              <span className="mr-1 h-2 w-2 rounded-full bg-yellow-500"></span>
              Conectando...
            </span>
          )}
        </div>
      </div>
    </AgentProvider>
  );
};

export default AiPanel; 