import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { FiX } from 'react-icons/fi';

interface BottomPanelAreaProps {
  onClose: () => void;
}

interface PanelTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

const BottomPanelArea = ({ onClose }: BottomPanelAreaProps) => {
  const [activeTabId, setActiveTabId] = useLocalStorage<string>('vf-bottom-active-tab', 'terminal');
  
  // Mock de logs para o terminal
  const terminalLogs = [
    { id: '1', text: '$ npm start', type: 'command' },
    { id: '2', text: '> vibeforge-ide@0.1.0 start', type: 'info' },
    { id: '3', text: '> vite', type: 'info' },
    { id: '4', text: 'VITE v4.5.0  ready in 624 ms', type: 'success' },
    { id: '5', text: '➜  Local:   http://127.0.0.1:5173/', type: 'info' },
    { id: '6', text: '➜  Network: use --host to expose', type: 'info' },
    { id: '7', text: '➜  press h to show help', type: 'info' },
  ];

  // Mock de logs para a saída
  const outputLogs = [
    { id: '1', text: 'Inicializando VibeForge IDE...', type: 'info' },
    { id: '2', text: 'Carregando configurações...', type: 'info' },
    { id: '3', text: 'Configurações carregadas com sucesso.', type: 'success' },
    { id: '4', text: 'Conectando ao backend...', type: 'info' },
    { id: '5', text: 'Conexão estabelecida.', type: 'success' },
    { id: '6', text: 'Verificando modelos de IA disponíveis...', type: 'info' },
    { id: '7', text: 'Modelo codellama:13b encontrado localmente.', type: 'success' },
  ];

  // Mock de problemas
  const problems = [
    { id: '1', severity: 'error', text: 'Cannot find module "react-resizable-panels" ', location: 'MainContentArea.tsx:2:10' },
    { id: '2', severity: 'warning', text: 'Variable is declared but never used', location: 'App.tsx:15:7' },
    { id: '3', severity: 'info', text: 'Consider adding a type annotation', location: 'Sidebar.tsx:42:12' },
  ];

  // Definição das abas
  const tabs: PanelTab[] = [
    {
      id: 'terminal',
      label: 'TERMINAL',
      content: (
        <div className="font-mono text-sm h-full overflow-auto p-2">
          {terminalLogs.map(log => (
            <div 
              key={log.id} 
              className={`py-0.5 ${
                log.type === 'command' ? 'text-blue-600 dark:text-blue-400' : 
                log.type === 'error' ? 'text-red-600 dark:text-red-400' :
                log.type === 'success' ? 'text-green-600 dark:text-green-400' :
                'text-gray-700 dark:text-gray-300'
              }`}
            >
              {log.text}
            </div>
          ))}
          <div className="flex items-center mt-1 text-gray-700 dark:text-gray-300">
            <span className="mr-1">$</span>
            <div className="border-l-2 border-blue-500 h-4 animate-pulse"></div>
          </div>
        </div>
      )
    },
    {
      id: 'output',
      label: 'SAÍDA',
      content: (
        <div className="font-mono text-sm h-full overflow-auto p-2">
          {outputLogs.map(log => (
            <div 
              key={log.id} 
              className={`py-0.5 ${
                log.type === 'error' ? 'text-red-600 dark:text-red-400' :
                log.type === 'success' ? 'text-green-600 dark:text-green-400' :
                'text-gray-700 dark:text-gray-300'
              }`}
            >
              {log.text}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'problems',
      label: 'PROBLEMAS',
      content: (
        <div className="text-sm h-full overflow-auto p-2">
          {problems.length > 0 ? (
            <div className="space-y-1">
              {problems.map(problem => (
                <div 
                  key={problem.id}
                  className="flex items-start py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div 
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                      problem.severity === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      problem.severity === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {problem.severity === 'error' ? '!' : 
                    problem.severity === 'warning' ? '⚠' : 'i'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{problem.text}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{problem.location}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Nenhum problema encontrado
            </div>
          )}
        </div>
      )
    },
    {
      id: 'ai-debug',
      label: 'IA DEBUG',
      content: (
        <div className="text-sm h-full overflow-auto p-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
            <div className="font-medium mb-2 text-gray-800 dark:text-gray-200">Status da IA</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-600 dark:text-gray-400">Modelo ativo:</div>
              <div className="text-gray-800 dark:text-gray-200">codellama:13b</div>
              
              <div className="text-gray-600 dark:text-gray-400">Status:</div>
              <div className="text-green-600 dark:text-green-400">Conectado</div>
              
              <div className="text-gray-600 dark:text-gray-400">Tokens utilizados:</div>
              <div className="text-gray-800 dark:text-gray-200">1,234 / 10,000</div>
              
              <div className="text-gray-600 dark:text-gray-400">Tempo de resposta:</div>
              <div className="text-gray-800 dark:text-gray-200">234ms</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="font-medium mb-2 text-gray-800 dark:text-gray-200">Eventos Recentes</div>
            <div className="space-y-2 text-xs">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between mb-1">
                    <span className="text-blue-600 dark:text-blue-400">Requisição #{i}</span>
                    <span className="text-gray-500 dark:text-gray-400">há {i} min</span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    Solicitação de completação de código processada com sucesso.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Abas */}
      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`
                px-4 py-2 text-xs font-medium
                ${activeTabId === tab.id
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750'}
                transition-colors duration-200
              `}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button 
          onClick={onClose}
          className="px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Fechar painel"
        >
          <FiX size={16} />
        </button>
      </div>
      
      {/* Conteúdo da aba ativa */}
      <div className="flex-1 overflow-hidden">
        {tabs.find(tab => tab.id === activeTabId)?.content}
      </div>
    </div>
  );
};

export default BottomPanelArea; 