import React, { useMemo } from 'react';
import { Listbox } from '@headlessui/react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { AIModel } from '../../../context/AgentContext';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: AIModel | null;
  onChange: (model: AIModel) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = React.memo(({ 
  models, 
  selectedModel, 
  onChange 
}) => {
  const { theme } = useTheme();
  
  // Estilos memoizados baseados no tema
  const styles = useMemo(() => ({
    button: cn(
      "relative w-full py-1.5 pl-2 pr-8 text-left rounded-md cursor-default text-sm",
      "border focus:outline-none focus:ring-1",
      theme === 'dark' 
        ? "bg-gray-800 border-gray-700 text-gray-200 focus:ring-purple-500" 
        : "bg-white border-gray-300 text-gray-700 focus:ring-purple-400"
    ),
    options: cn(
      "absolute z-10 w-full mt-1 overflow-auto rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none text-sm",
      theme === 'dark' 
        ? "bg-gray-800 border border-gray-700" 
        : "bg-white"
    ),
    option: (active: boolean, selected: boolean) => cn(
      "cursor-default select-none relative py-2 pl-8 pr-4",
      active
        ? theme === 'dark' ? "bg-gray-700 text-white" : "bg-purple-100 text-purple-900"
        : theme === 'dark' ? "text-gray-200" : "text-gray-900",
      selected && (theme === 'dark' ? "bg-purple-900/50" : "bg-purple-50")
    ),
    icon: cn(
      "absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none",
      theme === 'dark' ? "text-gray-400" : "text-gray-500"
    )
  }), [theme]);

  if (models.length === 0) {
    return (
      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Nenhum modelo disponível
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1 dark:text-gray-300">
        Modelo de IA
      </label>
      <Listbox value={selectedModel} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className={styles.button}>
            <span className="block truncate">
              {selectedModel?.name || 'Selecione um modelo'}
            </span>
            <span className={styles.icon}>
              <FiChevronDown className="w-4 h-4" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Listbox.Options className={styles.options}>
            {models.map((model) => (
              <Listbox.Option
                key={model.id}
                value={model}
                className={({ active }) => styles.option(active, selectedModel?.id === model.id)}
              >
                {({ selected }) => (
                  <>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-purple-600 dark:text-purple-400">
                        <FiCheck className="w-4 h-4" aria-hidden="true" />
                      </span>
                    )}
                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                      {model.name}
                    </span>
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
});

export default ModelSelector; 