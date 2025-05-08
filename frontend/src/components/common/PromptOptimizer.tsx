import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiRefreshCw, FiZap, FiAlertCircle } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext'; // Ajuste o caminho conforme necessário

// --- Tipos e Dados Placeholder ---
/*
type OptimizationMode = 'conciseness' | 'clarity' | 'creativity';
const optimizationModes: { id: OptimizationMode; label: string }[] = [...];
*/

interface PromptOptimizerProps {
  isOpen: boolean;
  onClose: () => void;
  originalPrompt: string;
  onAccept: (optimizedPrompt: string) => void;
  // Opcional: Uma função real de otimização passada como prop
  // optimizeFunction?: (prompt: string, mode: OptimizationMode) => Promise<string>;
  optimizeFunction?: (originalPrompt: string) => Promise<string | null>; // Função que chama o backend
  isLoading?: boolean; // Estado de loading vindo do contexto
  optimizedResult?: string | null; // Resultado otimizado vindo do contexto
  error?: string | null; // Erro vindo do contexto
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ 
    isOpen, 
    onClose, 
    originalPrompt, 
    onAccept,
    // optimizeFunction 
    optimizeFunction, // <<< Receber função
    isLoading = false, // <<< Usar prop ou default
    optimizedResult = null, // <<< Usar prop ou default
    error = null, // <<< Usar prop ou default
}) => {
  const { theme } = useTheme();
  const [currentPrompt, setCurrentPrompt] = useState(originalPrompt);
  const [userFeedback, setUserFeedback] = useState('');
  // const [optimizedPrompt, setOptimizedPrompt] = useState('');
  // const [isOptimizing, setIsOptimizing] = useState(false);

  // Seletor de Modo (Removido por simplicidade, poderia ser re-adicionado)
  // const [selectedMode, setSelectedMode] = useState<OptimizationMode>('clarity');

  const handleOptimize = useCallback(async () => {
      if (optimizeFunction) {
          // O estado de loading é gerenciado pelo contexto
          await optimizeFunction(originalPrompt);
          // O resultado (ou erro) atualizará as props optimizedResult/error
      } else {
          console.warn("optimizeFunction prop not provided to PromptOptimizer.");
          // Poderia mostrar um erro na UI aqui
      }
  }, [optimizeFunction, originalPrompt]);

  const handleAcceptClick = () => {
    // Aceitar se houver resultado e não estiver carregando
    if (optimizedResult && !isLoading) {
      onAccept(optimizedResult);
      onClose();
    }
  };

  // --- Estilos Dinâmicos ---
  const modalBg = theme === 'dark' ? 'bg-gray-900/30' : 'bg-white/30';
  const panelBg = theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/85';
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const secondaryTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  // const pillBg = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/70';
  // const activePillBg = ... (Removido se não usar modos)
  const textAreaBg = theme === 'dark' ? 'bg-black/10' : 'bg-gray-500/5';
  const buttonBg = theme === 'dark' ? 'bg-gray-700/60 hover:bg-gray-600/80' : 'bg-gray-200/80 hover:bg-gray-300/90';
  const acceptButtonBg = theme === 'dark' ? 'bg-purple-600/80 hover:bg-purple-500/90' : 'bg-purple-500/90 hover:bg-purple-600/90';
  const errorBg = theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100/70';
  const errorBorder = theme === 'dark' ? 'border-red-700/50' : 'border-red-400/50';
  const errorText = theme === 'dark' ? 'text-red-300' : 'text-red-700';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={`fixed inset-0 ${modalBg} backdrop-blur-sm`} />
        </Transition.Child>

        {/* Modal Content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`
                  w-full max-w-3xl transform overflow-hidden rounded-2xl 
                  ${panelBg} ${textColor} backdrop-blur-lg
                  p-6 text-left align-middle shadow-xl transition-all
                `}
              >
                {/* Header */}
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 flex justify-between items-center">
                  Otimizador de Prompt (Varinha Mágica ✨)
                  <button 
                    onClick={onClose}
                    className={`p-1 rounded-full ${buttonBg} ${secondaryTextColor} hover:text-red-500 transition-colors`} 
                    aria-label="Fechar"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </Dialog.Title>
                
                {/* Botão de Otimizar (agora no header ou local dedicado) */}
                <div className="mt-4 flex justify-end">
                    <button 
                      onClick={handleOptimize}
                      disabled={isLoading || !optimizeFunction} // <<< Desabilitar se carregando ou sem função
                      className={`p-2 rounded-lg ${buttonBg} ${secondaryTextColor} ${isLoading || !optimizeFunction ? 'opacity-50 cursor-not-allowed' : 'hover:text-purple-500'} transition-colors flex items-center text-sm`} 
                      aria-label="Otimizar"
                      title="Otimizar Prompt"
                    >
                      {isLoading ? <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FiZap className="w-4 h-4 mr-2" />}
                      {isLoading ? 'Otimizando...' : 'Otimizar'}
                    </button>
                 </div>

                {/* Visualização Lado a Lado */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="flex flex-col space-y-1">
                    <label className={`text-xs font-semibold ${secondaryTextColor}`}>Original</label>
                    <textarea
                      readOnly
                      value={originalPrompt}
                      rows={8} // Aumentar um pouco?
                      className={`w-full p-3 rounded-lg ${textAreaBg} text-sm outline-none resize-none border ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} custom-scrollbar`}
                    />
                  </div>
                  {/* Otimizado */}
                  <div className="flex flex-col space-y-1 relative">
                    <label className={`text-xs font-semibold ${secondaryTextColor}`}>Otimizado</label>
                    <textarea
                      readOnly
                      value={optimizedResult || ''} // <<< Usar resultado da prop
                      rows={8}
                      placeholder={isLoading ? 'Otimizando...' : 'Clique em Otimizar'}
                      className={`w-full p-3 rounded-lg ${textAreaBg} text-sm outline-none resize-none border ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} custom-scrollbar ${isLoading ? 'opacity-60' : ''}`}
                    />
                    {/* Overlay de Loading */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30 rounded-lg">
                            <FiRefreshCw className={`w-6 h-6 ${secondaryTextColor} animate-spin`} />
                        </div>
                    )}
                  </div>
                </div>

                {/* Exibição de Erro */}
                {error && !isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 p-3 rounded-lg border ${errorBg} ${errorBorder} ${errorText} text-xs flex items-start space-x-2`}
                    >
                        <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Erro na otimização: {error}</span>
                    </motion.div>
                )}

                {/* Botões de Ação */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${buttonBg} ${secondaryTextColor} transition-colors`}
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!optimizedResult || isLoading} // <<< Desabilitar se sem resultado ou carregando
                    className={`px-5 py-2 rounded-lg text-sm font-medium text-white ${acceptButtonBg} ${(!optimizedResult || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} transition-all`}
                    onClick={handleAcceptClick}
                  >
                    <FiCheck className="w-4 h-4 inline mr-1.5"/>
                    Aceitar Otimizado
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// export default PromptOptimizer; 