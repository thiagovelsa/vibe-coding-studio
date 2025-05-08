import React from 'react';
import { ChatSession as ApiChatSession } from '../../../services/agent-api.service';

interface ActiveSessionInfoProps {
  activeSession: ApiChatSession | null;
  className?: string;
}

const ActiveSessionInfo: React.FC<ActiveSessionInfoProps> = React.memo(({ activeSession, className }) => {
  if (!activeSession) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-500 px-1 italic">No active chat session.</p>
    );
  }

  return (
    <div className={`text-xs px-1 space-y-0.5 text-gray-600 dark:text-gray-400 ${className}`}>
      <p title={`Session ID: ${activeSession.id}`} className="truncate">
        <span className="font-medium">ID:</span> {activeSession.id.substring(0, 8)}...
      </p>
      <p><span className="font-medium">Agent:</span> {activeSession.agentType}</p>
      <p><span className="font-medium">Model:</span> {activeSession.modelId || 'N/A'}</p>
      <p><span className="font-medium">Created:</span> {new Date(activeSession.createdAt).toLocaleString()}</p>
    </div>
  );
});

export default ActiveSessionInfo; 