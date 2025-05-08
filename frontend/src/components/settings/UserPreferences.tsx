import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiMonitor, FiCode } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Tooltip from '../common/Tooltip';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ isOpen, onClose }) => {
  // Preferências do editor
  const [fontSize, setFontSize] = useLocalStorage('vf-font-size', 14);
  const [fontFamily, setFontFamily] = useLocalStorage('vf-font-family', 'Menlo, Monaco, "Courier New", monospace');
  const [showMinimap, setShowMinimap] = useLocalStorage('vf-show-minimap', true);
  const [wordWrap, setWordWrap] = useLocalStorage('vf-word-wrap', 'off');
  const [tabSize, setTabSize] = useLocalStorage('vf-tab-size', 2);
  const [showLineNumbers, setShowLineNumbers] = useLocalStorage('vf-show-line-numbers', true);
  
  // Preferências da interface
  const [sidebarPosition, setSidebarPosition] = useLocalStorage('vf-sidebar-position', 'left');
  const [preferredLanguage, setPreferredLanguage] = useLocalStorage('vf-language', 'pt-BR');
  const [animationsEnabled, setAnimationsEnabled] = useLocalStorage('vf-animations-enabled', true);
  
  // Estado temporário para mudanças antes de salvar
  const [tempSettings, setTempSettings] = useState({
    fontSize,
    fontFamily,
    showMinimap,
    wordWrap,
    tabSize,
    showLineNumbers,
    sidebarPosition,
    preferredLanguage,
    animationsEnabled,
  });

  const { currentTheme } = useTheme();

  // Sincroniza com as preferências carregadas
  useEffect(() => {
    setTempSettings({
      fontSize,
      fontFamily,
      showMinimap,
      wordWrap,
      tabSize,
      showLineNumbers,
      sidebarPosition,
      preferredLanguage,
      animationsEnabled,
    });
  }, [
    fontSize, fontFamily, showMinimap, wordWrap, tabSize, showLineNumbers,
    sidebarPosition, preferredLanguage, animationsEnabled,
  ]);

  if (!isOpen) return null;

  const fontOptions = [
    'Menlo, Monaco, "Courier New", monospace',
    '"Fira Code", monospace',
    '"Source Code Pro", monospace',
    '"JetBrains Mono", monospace',
    'Consolas, "Courier New", monospace',
  ];

  const handleSave = () => {
    // Aplicar todas as configurações
    setFontSize(tempSettings.fontSize);
    setFontFamily(tempSettings.fontFamily);
    setShowMinimap(tempSettings.showMinimap);
    setWordWrap(tempSettings.wordWrap);
    setTabSize(tempSettings.tabSize);
    setShowLineNumbers(tempSettings.showLineNumbers);
    setSidebarPosition(tempSettings.sidebarPosition);
    setPreferredLanguage(tempSettings.preferredLanguage);
    setAnimationsEnabled(tempSettings.animationsEnabled);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Preferências do Usuário</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Fechar"
          >
            <FiX />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Seção de Aparência */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center">
              <FiMonitor className="mr-2 text-primary-500" />
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Aparência</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700 md:grid-cols-2">
              {/* Tema */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tema
                </label>
                <div className="flex items-center">
                  <span className="mr-3 text-sm text-gray-700 dark:text-gray-300">Claro</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={currentTheme === 'light'}
                      onChange={() => {}}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                  </label>
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Escuro</span>
                </div>
              </div>

              {/* Animações */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Animações da Interface
                </label>
                <div className="flex items-center">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={tempSettings.animationsEnabled}
                      onChange={() => setTempSettings({...tempSettings, animationsEnabled: !tempSettings.animationsEnabled})}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                  </label>
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    {tempSettings.animationsEnabled ? 'Ativadas' : 'Desativadas'}
                  </span>
                </div>
              </div>

              {/* Posição da Sidebar */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Posição da Barra Lateral
                </label>
                <select
                  value={tempSettings.sidebarPosition}
                  onChange={(e) => setTempSettings({...tempSettings, sidebarPosition: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="left">Esquerda</option>
                  <option value="right">Direita</option>
                </select>
              </div>

              {/* Idioma */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idioma
                </label>
                <select
                  value={tempSettings.preferredLanguage}
                  onChange={(e) => setTempSettings({...tempSettings, preferredLanguage: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção de Editor */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center">
              <FiCode className="mr-2 text-primary-500" />
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Editor de Código</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700 md:grid-cols-2">
              {/* Fonte */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fonte do Editor
                </label>
                <select
                  value={tempSettings.fontFamily}
                  onChange={(e) => setTempSettings({...tempSettings, fontFamily: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font.split(',')[0].replace(/"/g, '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tamanho da Fonte */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tamanho da Fonte: {tempSettings.fontSize}px
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={tempSettings.fontSize}
                    onChange={(e) => setTempSettings({...tempSettings, fontSize: parseInt(e.target.value)})}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-600"
                  />
                </div>
              </div>

              {/* Word Wrap */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quebra de Linha
                </label>
                <select
                  value={tempSettings.wordWrap}
                  onChange={(e) => setTempSettings({...tempSettings, wordWrap: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="off">Desativada</option>
                  <option value="on">Ativada</option>
                  <option value="wordWrapColumn">Na Coluna</option>
                  <option value="bounded">Limitada</option>
                </select>
              </div>

              {/* Tamanho da Tab */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tamanho da Tabulação
                </label>
                <select
                  value={tempSettings.tabSize}
                  onChange={(e) => setTempSettings({...tempSettings, tabSize: parseInt(e.target.value)})}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="2">2 espaços</option>
                  <option value="4">4 espaços</option>
                  <option value="8">8 espaços</option>
                </select>
              </div>

              {/* Opções de Visualização */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Opções de Visualização
                </label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <input
                      id="minimap"
                      type="checkbox"
                      checked={tempSettings.showMinimap}
                      onChange={() => setTempSettings({...tempSettings, showMinimap: !tempSettings.showMinimap})}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                    />
                    <label htmlFor="minimap" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mostrar Minimapa
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="lineNumbers"
                      type="checkbox"
                      checked={tempSettings.showLineNumbers}
                      onChange={() => setTempSettings({...tempSettings, showLineNumbers: !tempSettings.showLineNumbers})}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                    />
                    <label htmlFor="lineNumbers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mostrar Números de Linha
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Tooltip content="Descartar alterações" position="top">
            <button
              onClick={onClose}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <FiX className="mr-2" />
              Cancelar
            </button>
          </Tooltip>
          
          <Tooltip content="Salvar todas as alterações" position="top">
            <button
              onClick={handleSave}
              className="flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <FiSave className="mr-2" />
              Salvar
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences; 