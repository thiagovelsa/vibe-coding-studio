import React from 'react';
import { FiAlertTriangle, FiXCircle, FiCheck } from 'react-icons/fi';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 
                  transform transition-all duration-300 ease-in-out animate-fade-in"
      >
        <div className="mb-4 flex items-start">
          <div className={`mr-4 flex-shrink-0 rounded-full p-2 ${destructive ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'}`}>
            <FiAlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            <FiXCircle className="mr-2" />
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
              ${destructive 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800'
              }`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <FiCheck className="mr-2" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 