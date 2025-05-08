import React from 'react';

interface GitPanelProps {
  className?: string;
}

const GitPanel: React.FC<GitPanelProps> = ({ className }) => {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 dark:text-gray-400 p-4">Git Panel Content (TODO)</p>
    </div>
  );
};

export default GitPanel; 