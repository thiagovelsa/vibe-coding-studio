import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  Node,
  Edge,
  MarkerType
} from 'reactflow';
import { FiUser, FiCpu, FiShield, FiCheckCircle, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeProvider';
import { useAgentContext } from '../../context/AgentContext';
import { AgentType, ApiChatSession } from '../../services/agent-api.service';
import { AnimatePresence, motion } from 'framer-motion';

// Tipos para os dados dos nós e fluxo
type OrchestratorStepStatus = 'pending' | 'in_progress' | 'completed' | 'error';
interface OrchestratorStep {
    step: number;
    agentType: AgentType;
    status: OrchestratorStepStatus;
    startTime?: string;
    endTime?: string;
    error?: string;
    inputSummary?: string; // Opcional: resumo do que entrou
    outputSummary?: string; // Opcional: resumo do que saiu
}

interface AgentFlowNodeData {
  label: string;
  icon: React.ElementType;
  status: OrchestratorStepStatus;
  isActive: boolean;
  error?: string;
}

// Mapeamento de AgentType para Ícones e Nomes
const agentDetails: Record<AgentType, { name: string; icon: React.ElementType }> = {
    [AgentType.PRODUCT]: { name: 'Product', icon: FiUser },
    [AgentType.CODER]: { name: 'Coder', icon: FiCpu },
    [(AgentType as any).TEST || 'TESTER']: { name: 'Test', icon: FiCheckCircle },
    [(AgentType as any).SECURITY || 'SECURITY']: { name: 'Security', icon: FiShield },
};

// Componente Nó Customizado
const AgentNode = React.memo<{ data: AgentFlowNodeData }>(({ data }) => {
  const { theme } = useTheme();
  const Icon = data.icon;

  const nodeBg = theme === 'dark' ? 'bg-gray-700/80' : 'bg-gray-200/80';
  const nodeBorder = theme === 'dark' ? 'border-white/20' : 'border-black/20';
  const activeBorder = theme === 'dark' ? 'border-purple-400' : 'border-purple-500';
  const errorBorder = theme === 'dark' ? 'border-red-500' : 'border-red-600';
  const completedBorder = theme === 'dark' ? 'border-green-500' : 'border-green-600';

  let statusIndicatorClass = '';
  switch (data.status) {
      case 'in_progress': statusIndicatorClass = theme === 'dark' ? 'bg-yellow-400' : 'bg-yellow-500'; break;
      case 'completed': statusIndicatorClass = theme === 'dark' ? 'bg-green-400' : 'bg-green-500'; break;
      case 'error': statusIndicatorClass = theme === 'dark' ? 'bg-red-400' : 'bg-red-500'; break;
      default: statusIndicatorClass = theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400';
  }

  const borderClass = 
      data.status === 'error' ? errorBorder : 
      data.isActive ? activeBorder : 
      data.status === 'completed' ? completedBorder :
      nodeBorder;

  return (
      <motion.div 
        className={`flex items-center p-3 rounded-lg shadow-md ${nodeBg} border-2 ${borderClass} backdrop-blur-sm w-40`} // Tamanho fixo por enquanto
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
          <div className="relative mr-2">
              <Icon className={`w-6 h-6 ${data.isActive ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-600') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}`} />
              {data.status === 'in_progress' && (
                  <FiLoader className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 animate-spin" />
              )}
               {data.status === 'error' && (
                  <FiAlertTriangle className="absolute -top-1 -right-1 w-3 h-3 text-red-500" />
              )}
          </div>
          <div className="flex-1 overflow-hidden">
              <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{data.label}</p>
              <p className={`text-xs capitalize truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{data.status.replace('_', ' ')}</p>
          </div>
          {/* <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${statusIndicatorClass}`}></div> */}
           {/* Handle para conexões - O ReactFlow adiciona automaticamente */}
      </motion.div>
  );
});

const nodeTypes = { agentNode: AgentNode };

export const AgentFlowVisualizer: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const { state } = useAgentContext();
  const { activeChatSessionId, sessions } = state;
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Memoizar a sessão ativa
  const activeSession = useMemo<ApiChatSession | null>(() => 
    activeChatSessionId ? sessions[activeChatSessionId] : null
  , [sessions, activeChatSessionId]);

  // Extrair e processar os passos do fluxo
  const flowSteps = useMemo<OrchestratorStep[]>(() => {
      // Se não houver sessão ou estado do orquestrador ou passos, retorna vazio
      if (!activeSession || !activeSession.orchestratorState || !Array.isArray(activeSession.orchestratorState.steps)) {
          return [];
      }
      // Ordena os passos pelo número (garantia)
      return [...activeSession.orchestratorState.steps].sort((a, b) => a.step - b.step);
  }, [activeSession]);

  // Efeito para atualizar nós e arestas quando os passos mudam
  useEffect(() => {
    if (!flowSteps || flowSteps.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
    }

    const newNodes: Node<AgentFlowNodeData>[] = [];
    const newEdges: Edge[] = [];
    const nodeSpacing = 200;
    const verticalSpacing = 100;
    const layoutType = 'horizontal'; // Ou 'vertical'

    let lastActiveStepIndex = -1;
    for (let i = flowSteps.length - 1; i >= 0; i--) {
        if (flowSteps[i].status === 'in_progress') {
            lastActiveStepIndex = i;
            break;
        }
         if (flowSteps[i].status === 'completed' && lastActiveStepIndex === -1) {
             lastActiveStepIndex = i; // Se o último é completo, ele é o "ativo"
         }
    }

    flowSteps.forEach((step, index) => {
        const details = agentDetails[step.agentType] || { name: 'Unknown', icon: FiCpu };
        const nodeId = `step-${step.step}-${step.agentType}`;
        const isActive = index === lastActiveStepIndex || (lastActiveStepIndex === -1 && index === flowSteps.length - 1); // Marcar o último como ativo se nenhum estiver em progresso

        newNodes.push({
            id: nodeId,
            type: 'agentNode',
            position: { 
                x: layoutType === 'horizontal' ? index * nodeSpacing : 0, 
                y: layoutType === 'vertical' ? index * verticalSpacing : 0 
            },
            data: {
                label: details.name,
                icon: details.icon,
                status: step.status,
                isActive: isActive,
                error: step.error,
            },
            sourcePosition: layoutType === 'horizontal' ? Position.Right : Position.Bottom,
            targetPosition: layoutType === 'horizontal' ? Position.Left : Position.Top,
        });

        // Adicionar aresta para o nó anterior
        if (index > 0) {
            const prevStep = flowSteps[index - 1];
            const prevNodeId = `step-${prevStep.step}-${prevStep.agentType}`;
            newEdges.push({
                id: `edge-${prevNodeId}-${nodeId}`,
                source: prevNodeId,
                target: nodeId,
                animated: step.status === 'in_progress', // Anima aresta para nó em progresso
                type: 'smoothstep',
                markerEnd: {
                   type: MarkerType.ArrowClosed,
                   width: 15,
                   height: 15,
                   color: theme === 'dark' ? '#a78bfa' : '#8b5cf6',
                },
                 style: {
                     strokeWidth: 1.5,
                     stroke: theme === 'dark' ? '#a78bfa' : '#8b5cf6',
                 },
            });
        }
    });

    setNodes(newNodes);
    setEdges(newEdges);

  }, [flowSteps, theme, setNodes, setEdges]); // Depende dos passos do fluxo e do tema

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const backgroundStyle = theme === 'dark' 
    ? { backgroundColor: '#1f2937' } // gray-800 
    : { backgroundColor: '#f9fafb' }; // gray-50

  return (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800/50">
      <ReactFlowProvider> {/* Necessário para hooks como useReactFlow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes} // Registrar tipo de nó customizado
          fitView // Ajustar visão inicial
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }} // Esconder logo do React Flow
          style={backgroundStyle}
        >
          <Background 
             variant={theme === 'dark' ? 'dots' : 'lines'} 
             gap={20} 
             size={1} 
             color={theme === 'dark' ? '#4b5563' : '#d1d5db'} 
          />
          <Controls 
            position="top-right" 
            style={{ 
                button: { 
                   backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                   color: theme === 'dark' ? '#d1d5db' : '#374151',
                   border: 'none',
                   boxShadow: 'none'
                }
            }}
          />
          <MiniMap 
            nodeColor={(n) => {
                switch (n.data?.status) {
                    case 'completed': return theme === 'dark' ? '#34d399' : '#10b981';
                    case 'in_progress': return theme === 'dark' ? '#a78bfa' : '#8b5cf6';
                    case 'error': return theme === 'dark' ? '#f87171' : '#ef4444';
                    default: return theme === 'dark' ? '#6b7280' : '#9ca3af';
                }
            }}
             nodeStrokeWidth={3}
             pannable 
             zoomable
             position="bottom-right"
             style={{ 
                backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                height: 80,
                width: 120,
             }}
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}); 