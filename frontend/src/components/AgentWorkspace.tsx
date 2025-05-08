import React, { useState, useEffect } from 'react';
import { FiSettings, FiMessageSquare, FiActivity, FiCode, FiClipboard, FiFileText, FiLoader } from 'react-icons/fi';
import { useAgentContext } from '../context/AgentContext';
import { AgentType as ApiAgentType } from '../services/agent-api.service';
import { Logger } from '../utils/Logger';

import AgentInteractionPanel from './panel/AgentInteractionPanel';
import AgentActivityTimeline, { TimelineActivity } from './panel/AgentActivityTimeline';
import AgentConfigPanel, { AgentConfig } from './panel/AgentConfigPanel';
import CodePreview from './panel/results/CodePreview';
import TestResults, { TestSuite } from './panel/results/TestResults';
import RequirementAnalysis, { Requirement } from './panel/results/RequirementAnalysis';

interface AgentWorkspaceProps {
  agentType: ApiAgentType;
}

type ActivePanel = 'chat' | 'config' | 'timeline' | 'code' | 'tests' | 'requirements';

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  agentType,
}) => {
  const { state: agentState, loadSession, createSession } = useAgentContext();
  
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [codeFiles, setCodeFiles] = useState<Array<{ name: string; content: string; language: string; }>>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      const lastSessionId = localStorage.getItem('lastActiveChatSessionId');

      if (!agentState.currentSession && !agentState.isLoadingSession && !agentState.error) {
        if (lastSessionId) {
          Logger.info(`AgentWorkspace: Attempting to load session ${lastSessionId}`);
          loadSession(lastSessionId).then(() => {
            Logger.info("AgentWorkspace: Session loaded.");
          }).catch(err => {
            Logger.error("AgentWorkspace: Failed to load last session, creating new one.", err);
            Logger.info("AgentWorkspace: Creating new session as fallback...");
            createSession().then(newSession => {
              if (newSession) {
                Logger.info(`AgentWorkspace: New session created: ${newSession.id}`);
              } else {
                Logger.error("AgentWorkspace: Failed to create fallback session.");
              }
            });
          });
        } else {
          Logger.info("AgentWorkspace: No last session ID found, creating new session...");
          createSession().then(newSession => {
            if (newSession) {
              Logger.info(`AgentWorkspace: New session created: ${newSession.id}`);
            } else {
              Logger.error("AgentWorkspace: Failed to create initial session.");
            }
          });
        }
      } else if (agentState.currentSession) {
        Logger.info(`AgentWorkspace: Session ${agentState.currentSession.id} already exists.`);
      } else if (agentState.isLoadingSession) {
        Logger.info("AgentWorkspace: Session is already loading.");
      } else if (agentState.error) {
        Logger.error(`AgentWorkspace: Session initialization failed previously: ${agentState.error}`);
      }
    };

    initializeSession();

    Logger.info("AgentWorkspace: Mock data initialization removed. Waiting for real data sources.");

  }, [agentState.currentSession, agentState.isLoadingSession, agentState.error, loadSession, createSession]);

  function getAgentName(): string {
    switch (agentType) {
      case 'coder': return 'Assistente de Código';
      case 'product': return 'Assistente de Produto';
      case 'test': return 'Assistente de Testes';
      case 'security': return 'Assistente de Segurança';
      default: return 'Assistente IA';
    }
  }

  function getInitialMessage(): string {
    switch (agentType) {
      case 'coder':
        return 'Olá! Sou seu assistente de código. Posso ajudar a escrever, refatorar e debugar código. Como posso ajudar hoje?';
      case 'product':
        return 'Olá! Sou seu assistente de produto. Posso ajudar com análise de requisitos, histórias de usuário e roadmapping. Como posso ajudar hoje?';
      case 'test':
        return 'Olá! Sou seu assistente de testes. Posso ajudar a criar planos e scripts de teste, assim como analisar resultados. Como posso ajudar hoje?';
      case 'security':
        return 'Olá! Sou seu assistente de segurança. Posso ajudar a identificar vulnerabilidades e recomendar correções. Como posso ajudar hoje?';
      default:
        return 'Olá! Como posso ajudar você hoje?';
    }
  }

  const handleSaveConfig = async (config: AgentConfig) => {
    setAgentConfig(config);
    return Promise.resolve();
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'chat':
        if (agentState.isLoadingSession) {
          return (
            <div className="flex h-full items-center justify-center p-4 text-gray-500">
              <FiLoader className="mr-2 h-5 w-5 animate-spin" /> Loading session...
            </div>
          ); 
        }
        if (agentState.error && !agentState.currentSession) {
          return (
             <div className="flex h-full flex-col items-center justify-center p-4 text-red-500">
                <p className="mb-2 font-medium">Error loading session:</p>
                <p className="text-sm">{agentState.error}</p>
             </div>
          ); 
        }
        if (!agentState.currentSession) {
           return (
             <div className="flex h-full items-center justify-center p-4 text-gray-500">
                No active session.
             </div>
           ); 
        }
        return <AgentInteractionPanel title={getAgentName()} initialMessage={getInitialMessage()} />;
      case 'config':
        return <AgentConfigPanel agentType={agentType} initialConfig={agentConfig} onSave={handleSaveConfig} />;
      case 'timeline':
        return <AgentActivityTimeline activities={activities} />;
      case 'code':
        return <CodePreview files={codeFiles} />;
      case 'tests':
        return <TestResults suites={testSuites} />;
      case 'requirements':
        return <RequirementAnalysis requirements={requirements} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex w-16 flex-col items-center space-y-4 border-r border-gray-200 bg-gray-100 py-4 dark:border-gray-700 dark:bg-gray-800">
        <SidebarButton icon={FiMessageSquare} label="Chat" isActive={activePanel === 'chat'} onClick={() => setActivePanel('chat')} />
        <SidebarButton icon={FiClipboard} label="Requirements" isActive={activePanel === 'requirements'} onClick={() => setActivePanel('requirements')} />
        <SidebarButton icon={FiCode} label="Code" isActive={activePanel === 'code'} onClick={() => setActivePanel('code')} />
        <SidebarButton icon={FiFileText} label="Tests" isActive={activePanel === 'tests'} onClick={() => setActivePanel('tests')} />
        <SidebarButton icon={FiActivity} label="Timeline" isActive={activePanel === 'timeline'} onClick={() => setActivePanel('timeline')} />
        <SidebarButton icon={FiSettings} label="Config" isActive={activePanel === 'config'} onClick={() => setActivePanel('config')} />
      </div>

      <div className="flex-1 overflow-auto">
        {renderPanel()}
      </div>
    </div>
  );
};

interface SidebarButtonProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeClasses = "bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-200";
  const inactiveClasses = "text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200";
  
  return (
    <button
      className={`flex w-full flex-col items-center rounded-md p-2 text-xs font-medium transition-colors ${isActive ? activeClasses : inactiveClasses}`}
      onClick={onClick}
      title={label}
    >
      <Icon className="mb-1 h-5 w-5" />
      <span>{label}</span>
    </button>
  );
};

export default AgentWorkspace; 