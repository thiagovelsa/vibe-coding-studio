import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiHelpCircle, FiCommand } from 'react-icons/fi';
import useKeyboardShortcuts, { KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';
import useTransition from '../../hooks/useTransition';

interface KeyboardShortcutsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutCategory {
  id: string;
  name: string;
  shortcuts: KeyboardShortcut[];
}

const KeyboardShortcutsGuide: React.FC<KeyboardShortcutsGuideProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { activeShortcuts, formatShortcut } = useKeyboardShortcuts([], 'global');

  // Hook para animação de transição
  const transition = useTransition({
    timeout: { enter: 250, exit: 200 },
    initialEntered: isOpen,
  });

  // Atualiza o estado de transição quando isOpen muda
  useEffect(() => {
    if (isOpen) {
      transition.enter();
    } else {
      transition.exit();
    }
  }, [isOpen]);

  // Agrupa atalhos por categoria
  const categories: ShortcutCategory[] = [
    {
      id: 'general',
      name: 'Geral',
      shortcuts: activeShortcuts.filter((s) => !s.scope || s.scope === 'global'),
    },
    {
      id: 'editor',
      name: 'Editor',
      shortcuts: activeShortcuts.filter((s) => s.scope === 'editor'),
    },
    {
      id: 'files',
      name: 'Arquivos',
      shortcuts: activeShortcuts.filter((s) => s.scope === 'files'),
    },
    {
      id: 'navigation',
      name: 'Navegação',
      shortcuts: activeShortcuts.filter((s) => s.scope === 'navigation'),
    },
    {
      id: 'ai',
      name: 'Assistentes IA',
      shortcuts: activeShortcuts.filter((s) => s.scope === 'ai'),
    },
  ].filter((category) => category.shortcuts.length > 0);

  // Define a categoria ativa quando o modal é aberto
  useEffect(() => {
    if (isOpen && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [isOpen, categories, activeCategory]);

  // Filtrar atalhos de acordo com a pesquisa
  const getFilteredShortcuts = (shortcuts: KeyboardShortcut[]) => {
    if (!searchQuery) return shortcuts;
    
    return shortcuts.filter((shortcut) => 
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatShortcut(shortcut).toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Formatar tecla para exibição
  const formatKeyForDisplay = (key: string) => {
    const specialKeys: Record<string, string> = {
      Control: 'Ctrl',
      Alt: 'Alt',
      Shift: 'Shift',
      Meta: 'Meta',
      Enter: '↵',
      Escape: 'Esc',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      Tab: 'Tab',
      ' ': 'Espaço',
    };

    return specialKeys[key] || key;
  };

  // Renderizar combinação de teclas
  const renderKeyCombination = (shortcut: KeyboardShortcut) => {
    const keys: string[] = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.metaKey) keys.push('Meta');
    
    keys.push(formatKeyForDisplay(shortcut.key));
    
    return (
      <div className="flex items-center space-x-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="min-w-[1.5rem] rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-gray-400">+</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Se não está visível depois da animação de saída, não renderize nada
  if (!transition.visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black 
        ${transition.state === 'entering' || transition.state === 'entered' 
          ? 'bg-opacity-50' 
          : 'bg-opacity-0'} 
        transition-opacity duration-300`}
    >
      <div
        className={`w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800
          ${transition.state === 'entering' || transition.state === 'entered'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95'} 
          transition-all duration-300`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center">
            <FiCommand className="mr-2 text-primary-500" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Atalhos de teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            <FiX />
          </button>
        </div>
        
        {/* Pesquisa */}
        <div className="border-b border-gray-200 px-6 py-3 dark:border-gray-700">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder="Pesquisar atalho..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="flex max-h-[70vh] flex-col md:flex-row">
          {/* Categorias (sidebar) */}
          {!searchQuery && categories.length > 0 && (
            <div className="w-full border-b border-gray-200 md:w-1/4 md:border-b-0 md:border-r md:dark:border-gray-700">
              <nav className="space-y-1 p-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
                      activeCategory === category.id
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                    <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-600">
                      {category.shortcuts.length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          )}
          
          {/* Lista de atalhos */}
          <div className="flex-1 overflow-y-auto p-6">
            {searchQuery ? (
              // Resultados da pesquisa
              <>
                <h3 className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Resultados da pesquisa
                </h3>
                <div className="space-y-6">
                  {categories.map((category) => {
                    const filteredShortcuts = getFilteredShortcuts(category.shortcuts);
                    if (filteredShortcuts.length === 0) return null;
                    
                    return (
                      <div key={category.id}>
                        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {category.name}
                        </h4>
                        <div className="rounded-md border border-gray-200 dark:border-gray-700">
                          {filteredShortcuts.map((shortcut) => (
                            <div
                              key={shortcut.id}
                              className="flex items-center justify-between border-t border-gray-200 px-4 py-3 first:border-t-0 dark:border-gray-700"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {shortcut.description}
                              </span>
                              {renderKeyCombination(shortcut)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Sem resultados */}
                  {categories.every((category) => 
                    getFilteredShortcuts(category.shortcuts).length === 0
                  ) && (
                    <div className="flex h-32 flex-col items-center justify-center rounded-md border border-gray-200 dark:border-gray-700">
                      <FiHelpCircle className="mb-2 text-3xl text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum atalho encontrado para "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Visualização por categoria
              activeCategory && (
                <div className="space-y-4">
                  {categories
                    .filter((category) => category.id === activeCategory)
                    .map((category) => (
                      <div key={category.id}>
                        <h3 className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                          {category.name}
                        </h3>
                        <div className="rounded-md border border-gray-200 divide-y divide-gray-200 dark:border-gray-700 dark:divide-gray-700">
                          {category.shortcuts.length > 0 ? (
                            category.shortcuts.map((shortcut) => (
                              <div
                                key={shortcut.id}
                                className="flex items-center justify-between px-4 py-3"
                              >
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {shortcut.description}
                                </span>
                                {renderKeyCombination(shortcut)}
                              </div>
                            ))
                          ) : (
                            <div className="flex h-32 flex-col items-center justify-center">
                              <FiHelpCircle className="mb-2 text-3xl text-gray-400" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Nenhum atalho registrado nesta categoria
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )
            )}
            
            {/* Sem atalhos registrados */}
            {activeShortcuts.length === 0 && (
              <div className="flex h-32 flex-col items-center justify-center rounded-md border border-gray-200 dark:border-gray-700">
                <FiHelpCircle className="mb-2 text-3xl text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum atalho de teclado registrado
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Rodapé */}
        <div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <p>
            Dica: Pressione <kbd className="inline-block min-w-[1.5rem] rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">?</kbd> a qualquer momento para abrir esta referência.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsGuide; 