import React from 'react';
import { PanelId } from '../../../context/UIStateContext';
import FileTreePanel from './FileTreePanel';
import SettingsPanel from './SettingsPanel';
import { SearchPanel, GitPanel, AIPanel } from './panel';

interface PanelSelectorProps {
  activePanel: PanelId | null;
  className?: string;
}

const PanelSelector: React.FC<PanelSelectorProps> = React.memo(({ activePanel, className }) => {
  switch (activePanel) {
    case 'explorer':
      return (
        <FileTreePanel className={`${className} overflow-y-auto custom-scrollbar px-2 relative min-h-[100px]`} />
      );
    case 'search':
      return <SearchPanel className={className} />;
    case 'git':
      return <GitPanel className={className} />;
    case 'ai':
      return <AIPanel className={className} />;
    case 'settings':
      return <SettingsPanel className={`${className} p-2 space-y-4 text-xs`} />;
    default:
      return <p className={`${className} text-xs text-center p-4 text-gray-400`}>Selecione um painel.</p>;
  }
});

export default PanelSelector; 