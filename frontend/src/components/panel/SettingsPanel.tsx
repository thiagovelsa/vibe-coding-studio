import React, { useState, useCallback } from 'react';
import { FiSun, FiMoon, FiCode, FiPackage, FiHardDrive, FiGlobe, FiAlertCircle } from 'react-icons/fi';

const SettingsPanel = React.memo(() => {
  const [activeCategory, setActiveCategoryState] = useState('aparencia');
  
  const categories = [
    { id: 'aparencia', label: 'Aparência', icon: <FiSun size={16} /> },
    { id: 'editor', label: 'Editor', icon: <FiCode size={16} /> },
    { id: 'extensoes', label: 'Extensões', icon: <FiPackage size={16} /> },
    { id: 'workspace', label: 'Workspace', icon: <FiHardDrive size={16} /> },
    { id: 'ai', label: 'Configurações IA', icon: <FiGlobe size={16} /> },
    { id: 'avancado', label: 'Avançado', icon: <FiAlertCircle size={16} /> }
  ];
  
  // Otimizando o manipulador de mudança de categoria com useCallback
  const setActiveCategory = useCallback((categoryId: string) => {
    setActiveCategoryState(categoryId);
  }, []);
  
  const renderSettings = () => {
    switch (activeCategory) {
      case 'aparencia':
        return (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium">Tema</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="theme-system" 
                    name="theme" 
                    className="mr-2"
                    defaultChecked 
                  />
                  <label htmlFor="theme-system" className="text-sm">Sistema (Usar preferência do sistema operacional)</label>
                </div>
                <div className="flex items-center">
                  <input type="radio" id="theme-light" name="theme" className="mr-2" />
                  <label htmlFor="theme-light" className="flex items-center text-sm">
                    <FiSun size={14} className="mr-2" />
                    Claro
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="radio" id="theme-dark" name="theme" className="mr-2" />
                  <label htmlFor="theme-dark" className="flex items-center text-sm">
                    <FiMoon size={14} className="mr-2" />
                    Escuro
                  </label>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium">Fonte</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Família de fonte
                  </label>
                  <select className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
                    <option>JetBrains Mono</option>
                    <option>Fira Code</option>
                    <option>Menlo</option>
                    <option>Consolas</option>
                    <option>Courier New</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Tamanho da fonte
                  </label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="8" 
                      max="24" 
                      defaultValue="14" 
                      className="mr-2 w-full"
                    />
                    <span className="text-sm">14px</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="font-ligatures" className="mr-2" />
                  <label htmlFor="font-ligatures" className="text-sm">
                    Habilitar ligaturas da fonte
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'editor':
        return (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium">Configurações do Editor</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="word-wrap" className="mr-2" defaultChecked />
                  <label htmlFor="word-wrap" className="text-sm">
                    Quebra de linha automática
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="line-numbers" className="mr-2" defaultChecked />
                  <label htmlFor="line-numbers" className="text-sm">
                    Mostrar números de linha
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="minimap" className="mr-2" defaultChecked />
                  <label htmlFor="minimap" className="text-sm">
                    Mostrar minimap
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="bracket-pairs" className="mr-2" defaultChecked />
                  <label htmlFor="bracket-pairs" className="text-sm">
                    Destacar pares de parênteses/colchetes
                  </label>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium">Formatação</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="format-on-save" className="mr-2" defaultChecked />
                  <label htmlFor="format-on-save" className="text-sm">
                    Formatar ao salvar
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="format-on-paste" className="mr-2" />
                  <label htmlFor="format-on-paste" className="text-sm">
                    Formatar ao colar
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'ai':
        return (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium">Modelos de IA</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Modelo primário
                  </label>
                  <select className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
                    <option>Ollama (Local)</option>
                    <option>OpenAI GPT-4</option>
                    <option>Claude 3</option>
                    <option>Llama 3</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    URL do Servidor (Apenas Ollama)
                  </label>
                  <input 
                    type="text" 
                    defaultValue="http://localhost:11434" 
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
            
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium">Chaves API</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    OpenAI API Key
                  </label>
                  <input 
                    type="password" 
                    placeholder="sk-..." 
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Anthropic API Key
                  </label>
                  <input 
                    type="password" 
                    placeholder="sk-ant-..." 
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecione uma categoria para ver as configurações
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Sidebar de categorias */}
      <div className="w-40 border-r border-gray-200 pr-2 dark:border-gray-700">
        <ul className="space-y-1">
          {categories.map(category => (
            <li key={category.id}>
              <button
                className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm ${
                  activeCategory === category.id
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Área de configurações */}
      <div className="flex-1 overflow-auto p-3">
        <h2 className="mb-4 text-lg font-medium">
          {categories.find(c => c.id === activeCategory)?.label || 'Configurações'}
        </h2>
        
        {renderSettings()}
      </div>
    </div>
  );
});

export default SettingsPanel; 