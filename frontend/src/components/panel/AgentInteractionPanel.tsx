import React, { useState, useRef, useEffect, FC } from 'react';
import { FiSend, FiRefreshCw, FiX, FiMaximize, FiMinimize, FiTerminal, FiCode, FiBox, FiLoader } from 'react-icons/fi';
import { useActiveChatContext } from '../../context/ActiveChatContext';
import { useAgentContext } from '../../context/AgentContext';
import { ApiChatMessage, AgentType as ApiAgentType } from '../../services/agent-api.service';

const agentTypeDisplayNames: Record<ApiAgentType, string> = {
    [ApiAgentType.PRODUCT]: "Product Agent",
    [ApiAgentType.CODER]: "Coder Agent",
    [ApiAgentType.TEST]: "Test Agent",
    [ApiAgentType.SECURITY]: "Security Agent",
    [ApiAgentType.REVIEWER]: "Reviewer Agent",
    [ApiAgentType.DEBUGGER]: "Debugger Agent",
    [ApiAgentType.ARCHITECT]: "Architect Agent",
    [ApiAgentType.REQUIREMENTS]: "Requirements Agent",
    [ApiAgentType.DOCUMENTATION]: "Documentation Agent",
    [ApiAgentType.CUSTOM]: "Custom Agent",
};

interface AgentInteractionPanelProps {
  title?: string;
  initialMessage?: string;
  onClose?: () => void;
}

const AgentInteractionPanel: FC<AgentInteractionPanelProps> = ({
  title,
  initialMessage,
  onClose,
}) => {
  const { 
      state: activeChatState, 
      sendMessage: activeSendMessage, 
      currentAgentType,
      orchestratorStatus,
  } = useActiveChatContext();
  
  const { clearSession, deleteSession } = useAgentContext();

  const { 
      activeSessionId,
      sessionDetails,
      messages, 
      isLoadingMessages,
      isSendingMessage, 
      error: activeChatError
  } = activeChatState;

  const currentAgentName = currentAgentType ? agentTypeDisplayNames[currentAgentType] : null;

  let displayStatus: 'loading' | 'thinking' | 'working' | 'waiting' | 'error' | 'idle' = 'idle';
  let statusLabel = "Pronto";
  let statusColor = "text-green-500";
  let isProcessing = isLoadingMessages || isSendingMessage;

  if (activeChatError) {
      displayStatus = 'error';
      statusLabel = `Erro: ${activeChatError.substring(0, 50)}${activeChatError.length > 50 ? '...' : ''}`;
      statusColor = "text-red-500";
      isProcessing = false;
  } else if (isLoadingMessages) {
      displayStatus = 'loading';
      statusLabel = "Carregando Histórico...";
      statusColor = "text-blue-500";
      isProcessing = true;
  } else if (isSendingMessage) {
      displayStatus = 'thinking';
      statusLabel = `${currentAgentName || 'Agente'} está processando...`;
      statusColor = "text-yellow-500";
      isProcessing = true;
  } else if (orchestratorStatus === 'THINKING' || orchestratorStatus === 'PROCESSING') {
      displayStatus = 'working';
      statusLabel = `${currentAgentName || 'Agente'} está ${orchestratorStatus || 'trabalhando'}...`;
      statusColor = "text-yellow-500";
      isProcessing = true;
  } else if (orchestratorStatus === 'WAITING_FOR_USER') {
      displayStatus = 'waiting';
      statusLabel = `${currentAgentName || 'Agente'} aguardando input`;
      statusColor = "text-blue-500";
      isProcessing = false;
  } else if (orchestratorStatus) {
      displayStatus = 'working';
      statusLabel = `${currentAgentName || 'Agente'}: ${orchestratorStatus}`;
      statusColor = "text-purple-500";
      isProcessing = true;
  } else {
       displayStatus = 'idle';
       statusLabel = currentAgentName ? `${currentAgentName} pronto` : "Pronto";
       statusColor = "text-green-500";
       isProcessing = false;
  }
  
  const [input, setInput] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !activeSessionId) return;
    
    activeSendMessage(input);
    setInput('');
    
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearMessages = () => {
    if (activeSessionId) {
        if (window.confirm("Tem certeza que deseja limpar e deletar esta sessão? A ação não pode ser desfeita.")) {
            deleteSession(activeSessionId);
        }
    }
  };

  if (!activeSessionId) {
     return (
       <div className="flex h-full items-center justify-center rounded-md bg-white p-4 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
         Nenhuma sessão ativa.
       </div>
     );
   }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'h-full'}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {sessionDetails?.title || currentAgentName || title || `INTERAÇÃO COM AGENTE`}
          </span>
          <div className="ml-2 flex items-center">
             {isProcessing ? (
                 <FiLoader className={`mr-1 h-3 w-3 animate-spin ${statusColor}`} />
             ) : (
                 <span className={`mr-1 h-2 w-2 rounded-full ${statusColor.replace('text-','bg-')}`}></span>
             )}
            <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-primary-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
            title="Alternar logs"
            onClick={() => setShowLogs(!showLogs)}
          >
            <FiTerminal size={14} />
          </button>
          <button
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-primary-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
            title="Limpar conversa"
            onClick={handleClearMessages}
          >
            <FiRefreshCw size={14} />
          </button>
          <button
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-primary-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
            title={isFullscreen ? "Sair do modo tela cheia" : "Modo tela cheia"}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
          </button>
          {onClose && (
            <button
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
              title="Fechar"
              onClick={onClose}
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden rounded-md bg-white shadow-sm dark:bg-gray-900">
        <div className="flex flex-1 overflow-hidden">
          <div className={`flex-1 overflow-auto p-3 ${showLogs ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="flex flex-col space-y-4">
              {initialMessage && messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
                    <p className="text-gray-700 dark:text-gray-300">{initialMessage}</p>
                  </div>
                </div>
              )}
              
              {messages.map((message: ApiChatMessage) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-100 dark:bg-blue-900/50' 
                        : 'bg-gray-100 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {message.content}
                    </div>
                    
                    {message.metadata && message.role === 'assistant' && (
                      <div className="mt-2">
                        {message.metadata.codeSnippet && (
                          <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <FiCode className="mr-1" />
                              <span>Código gerado</span>
                            </div>
                            <pre className="mt-1 overflow-x-auto text-xs text-gray-800 dark:text-gray-200">
                              {message.metadata.codeSnippet}
                            </pre>
                          </div>
                        )}
                        
                        {message.metadata.files && (
                          <div className="mt-2">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <FiBox className="mr-1" />
                              <span>Arquivos</span>
                            </div>
                            <ul className="mt-1 text-xs text-gray-800 dark:text-gray-200">
                              {message.metadata.files.map((file: string, index: number) => (
                                <li key={index}>{file}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(message.rating !== undefined && message.rating !== null) || message.correction ? (
                            <div className="mt-2 border-t border-gray-200 pt-1 text-xs dark:border-gray-700">
                                {message.rating !== undefined && message.rating !== null && (
                                    <span className={`font-medium ${message.rating > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        Feedback: {message.rating > 0 ? 'Positivo' : 'Negativo'}
                                    </span>
                                )}
                                {message.correction && (
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">Correção: {message.correction}</p>
                                )}
                            </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && displayStatus !== 'loading' && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
                    <div className="flex items-center space-x-1">
                      <FiLoader className="h-4 w-4 animate-spin text-gray-500" /> 
                      <span className='text-xs text-gray-500'>{statusLabel}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {showLogs && (
            <div className="w-1/3 overflow-auto bg-gray-50 p-2 text-xs font-mono dark:bg-gray-800">
              <div className="text-gray-500 dark:text-gray-400">
                <p className="mb-1 text-xs font-medium">LOGS DO AGENTE</p>
                {messages.map((message: ApiChatMessage) => (
                  <div key={`log-${message.id}`} className="mb-1">
                    <span className="text-gray-400 dark:text-gray-500">[{new Date(message.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className={message.role === 'user' ? 'text-blue-500 dark:text-blue-400' : 'text-green-500 dark:text-green-400'}>
                      {message.role === 'user' ? 'USER' : 'ASSISTANT'}:
                    </span>{' '}
                    <span className="text-gray-700 dark:text-gray-300">
                      {message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <form 
          className="border-t border-gray-200 p-3 dark:border-gray-700"
          onSubmit={handleSubmit}
        >
          <div className="relative">
            <textarea
              ref={inputRef}
              rows={1}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400 dark:focus:ring-primary-400"
              placeholder={isProcessing ? 'Aguardando resposta...' : 'Digite sua mensagem (Ctrl+Enter para enviar)'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="absolute bottom-2 right-2 rounded bg-primary-600 px-2 py-1 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
               {isProcessing ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend size={16} />} 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentInteractionPanel; 