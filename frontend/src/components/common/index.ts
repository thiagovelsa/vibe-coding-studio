// Exportação de componentes comuns para fácil importação

// Dialogs e Feedback
export { default as ConfirmationDialog } from './ConfirmationDialog';
export { default as FeedbackMessage } from './FeedbackMessage';
export { default as Tooltip } from './Tooltip';

// Componentes de Feedback e Animação
export { 
  AnimatedFeedback, 
  useAnimatedFeedback 
} from './AnimatedFeedback';
export { 
  CommandFeedback, 
  useCommandFeedback 
} from './CommandFeedback';
export { 
  FileFeedback, 
  useFileFeedback 
} from './FileFeedback';
export { TabWithFeedback } from './TabWithFeedback';
export { 
  KeyboardFeedback, 
  useKeyboardFeedback, 
  KeyboardShortcutsList 
} from './KeyboardFeedback';
export { 
  AnimatedContextMenu, 
  useContextMenu, 
  MenuDivider, 
  MenuGroup 
} from './AnimatedContextMenu';
export { 
  ToasterProvider, 
  useToaster, 
  useToasts 
} from './Toaster';

// Wrappers de Animação
export { 
  TransitionWrapper, 
  StaggerContainer, 
  StaggerItem, 
  PageTransition 
} from './TransitionWrapper';

// Indicadores e loaders
export { 
  LoadingIndicator, 
  FullPageLoading, 
  LoadingButton 
} from './LoadingIndicator';
export { default as ProgressIndicator } from './ProgressIndicator';
export { default as KeyboardShortcutsGuide } from './KeyboardShortcutsGuide';
export { ThinkingIndicator } from './ThinkingIndicator';

// Drag and Drop
export {
  DraggableItem,
  DropZone,
  useDragAndDrop
} from './DraggableItem';
export {
  FileItemDraggable,
  FileListDraggable
} from './FileItemDraggable';

// Histórico
export {
  HistoryView,
  HistoryStateIndicator,
  HistoryItemView
} from './HistoryView';

// Componentes de UI
export { 
  AnimatedButton 
} from './AnimatedButton';
export { 
  AnimatedCard 
} from './AnimatedCard';
export { 
  AnimatedDiv 
} from './AnimatedDiv';
export { 
  CollapsibleSection 
} from './CollapsibleSection';
export { 
  ErrorBoundary 
} from './ErrorBoundary';
export { 
  ErrorFeedback 
} from './ErrorFeedback';
export { 
  FeedbackPopover 
} from './FeedbackPopover';

// Tipos
export type { FeedbackType } from './FeedbackMessage';
export type { FeedbackStatus } from './AnimatedFeedback';
export type { CommandStatus } from './CommandFeedback';
export type { FileOperation, OperationStatus } from './FileFeedback';
export type { LoadingType } from './LoadingIndicator';
export type { TransitionType } from './TransitionWrapper';
export type { ToastType, ToastPosition, Toast } from './Toaster'; 