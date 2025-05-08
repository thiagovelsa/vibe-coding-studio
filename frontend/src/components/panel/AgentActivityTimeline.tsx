import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiClock, FiCode, FiFile, FiCheck, FiX, FiClipboard, FiPlay } from 'react-icons/fi';

export interface TimelineActivity {
  id: string;
  agentType: string;
  agentName: string;
  actionType: 'code-generation' | 'test-execution' | 'analysis' | 'recommendation' | 'message' | 'error';
  title: string;
  description?: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'running' | 'pending';
  metadata?: {
    duration?: number;
    files?: string[];
    codeChanges?: number;
    errorDetails?: string;
    testResults?: {
      passed: number;
      failed: number;
      skipped: number;
    };
    [key: string]: any;
  };
  children?: TimelineActivity[];
}

interface AgentActivityTimelineProps {
  activities: TimelineActivity[];
  onActivityClick?: (activity: TimelineActivity) => void;
  groupByAgent?: boolean;
  groupByType?: boolean;
}

const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({
  activities,
  onActivityClick,
  groupByAgent = false,
  groupByType = false,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleActivity = (activityId: string) => {
    setExpandedActivities((prev) => ({
      ...prev,
      [activityId]: !prev[activityId],
    }));
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'code-generation':
        return <FiCode className="text-blue-500" />;
      case 'test-execution':
        return <FiPlay className="text-green-500" />;
      case 'analysis':
        return <FiClipboard className="text-purple-500" />;
      case 'recommendation':
        return <FiFile className="text-yellow-500" />;
      case 'error':
        return <FiX className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="text-green-500" />;
      case 'failed':
        return <FiX className="text-red-500" />;
      case 'running':
        return (
          <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        );
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-300" />;
    }
  };

  const groupActivitiesByAgent = (acts: TimelineActivity[]): Record<string, TimelineActivity[]> => {
    return acts.reduce((groups, activity) => {
      const agentName = activity.agentName;
      if (!groups[agentName]) {
        groups[agentName] = [];
      }
      groups[agentName].push(activity);
      return groups;
    }, {} as Record<string, TimelineActivity[]>);
  };

  const groupActivitiesByType = (acts: TimelineActivity[]): Record<string, TimelineActivity[]> => {
    return acts.reduce((groups, activity) => {
      const actionType = activity.actionType;
      if (!groups[actionType]) {
        groups[actionType] = [];
      }
      groups[actionType].push(activity);
      return groups;
    }, {} as Record<string, TimelineActivity[]>);
  };

  const formatActionType = (type: string): string => {
    switch (type) {
      case 'code-generation':
        return 'Geração de Código';
      case 'test-execution':
        return 'Execução de Testes';
      case 'analysis':
        return 'Análise';
      case 'recommendation':
        return 'Recomendação';
      case 'message':
        return 'Mensagem';
      case 'error':
        return 'Erro';
      default:
        return type;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    }
    
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderActivityDetails = (activity: TimelineActivity) => {
    if (!expandedActivities[activity.id]) return null;

    return (
      <div className="mt-2 ml-6 rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-800">
        {activity.description && (
          <div className="mb-2 text-gray-700 dark:text-gray-300">{activity.description}</div>
        )}
        
        {activity.metadata && (
          <div className="space-y-2">
            {activity.metadata.duration && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <FiClock className="mr-1" />
                <span>Duração: {formatDuration(activity.metadata.duration)}</span>
              </div>
            )}
            
            {activity.metadata.files && activity.metadata.files.length > 0 && (
              <div>
                <div className="mb-1 text-gray-600 dark:text-gray-400">Arquivos:</div>
                <ul className="ml-4 list-disc text-gray-700 dark:text-gray-300">
                  {activity.metadata.files.map((file, idx) => (
                    <li key={idx}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {activity.metadata.testResults && (
              <div>
                <div className="mb-1 text-gray-600 dark:text-gray-400">Resultados de Testes:</div>
                <div className="flex space-x-3 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">
                    ✓ {activity.metadata.testResults.passed} passou
                  </span>
                  <span className="text-red-500">
                    ✗ {activity.metadata.testResults.failed} falhou
                  </span>
                  <span className="text-gray-500">
                    - {activity.metadata.testResults.skipped} ignorado
                  </span>
                </div>
              </div>
            )}
            
            {activity.metadata.errorDetails && (
              <div>
                <div className="mb-1 text-gray-600 dark:text-gray-400">Detalhes do erro:</div>
                <div className="rounded border border-red-200 bg-red-50 p-2 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                  {activity.metadata.errorDetails}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activity.children && activity.children.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-gray-600 dark:text-gray-400">Atividades relacionadas:</div>
            <div className="space-y-1">
              {activity.children.map((child) => (
                <div 
                  key={child.id}
                  className="flex items-center rounded-md border border-gray-200 p-1 text-xs dark:border-gray-700"
                >
                  <span className="mr-1">{getActivityIcon(child.actionType)}</span>
                  <span className="text-gray-700 dark:text-gray-300">{child.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderActivity = (activity: TimelineActivity) => {
    return (
      <div key={activity.id} className="group mb-2">
        <div 
          className="flex cursor-pointer items-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => {
            toggleActivity(activity.id);
            if (onActivityClick) onActivityClick(activity);
          }}
        >
          <div className="mr-2">{getActivityIcon(activity.actionType)}</div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium text-gray-800 dark:text-gray-200">{activity.title}</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{activity.agentName}</span> • {formatActionType(activity.actionType)}
            </div>
          </div>
          <div className="mr-2">{getStatusIcon(activity.status)}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleActivity(activity.id);
            }}
            className="text-gray-400 opacity-0 transition-opacity duration-200 hover:text-gray-700 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {expandedActivities[activity.id] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
          </button>
        </div>
        {renderActivityDetails(activity)}
      </div>
    );
  };

  const renderGroupedByAgent = () => {
    const groupedActivities = groupActivitiesByAgent(activities);
    
    return (
      <div className="space-y-4">
        {Object.entries(groupedActivities).map(([agentName, agentActivities]) => (
          <div key={agentName} className="rounded-md border border-gray-200 overflow-hidden dark:border-gray-700">
            <div 
              className="flex cursor-pointer items-center justify-between bg-gray-100 p-2 dark:bg-gray-800"
              onClick={() => toggleGroup(agentName)}
            >
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {agentName} ({agentActivities.length})
              </div>
              <button>
                {expandedGroups[agentName] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
              </button>
            </div>
            {expandedGroups[agentName] && (
              <div className="p-3">
                {agentActivities.map(renderActivity)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGroupedByType = () => {
    const groupedActivities = groupActivitiesByType(activities);
    
    return (
      <div className="space-y-4">
        {Object.entries(groupedActivities).map(([actionType, typeActivities]) => (
          <div key={actionType} className="rounded-md border border-gray-200 overflow-hidden dark:border-gray-700">
            <div 
              className="flex cursor-pointer items-center justify-between bg-gray-100 p-2 dark:bg-gray-800"
              onClick={() => toggleGroup(actionType)}
            >
              <div className="flex items-center font-medium text-gray-800 dark:text-gray-200">
                <span className="mr-2">{getActivityIcon(actionType)}</span>
                {formatActionType(actionType)} ({typeActivities.length})
              </div>
              <button>
                {expandedGroups[actionType] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
              </button>
            </div>
            {expandedGroups[actionType] && (
              <div className="p-3">
                {typeActivities.map(renderActivity)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUngrouped = () => {
    return (
      <div className="space-y-2">
        {activities.map(renderActivity)}
      </div>
    );
  };

  if (activities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade registrada</p>
      </div>
    );
  }

  if (groupByAgent) {
    return renderGroupedByAgent();
  }

  if (groupByType) {
    return renderGroupedByType();
  }

  return renderUngrouped();
};

export default AgentActivityTimeline; 