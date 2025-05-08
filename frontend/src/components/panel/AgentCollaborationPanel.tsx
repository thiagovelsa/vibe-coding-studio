import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FiSend, FiZap, FiUser, FiCpu, FiShield, FiCheck, FiLoader, FiPlay, FiTarget, FiClipboard, FiMessageSquare, FiCopy, FiRefreshCw, FiSearch, FiChevronUp, FiChevronDown, FiX, FiThumbsUp, FiThumbsDown, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeProvider';
import { useAgentContext } from '../../context/AgentContext';
import { useActiveChatContext } from '../../context/ActiveChatContext';
import { ApiChatMessage, AgentType as ApiAgentType, SendMessageOptions } from '../../services/agent-api.service';
import { AnimatedDiv } from '../common/AnimatedDiv';
import { AnimatedButton } from '../common/AnimatedButton';
import { variants } from '../../lib/animations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism as atomLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeViewer } from '../common/CodeViewer';
import { toast } from 'react-toastify';
import { PromptOptimizer } from '../common/PromptOptimizer';
import { Logger } from '../../utils/Logger';
import { FeedbackPopover } from '../common/FeedbackPopover';

// --- Remover Placeholder Types & Data --- (Não são mais necessários com o contexto)
/*
type MessageSender = 'user' | { agentId: string; name: string; avatar?: string };
interface Message { ... }
interface AgentState { ... }
const initialAgents: AgentState[] = [ ... ];
const initialMessages: Message[] = [ ... ];
*/
// --- Fim Placeholders ---

interface AgentCollaborationPanelProps {
  // sessionId: string; // <<< REMOVER sessionId prop
}

// --- Sub Components ---

// Avatar unificado que usa ApiAgentType
const AgentTypeAvatar = React.memo<{ agentType: ApiAgentType, theme: 'light' | 'dark' }>(({ agentType, theme }) => {
    const bgColor = theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-200/50';
    // Usar ApiAgentType aqui
    const agentTypeIcons: Record<ApiAgentType, React.ElementType> = { 
        [ApiAgentType.PRODUCT]: FiUser,
        [ApiAgentType.CODER]: FiCpu,
        [ApiAgentType.TEST]: FiCheck,
        [ApiAgentType.SECURITY]: FiShield
    };
    const IconComp = agentTypeIcons[agentType] || FiCpu; // Default icon
    return (
        <div className={`w-7 h-7 rounded-full ${bgColor} flex items-center justify-center mr-2 flex-shrink-0 border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <IconComp className="w-4 h-4" />
        </div>
    );
});

// Componente de Mensagem Unificado - Atualizado para ApiChatMessage
interface ChatMessageBubbleProps {
  message: ApiChatMessage; // Usar o tipo da API
  theme: 'light' | 'dark';
  contextIds: RelevantContextIds;
  // onResend removido, tratado internamente se necessário
}

// Interface para os IDs contextuais relevantes para uma mensagem
interface RelevantContextIds {
    lastCoderMsgId?: string;
    lastProductMsgId?: string;
    lastTestResultMsgId?: string;
    lastSecurityAnalysisMsgId?: string;
    lastTestGenerationMsgId?: string;
    // Adicionar mais conforme necessário (ex: último coder fix, etc.)
}

const ChatMessageBubble = React.memo<ChatMessageBubbleProps>(({ message, theme, contextIds }) => {
    // Obter triggers e lastTriggerResult do AgentContext
    const { 
        state: agentState, // Apenas para lastTriggerResult
        triggerTestGeneration, 
        triggerSecurityAnalysis,
        triggerTestSimulation,
        triggerTestFixValidation,
        triggerSecurityFixVerification 
    } = useAgentContext(); 
    const { lastTriggerResult } = agentState;

    // Obter feedback do ActiveChatContext
    const { addFeedback } = useActiveChatContext(); // <<< Usar ActiveChatContext para feedback
    const sessionId = message.sessionId; // Obter sessionId da mensagem

    const [pendingTriggerType, setPendingTriggerType] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false); 
    const [showFeedbackPopover, setShowFeedbackPopover] = useState(false);
    const [feedbackCorrection, setFeedbackCorrection] = useState(message.correction || '');

    const isUser = message.role === 'user';
    const agentType = message.metadata?.agentType as ApiAgentType | undefined; 
    const structuredOutput = message.metadata?.structuredOutput;

    // --- Lógica para Determinar Visibilidade dos Botões --- 
    const showGenerateTests = 
        !isUser && 
        agentType === ApiAgentType.CODER && 
        structuredOutput?.code &&
        sessionId; // Precisa de sessão ativa

    const showAnalyzeSecurity = 
        !isUser && 
        agentType === ApiAgentType.CODER && 
        structuredOutput?.code &&
        sessionId;

    const showSimulateTests = 
        !isUser &&
        agentType === ApiAgentType.TEST &&
        structuredOutput?.testFiles && Array.isArray(structuredOutput.testFiles) && structuredOutput.testFiles.length > 0 &&
        contextIds.lastCoderMsgId && // Precisa do ID do código original
        sessionId;

    const showValidateTestFix = 
        !isUser &&
        agentType === ApiAgentType.CODER &&
        structuredOutput?.code && // Precisa do código corrigido atual
        contextIds.lastTestResultMsgId && // Precisa do ID do resultado anterior
        sessionId;

     const showValidateSecurityFix = 
        !isUser &&
        agentType === ApiAgentType.CODER &&
        structuredOutput?.code && // Precisa do código corrigido atual
        contextIds.lastSecurityAnalysisMsgId && // Precisa do ID da análise anterior
        sessionId;

    // --- Handlers (Updated with Pending State) --- 
    const handleGenerateTestsClick = () => {
        if (!sessionId || !showGenerateTests || pendingTriggerType) return; // Ignora se já pendente
        setPendingTriggerType('testGeneration');
        triggerTestGeneration({ 
            sessionId,
            coderMessageId: message.id,
            productMessageId: contextIds.lastProductMsgId, 
        });
    };

    const handleAnalyzeSecurityClick = () => {
        if (!sessionId || !showAnalyzeSecurity || pendingTriggerType) return;
        setPendingTriggerType('securityAnalysis');
         triggerSecurityAnalysis({ 
            sessionId,
            coderMessageId: message.id,
            productMessageId: contextIds.lastProductMsgId,
        });
    };

     const handleSimulateTestsClick = () => {
        if (!sessionId || !showSimulateTests || !contextIds.lastCoderMsgId || pendingTriggerType) return; 
        setPendingTriggerType('testSimulation');
         triggerTestSimulation({ 
            sessionId,
            coderMessageId: contextIds.lastCoderMsgId, 
            testGenMessageId: message.id, 
        });
    };

    const handleValidateTestFixClick = () => {
        if (!sessionId || !showValidateTestFix || !contextIds.lastTestResultMsgId || pendingTriggerType) return;
        setPendingTriggerType('testFixValidation');
         triggerTestFixValidation({ 
            sessionId,
            coderFixMessageId: message.id, 
            testResultMessageId: contextIds.lastTestResultMsgId,
            originalCoderMessageId: contextIds.lastCoderMsgId, 
        });
    };

     const handleValidateSecurityFixClick = () => {
        if (!sessionId || !showValidateSecurityFix || !contextIds.lastSecurityAnalysisMsgId || pendingTriggerType) return;
        setPendingTriggerType('securityFixVerification');
        triggerSecurityFixVerification({ 
            sessionId,
            coderFixMessageId: message.id, 
            securityAnalysisMessageId: contextIds.lastSecurityAnalysisMsgId,
            originalCoderMessageId: contextIds.lastCoderMsgId, 
        });
    };

    // --- Efeito para limpar o estado de pending local quando o resultado global chega --- 
    useEffect(() => {
        if (lastTriggerResult && pendingTriggerType) {
            const { event } = lastTriggerResult;
            // Mapeia o tipo pendente para o nome do evento esperado
            const expectedEventPrefix = `result:trigger:${pendingTriggerType}`;
            const expectedErrorPrefix = `error:trigger`; // Erros podem vir de qualquer trigger
            
            // Verifica se o evento recebido (sucesso ou erro) corresponde ao trigger pendente
            // Ou se é um erro genérico (poderia limpar em caso de qualquer erro tbm)
            if (event?.startsWith(expectedEventPrefix) || (event?.startsWith(expectedErrorPrefix) /* && Limpar erro tbm? */ )) {
                 setPendingTriggerType(null);
            }
        }
    }, [lastTriggerResult, pendingTriggerType, message.id]); // Depende do resultado global e do estado local

    // Estilos do Usuário
    const userBubbleBg = theme === 'dark' 
      ? 'bg-gradient-to-br from-blue-600/50 to-purple-600/50' 
      : 'bg-gradient-to-br from-blue-400/60 to-purple-400/60';
    const userAlign = "ml-auto justify-end";
    const userTextColor = "text-white";

    // Estilos do Agente
    const agentBubbleBg = theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-100/50';
    const agentAlign = "mr-auto justify-start";
    const agentTextColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    
    // Usar ApiAgentType aqui
    const agentTypeDisplayNames: Partial<Record<ApiAgentType, string>> = { 
        [ApiAgentType.PRODUCT]: "Product Agent",
        [ApiAgentType.CODER]: "Coder Agent",
        [ApiAgentType.TEST]: "Test Agent",
        [ApiAgentType.SECURITY]: "Security Agent"
    };

    const bubbleBg = isUser ? userBubbleBg : agentBubbleBg;
    const alignment = isUser ? userAlign : agentAlign;
    const textColor = isUser ? userTextColor : agentTextColor;

    const syntaxTheme = theme === 'dark' ? atomDark : atomLight;

    // Função para renderizar conteúdo de forma segura
    const renderContent = () => {
        // Se metadados indicam um snippet ou código principal
        if (message.metadata?.codeSnippet || message.metadata?.structuredOutput?.code) {
             const code = message.metadata?.structuredOutput?.code || message.metadata?.codeSnippet;
             const language = message.metadata?.structuredOutput?.language || message.metadata?.codeLanguage || 'typescript';
             const fileName = message.metadata?.fileName || `snippet.${language}`;
             // Usar CodeViewer aqui? O problema é que o CodeViewer pode ter seu próprio botão de cópia...
             // Decisão: Para simplificar, o botão de cópia da bolha copiará o código se presente.
             return <CodeViewer code={code || ''} language={language} fileName={fileName} className="mt-2" readOnly={true} />; // Force readOnly
        }

        // Fallback para Markdown se não houver codeSnippet ou structuredOutput.code
        return (
            <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-0">
                <ReactMarkdown
                    children={message.content} // Usa a string de conteúdo
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            // Usar CodeViewer para blocos de código markdown TAMBÉM?
                            // Ou manter SyntaxHighlighter para blocos menores dentro do markdown?
                            // Por ora, manter SyntaxHighlighter para markdown, CodeViewer para snippets/output principal
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    children={String(children).replace(/\n$/, '')}
                                    style={syntaxTheme} // Usar tema antigo aqui?
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded text-xs my-2 border border-white/10 bg-black/20"
                                    // Não usar CodeViewer aqui para evitar aninhamento complexo
                                />
                            ) : (
                                <code className={`px-1 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-600/50' : 'bg-gray-300/50'} text-xs font-mono`} {...props}>
                                    {children}
                                </code>
                            );
                        },
                    }}
                />
            </div>
        );
    };

    // --- Handler para Copiar ---
    const handleCopy = async () => {
        let contentToCopy = message.content;
        // Se for código, pega o código do snippet ou output estruturado
        if (message.metadata?.codeSnippet || message.metadata?.structuredOutput?.code) {
            contentToCopy = message.metadata?.structuredOutput?.code || message.metadata?.codeSnippet || '';
        }
        try {
            await navigator.clipboard.writeText(contentToCopy);
            toast.success('Conteúdo copiado!');
        } catch (err) {
            console.error('Falha ao copiar:', err);
            toast.error('Não foi possível copiar.');
        }
    };

    // --- Feedback Handlers --- 
    const handleFeedback = (rating: number | null) => {
        if (!sessionId) return;
        addFeedback(message.id, rating, rating === -1 ? feedbackCorrection : null); // Só envia correção com dislike
        setShowFeedbackPopover(false); // Fecha popover após enviar
         // Reset local state if needed, though context sync should handle it
         // setFeedbackCorrection(''); 
    };

    const handleOpenFeedbackPopover = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que o clique se propague para outros elementos
        setFeedbackCorrection(message.correction || ''); // Preenche com a correção existente
        setShowFeedbackPopover(true);
    };
    
    // --- JSX da Bolha --- 
    return (
        <motion.div 
            className={`flex items-start mb-4 ${alignment}`} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: isUser ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            layout // Anima mudanças de layout (como altura)
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!isUser && agentType && (
                <AgentTypeAvatar agentType={agentType} theme={theme} />
            )}

            <div className={`relative flex flex-col rounded-lg shadow-sm max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl ${bubbleBg}`}>
                {/* Header da Mensagem (Opcional - pode mostrar agente/hora) */} 
                {!isUser && agentType && (
                    <div className={`px-3 pt-2 pb-1 text-xs font-semibold opacity-80 ${textColor}`}>
                         {agentTypeDisplayNames[agentType] || 'Agent'}
                    </div>
                )}
                
                {/* Conteúdo Principal */}
                 <div className={`px-3 ${!isUser && agentType ? 'pb-2' : 'py-2'} ${textColor}`}>
                    {renderContent()}
                </div>

                 {/* Overlay de Ações (aparece no hover) */}
                 <AnimatePresence>
                    {(isHovered || showFeedbackPopover) && (
                         <motion.div 
                            className={`absolute -bottom-6 ${isUser ? 'right-0' : 'left-0'} flex items-center space-x-1 p-0.5 bg-gray-500/20 dark:bg-gray-800/30 backdrop-blur-sm rounded-full shadow-md z-10`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.15 }}
                        >
                            <AnimatedButton variant="ghost" size="iconXs" onClick={handleCopy} title="Copiar Conteúdo" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                                <FiCopy className="w-3.5 h-3.5" />
                            </AnimatedButton>
                             {/* Botões de Feedback */} 
                            {!isUser && (
                                <>
                                    <AnimatedButton 
                                        variant="ghost" 
                                        size="iconXs" 
                                        onClick={() => handleFeedback(message.rating === 1 ? null : 1)} 
                                        title="Gostei" 
                                        className={` ${message.rating === 1 ? 'text-green-500 dark:text-green-400' : 'text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400'}`}
                                    >
                                        <FiThumbsUp className="w-3.5 h-3.5" />
                                    </AnimatedButton>
                                    <FeedbackPopover
                                        isOpen={showFeedbackPopover}
                                        onClose={() => setShowFeedbackPopover(false)}
                                        onSubmit={(correction) => {
                                            setFeedbackCorrection(correction); // Update local state for input
                                            handleFeedback(-1); // Send dislike with correction
                                        }}
                                        initialCorrection={feedbackCorrection}
                                        theme={theme}
                                    >
                                        {/* O botão que abre o popover */} 
                                        <AnimatedButton 
                                            variant="ghost" 
                                            size="iconXs" 
                                            onClick={handleOpenFeedbackPopover} 
                                            title="Não Gostei / Corrigir" 
                                            className={`${message.rating === -1 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'}`}
                                        >
                                             <FiThumbsDown className="w-3.5 h-3.5" />
                                        </AnimatedButton>
                                    </FeedbackPopover>
                                </> 
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Botões de Trigger Contextuais (só para mensagens de agente) */} 
            {!isUser && agentType && (
                <div className="flex flex-col space-y-1 ml-2 flex-shrink-0 self-center">
                     {showGenerateTests && (
                         <AnimatedButton 
                            variant="outline" 
                            size="xs" 
                            onClick={handleGenerateTestsClick} 
                            disabled={!!pendingTriggerType} // Desabilita se qualquer trigger estiver pendente
                            title={pendingTriggerType ? `Aguardando ${pendingTriggerType}...` : "Gerar Testes Unitários"}
                         >
                             {pendingTriggerType === 'testGeneration' ? <FiLoader className="w-3 h-3 mr-1 animate-spin"/> : <FiCheck className="w-3 h-3 mr-1" />} 
                            Testes
                         </AnimatedButton>
                     )}
                     {showAnalyzeSecurity && (
                         <AnimatedButton variant="outline" size="xs" onClick={handleAnalyzeSecurityClick} disabled={!!pendingTriggerType} title={pendingTriggerType ? `Aguardando ${pendingTriggerType}...` : "Analisar Segurança"}>
                             {pendingTriggerType === 'securityAnalysis' ? <FiLoader className="w-3 h-3 mr-1 animate-spin"/> : <FiShield className="w-3 h-3 mr-1" />} 
                             Segurança
                         </AnimatedButton>
                     )}
                      {showSimulateTests && (
                         <AnimatedButton variant="outline" size="xs" onClick={handleSimulateTestsClick} disabled={!!pendingTriggerType} title={pendingTriggerType ? `Aguardando ${pendingTriggerType}...` : "Simular Execução dos Testes"}>
                             {pendingTriggerType === 'testSimulation' ? <FiLoader className="w-3 h-3 mr-1 animate-spin"/> : <FiPlay className="w-3 h-3 mr-1" />} 
                             Simular
                         </AnimatedButton>
                     )}
                     {showValidateTestFix && (
                         <AnimatedButton variant="outline" size="xs" onClick={handleValidateTestFixClick} disabled={!!pendingTriggerType} title={pendingTriggerType ? `Aguardando ${pendingTriggerType}...` : "Validar Correção do Teste"}>
                            {pendingTriggerType === 'testFixValidation' ? <FiLoader className="w-3 h-3 mr-1 animate-spin"/> : <FiTarget className="w-3 h-3 mr-1" />} 
                             Validar Teste
                         </AnimatedButton>
                     )}
                     {showValidateSecurityFix && (
                         <AnimatedButton variant="outline" size="xs" onClick={handleValidateSecurityFixClick} disabled={!!pendingTriggerType} title={pendingTriggerType ? `Aguardando ${pendingTriggerType}...` : "Verificar Correção de Segurança"}>
                             {pendingTriggerType === 'securityFixVerification' ? <FiLoader className="w-3 h-3 mr-1 animate-spin"/> : <FiAlertCircle className="w-3 h-3 mr-1" />} 
                             Validar Segurança
                         </AnimatedButton>
                     )}
                 </div>
            )}
            
             {isUser && (
                 <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center ml-2 flex-shrink-0">
                     <FiUser className="w-4 h-4 text-white" />
                 </div>
             )}
        </motion.div>
    );
});

// CollaborationInput - Modificado para receber estado e handlers do pai
interface CollaborationInputProps {
  theme: 'light' | 'dark';
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
  onOptimizeClick: () => void; // Handler para abrir o otimizador
  disabled: boolean;
  isProcessing: boolean; // Para mostrar loader no botão Send
  lastAgentType?: ApiAgentType | null; // Para tooltip do botão optimize
}

const CollaborationInput = React.memo<CollaborationInputProps>(({ 
    theme, 
    inputValue, 
    setInputValue, 
    onSend, 
    onOptimizeClick,
    disabled,
    isProcessing,
    lastAgentType
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const buttonBg = theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600';
    const buttonDisabledBg = theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400';
    const inputBg = theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80';
    const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-900';
    const placeholderColor = theme === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400';
    const ringColor = theme === 'dark' ? 'focus:ring-indigo-500' : 'focus:ring-indigo-400';

    const handleSend = () => {
        if (inputValue.trim() && !disabled && !isProcessing) {
            onSend();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const optimizeTooltip = lastAgentType 
        ? `Otimizar prompt para ${lastAgentType}` 
        : "Otimizar prompt";

    return (
        <div className={`flex items-center p-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} backdrop-blur-sm ${inputBg}`}>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem ou comando..."
                className={`flex-grow px-3 py-2 rounded-l-lg border-none outline-none text-sm transition-all duration-150 ease-in-out ${inputBg} ${textColor} ${placeholderColor} ${ringColor} focus:ring-2`}
                disabled={disabled || isProcessing}
            />
            <AnimatedButton
                 variant="ghost"
                 size="sm"
                 className="px-3 rounded-none border-l border-r border-gray-600/50 dark:border-gray-400/20 text-yellow-500 dark:text-yellow-400 hover:bg-yellow-500/10 dark:hover:bg-yellow-400/10"
                 onClick={onOptimizeClick}
                 disabled={disabled || isProcessing || !inputValue.trim()} // Desabilita se não houver input
                 title={optimizeTooltip}
            >
                 <FiZap className="w-4 h-4" />
            </AnimatedButton>
            <AnimatedButton 
                className={`px-4 py-2 rounded-r-lg text-white font-semibold text-sm transition-colors ${disabled || isProcessing ? buttonDisabledBg : buttonBg}`}
                onClick={handleSend}
                disabled={disabled || isProcessing || !inputValue.trim()}
            >
                {isProcessing ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
            </AnimatedButton>
        </div>
    );
});

// --- Função Auxiliar para Formatar Dados do Trigger --- 
const formatTriggerResultData = (event: string | undefined, data: any): string | null => {
    if (!event || !data) return null;

    if (event.startsWith('error:')) {
        return `Erro: ${data.message || 'Detalhes não disponíveis.'}`;
    }

    if (event.includes('testGeneration')) {
        if (data.testCases && data.testCases.length > 0) {
            return `Testes gerados: ${data.testCases.length}. Arquivos: ${data.testFiles?.join(', ') || 'N/A'}`;
        } else {
            return `Nenhum teste gerado. ${data.message || ''}`;
        }
    }
    if (event.includes('securityAnalysis')) {
        if (data.potentialRisksIdentified && data.potentialRisksIdentified.length > 0) {
            return `Riscos de segurança encontrados: ${data.potentialRisksIdentified.length}`;
        } else {
            return `Nenhum risco de segurança encontrado. ${data.message || ''}`;
        }
    }
    if (event.includes('testSimulation')) {
        if (typeof data.success === 'boolean') {
            return data.success ? `Simulação de testes concluída com sucesso. Passou: ${data.passedTests?.length || 0}` : `Simulação de testes falhou. Falhou: ${data.failedTests?.length || 0}`;
        } else {
            return `Resultado da simulação de testes indisponível. ${data.message || ''}`;
        }
    }
    if (event.includes('testFixValidation')) {
        if (typeof data.passed === 'boolean') {
            return data.passed ? `Validação da correção do teste: PASSOU!` : `Validação da correção do teste: FALHOU.`;
        } else {
            return `Resultado da validação da correção do teste indisponível. ${data.message || ''}`;
        }
    }
     if (event.includes('securityFixVerification')) {
        if (typeof data.verified === 'boolean') {
            return data.verified ? `Verificação da correção de segurança: VERIFICADA!` : `Verificação da correção de segurança: FALHOU.`;
        } else {
            return `Resultado da verificação da correção de segurança indisponível. ${data.message || ''}`;
        }
    }

    // Fallback genérico
    return `Evento ${event} recebido. Dados: ${JSON.stringify(data)}`;
};

// --- Main Panel Component ---
export const AgentCollaborationPanel: React.FC<AgentCollaborationPanelProps> = React.memo(() => {
  const { theme } = useTheme();
  
  // Obter dados do chat ativo
  const {
    state: activeChatState,
    sendMessage,
    optimizePrompt,
    clearOptimizedPromptResult,
  } = useActiveChatContext();
  const { 
      activeSessionId, 
      sessionDetails, 
      messages, 
      isLoadingMessages, 
      isSendingMessage, 
      isOptimizingPrompt,
      error: activeChatError,
      optimizedPromptResult
  } = activeChatState;

  // Obter triggers e resultado global do AgentContext
  const { 
      state: agentState, 
      clearLastTriggerResult, 
  } = useAgentContext();
  const { lastTriggerResult } = agentState;

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false); // Para modal/estado de otimização
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]); // Indices das mensagens encontradas
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref para o input de busca

  // Memoizar a lista de mensagens para evitar re-render desnecessário da lista
  const memoizedMessages = useMemo(() => messages, [messages]);

  // Calcular IDs contextuais relevantes (movido para dentro do componente principal)
  const relevantContextIds = useMemo((): RelevantContextIds => {
    let lastCoderMsgId: string | undefined;
    let lastProductMsgId: string | undefined;
    let lastTestResultMsgId: string | undefined;
    let lastSecurityAnalysisMsgId: string | undefined;
    let lastTestGenerationMsgId: string | undefined;

    // Iterar sobre as mensagens do chat ativo
    for (const msg of messages) {
        const agentType = msg.metadata?.agentType as ApiAgentType | undefined;
        const triggerType = msg.metadata?.triggerType as string | undefined; // Assumindo que o trigger está nos metadados
        const isSuccess = msg.metadata?.success as boolean | undefined;

        if (agentType === ApiAgentType.CODER) {
            lastCoderMsgId = msg.id;
        }
        if (agentType === ApiAgentType.PRODUCT) {
            lastProductMsgId = msg.id;
        }
        // Identificar resultados de teste (pode precisar de metadados mais específicos)
        if (agentType === ApiAgentType.TEST && triggerType === 'testSimulation') {
             if (isSuccess === false || (msg.metadata?.structuredOutput?.failedTests && msg.metadata.structuredOutput.failedTests.length > 0)) {
                 lastTestResultMsgId = msg.id; // Armazena ID se houve falha
             }
        }
         // Identificar resultados de análise de segurança (pode precisar de metadados)
         if (agentType === ApiAgentType.SECURITY && triggerType === 'securityAnalysis') {
             if (msg.metadata?.structuredOutput?.potentialRisksIdentified && msg.metadata.structuredOutput.potentialRisksIdentified.length > 0) {
                 lastSecurityAnalysisMsgId = msg.id; // Armazena ID se houve riscos
             }
        }
         // Identificar geração de testes
         if (agentType === ApiAgentType.TEST && triggerType === 'testGeneration') {
             lastTestGenerationMsgId = msg.id;
        }
    }

    return { 
        lastCoderMsgId, 
        lastProductMsgId, 
        lastTestResultMsgId, 
        lastSecurityAnalysisMsgId, 
        lastTestGenerationMsgId
    };
  }, [messages]); // Recalcula quando as mensagens mudam

  // Scroll to bottom
  useEffect(() => {
    // Scroll inicial e quando novas mensagens chegam
    scrollToBottom();
  }, [messages]); // Depende apenas das mensagens

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isSendingMessage) return;
    
    // Usar a função do ActiveChatContext
    sendMessage(inputValue.trim()); 
    setInputValue(''); 
  }, [inputValue, sendMessage, setInputValue, isSendingMessage]);

  // Otimização
  const handleOptimizeClick = useCallback(() => {
    if (inputValue.trim()) {
        setIsOptimizing(true); // Abre o modal/componente de otimização
    }
  }, [inputValue, setIsOptimizing]);

  const handleOptimizeSubmit = useCallback(async (originalPrompt: string, userFeedback: string) => {
     if (!activeSessionId) {
         toast.error("Nenhuma sessão ativa para otimizar.");
         return;
     }
     try {
         const optimized = await optimizePrompt({ 
             sessionId: activeSessionId, // Passa o ID ativo
             prompt: originalPrompt,
             feedback: userFeedback 
         });
         if (optimized) {
             setInputValue(optimized); // Preenche input com o prompt otimizado
             toast.success("Prompt otimizado e pronto para envio!");
         } else {
             // Erro já tratado no contexto
         }
     } catch (e) {
         // Erro já tratado no contexto
     } finally {
         setIsOptimizing(false); // Fecha o modal
     }
  }, [inputValue, setInputValue, activeSessionId, optimizePrompt]);

  const handleOptimizeClose = useCallback(() => {
    setIsOptimizing(false);
    clearOptimizedPromptResult(); // Limpa resultado ao fechar
  }, [setIsOptimizing, clearOptimizedPromptResult]);

  // Formatar o resultado do trigger para exibição
  const formattedTriggerResult = useMemo(() => {
    if (!lastTriggerResult) return null;
    return formatTriggerResultData(lastTriggerResult.event, lastTriggerResult);
  }, [lastTriggerResult]);

   // --- Lógica de Busca --- 
   useEffect(() => {
        if (searchQuery && searchQuery.length > 1) {
            const results = messages.reduce((acc: number[], msg, index) => {
                if (msg.content.toLowerCase().includes(searchQuery.toLowerCase())) {
                    acc.push(index);
                }
                return acc;
            }, []);
            setSearchResults(results);
            setCurrentResultIndex(results.length > 0 ? 0 : -1); // Vai para o primeiro resultado
        } else {
            setSearchResults([]);
            setCurrentResultIndex(-1);
        }
    }, [searchQuery, messages]);

    // Efeito para scrollar para o resultado da busca
    useEffect(() => {
        if (currentResultIndex !== -1 && searchResults.length > 0) {
            const messageIndex = searchResults[currentResultIndex];
            const element = document.getElementById(`message-${messageIndex}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentResultIndex, searchResults]);

    // Handler para abrir/fechar busca
    const toggleSearch = useCallback(() => {
        setIsSearchVisible(!isSearchVisible);
        if (!isSearchVisible) {
            // Foca no input quando abre
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            // Limpa busca ao fechar
            setSearchQuery('');
        }
    }, [isSearchVisible, setIsSearchVisible]);

    // Atualiza o estado da busca
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, [setSearchQuery]);

    // Navega pelos resultados com Enter/Shift+Enter
    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchResults.length > 0) {
                if (e.shiftKey) {
                    goToPrevResult();
                } else {
                    goToNextResult();
                }
            }
        }
        if (e.key === 'Escape') {
            toggleSearch();
        }
    }, [searchQuery, searchResults, goToNextResult, goToPrevResult, toggleSearch]);

    // Vai para o próximo resultado
    const goToNextResult = useCallback(() => {
        if (searchResults.length > 0) {
            setCurrentResultIndex((prevIndex) => (prevIndex + 1) % searchResults.length);
        }
    }, [searchResults, currentResultIndex, setCurrentResultIndex]);

    // Vai para o resultado anterior
    const goToPrevResult = useCallback(() => {
        if (searchResults.length > 0) {
            setCurrentResultIndex((prevIndex) => (prevIndex - 1 + searchResults.length) % searchResults.length);
        }
    }, [searchResults, currentResultIndex, setCurrentResultIndex]);

    // Determinar o último tipo de agente que enviou mensagem (para tooltip de otimização)
    const lastAgentType = useMemo(() => {
        const lastAgentMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.metadata?.agentType);
        return lastAgentMessage?.metadata?.agentType as ApiAgentType | null;
    }, [messages]);

  // --- Renderização Principal --- 

  // Tela de carregamento inicial ou se não houver sessão ativa
  if (!activeSessionId || !sessionDetails) {
      // Mostrar um loader mais robusto ou mensagem se necessário
      return (
         <div className="flex flex-col h-full items-center justify-center text-gray-500 dark:text-gray-400">
             <FiMessageSquare className="w-12 h-12 mb-4 opacity-50" />
             <p className="text-sm">Nenhuma sessão de chat ativa.</p>
             <p className="text-xs mt-1">Inicie uma nova sessão ou selecione uma na barra lateral.</p>
         </div>
      );
  }

  // Aplicando useMemo para valores computados
  const messageElements = useMemo(() => {
    return messages.map((message, index) => {
      // ... existing message mapping code ...
    });
  }, [messages, theme, contextIds, handleDeleteMessage, isSearchVisible, searchQuery, searchResults, currentResultIndex]); // Adicionar todas as dependências

  const recentConversation = useMemo(() => {
    return messages.slice(-3).filter(m => !m.isDeleted); // Últimas 3 mensagens não excluídas
  }, [messages]);

  // Calcular IDs de contexto relevantes com useMemo 
  const contextIds = useMemo(() => {
    // ... existing contextIds calculation ...
  }, [messages]); // Depende apenas das mensagens

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/90 relative">
      {/* Header (Opcional - pode mostrar título da sessão, etc.) */}
       <div className={`flex-shrink-0 p-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} flex justify-between items-center`}>
         <h2 className="text-sm font-semibold truncate" title={sessionDetails.title || `Session ${sessionDetails.id}`}> 
             {sessionDetails.title || `Chat Session`} 
         </h2>
         <div className="flex items-center space-x-2">
             {/* Botão de Busca */} 
             <AnimatedButton 
                 variant="ghost" 
                 size="iconSm" 
                 onClick={toggleSearch}
                 title={isSearchVisible ? "Fechar Busca" : "Buscar na Conversa"}
                 className={`transition-colors ${isSearchVisible ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
             >
                  {isSearchVisible ? <FiX className="w-4 h-4"/> : <FiSearch className="w-4 h-4" />}
             </AnimatedButton>
             {/* Status do Trigger (se houver) */}
             {formattedTriggerResult && (
                <div className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center">
                    <FiRefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> {/* Ícone genérico ou específico */} 
                    <span className="truncate max-w-[200px]" title={formattedTriggerResult}>{formattedTriggerResult}</span>
                    <AnimatedButton variant="ghost" size="iconXs" onClick={clearLastTriggerResult} className="ml-1 text-gray-400 hover:text-red-500" title="Dispensar">
                        <FiX className="w-3 h-3"/>
                    </AnimatedButton>
                </div>
             )}
        </div>
       </div>

        {/* Overlay de Busca */} 
        <AnimatePresence>
            {isSearchVisible && (
                <motion.div 
                    className={`absolute top-10 right-2 z-20 w-64 p-2 rounded-lg shadow-lg backdrop-blur-md ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                     <div className="flex items-center space-x-1">
                         <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchQuery} 
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            className={`flex-grow text-xs px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'} outline-none focus:ring-1 focus:ring-indigo-500`}
                         />
                         <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                             {searchResults.length > 0 ? `${currentResultIndex + 1}/${searchResults.length}` : '0/0'}
                         </span>
                         <AnimatedButton variant="ghost" size="iconXs" onClick={goToPrevResult} disabled={searchResults.length === 0} title="Anterior (Shift+Enter)">
                             <FiChevronUp className="w-4 h-4"/>
                         </AnimatedButton>
                         <AnimatedButton variant="ghost" size="iconXs" onClick={goToNextResult} disabled={searchResults.length === 0} title="Próximo (Enter)">
                             <FiChevronDown className="w-4 h-4"/>
                         </AnimatedButton>
                         <AnimatedButton variant="ghost" size="iconXs" onClick={toggleSearch} title="Fechar (Esc)">
                             <FiX className="w-4 h-4"/>
                         </AnimatedButton>
                    </div>
                 </motion.div>
            )}
        </AnimatePresence>

      {/* Área de Mensagens */}
      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar relative">
        {/* Loader enquanto mensagens carregam (pode ser removido se o sync for rápido) */}
        {isLoadingMessages && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-500/10 backdrop-blur-sm z-10">
                <FiLoader className="w-6 h-6 animate-spin text-purple-500" />
            </div>
        )}
        
        {/* Lista de Mensagens */}
        <AnimatePresence initial={false}>
             {memoizedMessages.map((msg, index) => (
                 <motion.div 
                    key={msg.id || `msg-${index}`} // Usa ID da msg se disponível
                    id={`message-${index}`} // ID para scroll da busca
                    layout // Anima mudanças de posição
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.01 }} // Pequeno delay escalonado
                    className={searchResults.includes(index) ? (index === searchResults[currentResultIndex] ? 'bg-yellow-400/30 dark:bg-yellow-600/30 rounded-lg ring-2 ring-yellow-500' : 'bg-yellow-400/15 dark:bg-yellow-600/15 rounded-lg') : ''}
                 >
                    <ChatMessageBubble 
                        message={msg}
                        theme={theme}
                        contextIds={relevantContextIds}
                    />
                </motion.div>
             ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <CollaborationInput 
            theme={theme} 
            inputValue={inputValue} 
            setInputValue={setInputValue}
            onSend={handleSendMessage}
            onOptimizeClick={handleOptimizeClick}
            disabled={isSendingMessage || isOptimizingPrompt || isOptimizing} // Desabilita durante envio ou otimização
            isProcessing={isSendingMessage || isOptimizingPrompt || isOptimizing} // Mostra loader
            lastAgentType={lastAgentType} // Passa o último tipo de agente
        />
      </div>

       {/* Modal/Componente de Otimização */} 
       <PromptOptimizer 
         isOpen={isOptimizing}
         onClose={handleOptimizeClose}
         initialPrompt={inputValue}
         onSubmit={handleOptimizeSubmit}
         isLoading={isOptimizingPrompt} // Usa estado do contexto
         optimizedResult={optimizedPromptResult} // Passa resultado
         error={activeChatError} // Passa erro específico da otimização
         lastAgentType={lastAgentType} // Passa tipo para contexto do otimizador
       />

    </div>
  );
});

// Styles for custom scrollbar (optional)
/* Add to your global CSS or index.css if needed:
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(128, 128, 128, 0.3);
  border-radius: 10px;
  border: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(128, 128, 128, 0.5);
}
*/

// export default AgentCollaborationPanel; 