import React from 'react';

interface AIPanelProps {
  className?: string;
}

const AIPanel: React.FC<AIPanelProps> = ({ className }) => {
  return (
    <div className={`p-2 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <p>AI Agent Status Panel (TODO)</p>
    </div>
  );
};

export default AIPanel; 