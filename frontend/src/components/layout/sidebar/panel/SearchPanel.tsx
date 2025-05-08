import React from 'react';

interface SearchPanelProps {
  className?: string;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ className }) => {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 dark:text-gray-400 p-4">Search Panel Content (TODO)</p>
    </div>
  );
};

export default SearchPanel; 