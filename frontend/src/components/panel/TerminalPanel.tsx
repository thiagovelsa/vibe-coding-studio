import { useState, useRef, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const TerminalPanel = () => {
  const [terminalLines, setTerminalLines] = useState([
    { id: 1, content: 'VibeForge Terminal v0.1.0', type: 'system' },
    { id: 2, content: 'Digite um comando ou digite "help" para ver a lista de comandos.', type: 'system' },
    { id: 3, content: '~$', type: 'prompt' }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-rolar para o final quando novas linhas são adicionadas
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);
  
  // Manter foco no input
  useEffect(() => {
    const focusInput = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && 
          !e.target.classList.contains('terminal-button')) {
        inputRef.current?.focus();
      }
    };
    
    document.addEventListener('click', focusInput);
    return () => document.removeEventListener('click', focusInput);
  }, []);
  
  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInput.trim()) return;
    
    // Adicionar comando ao histórico
    const newCommandId = terminalLines.length + 1;
    setTerminalLines([
      ...terminalLines,
      { id: newCommandId, content: currentInput, type: 'command' }
    ]);
    
    // Processar comandos básicos
    let response: {id: number; content: string; type: string}[] = [];
    
    if (currentInput.toLowerCase() === 'clear') {
      // Limpar terminal mas manter o prompt inicial
      setTerminalLines([
        { id: 1, content: 'VibeForge Terminal v0.1.0', type: 'system' },
        { id: 2, content: '~$', type: 'prompt' }
      ]);
    } else if (currentInput.toLowerCase() === 'help') {
      response = [
        { id: newCommandId + 1, content: 'Comandos disponíveis:', type: 'system' },
        { id: newCommandId + 2, content: '  help     - Mostra esta ajuda', type: 'system' },
        { id: newCommandId + 3, content: '  clear    - Limpa o terminal', type: 'system' },
        { id: newCommandId + 4, content: '  echo     - Exibe uma mensagem', type: 'system' },
        { id: newCommandId + 5, content: '  version  - Mostra a versão atual', type: 'system' },
        { id: newCommandId + 6, content: '~$', type: 'prompt' }
      ];
    } else if (currentInput.startsWith('echo ')) {
      const message = currentInput.substring(5);
      response = [
        { id: newCommandId + 1, content: message, type: 'output' },
        { id: newCommandId + 2, content: '~$', type: 'prompt' }
      ];
    } else if (currentInput.toLowerCase() === 'version') {
      response = [
        { id: newCommandId + 1, content: 'VibeForge IDE v0.1.0', type: 'system' },
        { id: newCommandId + 2, content: 'Node.js v16.15.0', type: 'system' },
        { id: newCommandId + 3, content: 'React v18.2.0', type: 'system' },
        { id: newCommandId + 4, content: 'Vite v4.4.5', type: 'system' },
        { id: newCommandId + 5, content: '~$', type: 'prompt' }
      ];
    } else {
      response = [
        { id: newCommandId + 1, content: `Comando não reconhecido: ${currentInput}`, type: 'error' },
        { id: newCommandId + 2, content: 'Digite "help" para ver a lista de comandos disponíveis.', type: 'system' },
        { id: newCommandId + 3, content: '~$', type: 'prompt' }
      ];
    }
    
    // Adicionar resposta e novo prompt
    if (currentInput.toLowerCase() !== 'clear') {
      setTerminalLines(prev => [...prev, ...response]);
    }
    
    // Adicionar ao histórico de comandos
    setCommandHistory(prev => [currentInput, ...prev]);
    setHistoryIndex(-1);
    setCurrentInput('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Navegação pelo histórico de comandos
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(nextIndex);
      if (nextIndex >= 0 && commandHistory[nextIndex]) {
        setCurrentInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(nextIndex);
      if (nextIndex >= 0) {
        setCurrentInput(commandHistory[nextIndex]);
      } else {
        setCurrentInput('');
      }
    }
  };
  
  const clearTerminal = () => {
    setTerminalLines([
      { id: 1, content: 'VibeForge Terminal v0.1.0', type: 'system' },
      { id: 2, content: '~$', type: 'prompt' }
    ]);
  };
  
  return (
    <div className="h-full">
      {/* Barra de ferramentas do terminal */}
      <div className="mb-2 flex justify-end space-x-1">
        <button 
          className="terminal-button rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Novo terminal"
        >
          <FiPlus size={14} />
        </button>
        <button 
          className="terminal-button rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Limpar terminal"
          onClick={clearTerminal}
        >
          <FiTrash2 size={14} />
        </button>
      </div>
      
      {/* Área do terminal */}
      <div 
        className="flex h-[calc(100%-30px)] flex-col overflow-auto rounded bg-black p-2 font-mono text-sm text-green-400"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex-1">
          {terminalLines.map((line) => (
            <div 
              key={line.id} 
              className={
                line.type === 'error' 
                  ? 'text-red-400' 
                  : line.type === 'system' 
                    ? 'text-blue-400' 
                    : line.type === 'command' 
                      ? 'pl-6 text-white' 
                      : ''
              }
            >
              {line.type === 'command' ? `~$ ${line.content}` : line.content}
            </div>
          ))}
          <div className="flex items-center">
            {terminalLines[terminalLines.length - 1].type !== 'prompt' && (
              <span className="mr-1">~$</span>
            )}
            <form onSubmit={handleCommand} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-white outline-none"
                autoFocus
              />
            </form>
          </div>
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};

export default TerminalPanel; 