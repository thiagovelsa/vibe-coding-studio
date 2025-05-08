import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Switch } from '@headlessui/react';
import { Listbox } from '@headlessui/react';
import { useTheme } from '../../../context/ThemeContext';
import { useAgentContext } from '../../../context/AgentContext';
import { AIModel } from '../../../types';
import { cn } from '../../../lib/utils';
import { CollapsibleSection } from '../../common/CollapsibleSection';

interface SettingsPanelProps {
  className?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = React.memo(({ className }) => {
  const { theme, setTheme } = useTheme();
  const { availableModels, defaultModelId, setDefaultModel } = useAgentContext();
  
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(
    availableModels.find(model => model.id === defaultModelId) || null
  );

  // Estilos memoizados baseados no tema
  const styles = useMemo(() => ({
    switchContainer: `${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`,
    switchToggle: `${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`,
    listboxButton: "relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",
    listboxOptions: "absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10",
    activeOption: "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-white",
    inactiveOption: "text-gray-900 dark:text-gray-100"
  }), [theme]);

  // Funções de callback
  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleModelChange = useCallback((model: AIModel) => {
    setSelectedModel(model);
    setDefaultModel(model.id);
  }, [setDefaultModel]);

  useEffect(() => {
    const model = availableModels.find(m => m.id === defaultModelId);
    if (model) {
      setSelectedModel(model);
    }
  }, [defaultModelId, availableModels]);

  // Função de renderização de opção memoizada
  const renderOption = useCallback(({ active, selected }: { active: boolean, selected: boolean }, model: AIModel) => (
    <>
      <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
        {model.name}
      </span>
      {selected && (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
          {/* Ícone de check */}
        </span>
      )}
    </>
  ), []);

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-4">Configurações</h2>
      
      <CollapsibleSection title="Aparência" defaultOpen={true}>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span>Tema Escuro</span>
            <Switch
              checked={theme === 'dark'}
              onChange={handleThemeToggle}
              className={styles.switchContainer}
            >
              <span className={styles.switchToggle} />
            </Switch>
          </div>
        </div>
      </CollapsibleSection>
      
      <CollapsibleSection title="Modelos de IA" defaultOpen={true}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Modelo Padrão
          </label>
          <Listbox value={selectedModel} onChange={handleModelChange}>
            <div className="relative mt-1">
              <Listbox.Button className={styles.listboxButton}>
                <span className="block truncate">
                  {selectedModel?.name || 'Selecione um modelo'}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  {/* Ícone */}
                </span>
              </Listbox.Button>
              <Listbox.Options className={styles.listboxOptions}>
                {availableModels.map((model) => (
                  <Listbox.Option
                    key={model.id}
                    className={({ active }) =>
                      cn(
                        'relative cursor-pointer select-none py-2 pl-10 pr-4',
                        active ? styles.activeOption : styles.inactiveOption
                      )
                    }
                    value={model}
                  >
                    {(optionProps) => renderOption(optionProps, model)}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
      </CollapsibleSection>
    </div>
  );
});

export default SettingsPanel; 