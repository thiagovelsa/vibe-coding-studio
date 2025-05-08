import React from 'react';
import { FiX, FiSquare, FiMinus } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeProvider';
import { Logger } from '../../lib/Logger';

// Define API expected from preload script (adjust if necessary)
interface TitleBarApi {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electron?: {
      app?: TitleBarApi;
      // Include other electron APIs if exposed under the same key
    };
  }
}

export const CustomTitleBar: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const isElectron = !!window.electron?.app; // Check specifically for the app controls

  const handleMinimize = () => {
    if (window.electron?.app?.minimize) {
      window.electron.app.minimize();
    } else {
      Logger.warn('Minimize function not available.');
    }
  };

  const handleMaximize = () => {
    if (window.electron?.app?.maximize) {
      window.electron.app.maximize();
    } else {
      Logger.warn('Maximize function not available.');
    }
  };

  const handleClose = () => {
    if (window.electron?.app?.close) {
      window.electron.app.close();
    } else {
      Logger.warn('Close function not available.');
    }
  };

  // Don't render the bar if not in Electron context
  if (!isElectron) {
    return null;
  }

  const bgColor = theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-100/80';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-black/10';
  const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const hoverBg = theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10';
  const hoverCloseBg = theme === 'dark' ? 'hover:bg-red-500/70' : 'hover:bg-red-500/70';
  const hoverCloseText = 'hover:text-white';

  return (
    <div 
      className={`fixed top-0 left-0 right-0 h-8 flex items-center justify-between px-2 border-b ${borderColor} ${bgColor} backdrop-blur-sm z-50`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} // Make the whole bar draggable
    >
      {/* Left section - Title or Logo (Optional) */}
      <div className={`text-xs font-semibold ${textColor}`}>Vibe Coding Studio</div>

      {/* Right section - Window Controls */}
      <div className="flex items-center space-x-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}> {/* Make buttons non-draggable */}
        <button 
          onClick={handleMinimize} 
          className={`p-1.5 rounded ${hoverBg} ${textColor}`}
          title="Minimize"
        >
          <FiMinus className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={handleMaximize} 
          className={`p-1.5 rounded ${hoverBg} ${textColor}`}
          title="Maximize/Restore"
        >
          {/* Icon changes based on maximized state - needs state from main process via IPC */}
          <FiSquare className="w-3.5 h-3.5" /> 
        </button>
        <button 
          onClick={handleClose} 
          className={`p-1.5 rounded ${hoverCloseBg} ${textColor} ${hoverCloseText}`}
          title="Close"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}); 