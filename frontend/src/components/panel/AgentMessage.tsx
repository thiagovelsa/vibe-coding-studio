import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCpu } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

// Re-use or import existing types if available
// --- Placeholder Types --- (Assuming these might be defined elsewhere)
type AgentStatus = 'online' | 'busy' | 'offline';
interface AgentInfo {
  id: string;
  name: string;
  avatar?: string; // Represents icon type for simplicity (e.g., 'cpu', 'user')
}
type MessageSender = 'user' | AgentInfo;

type ContentType = 'text' | 'code'; // Extend as needed (e.g., 'image')

interface MessageContent {
  type: ContentType;
  value: string;
  language?: string; // For code
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: MessageContent; 
  timestamp: number;
}
// --- End Placeholder Types ---

interface AgentMessageProps {
  message: Message;
  isActiveAgent: boolean; // True if the agent sending this message is the currently active one
}

// --- Sub Components ---

const AgentAvatar = React.memo<{ agent: AgentInfo, theme: 'light' | 'dark' }>(({ agent, theme }) => {
    const bgColor = theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-200/50';
    return (
        <div className={`w-7 h-7 rounded-full ${bgColor} flex items-center justify-center mr-2.5 flex-shrink-0 border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            {/* Simplified avatar logic based on string */}
            {agent.avatar === 'cpu' ? <FiCpu className="w-4 h-4" /> : <FiUser className="w-4 h-4" />}
        </div>
    );
});

const CodeBlock = React.memo<{ code: string; language?: string; theme: 'light' | 'dark' }>(({ code, language, theme }) => {
    const bg = theme === 'dark' ? 'bg-black/30' : 'bg-gray-900/5';
    const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
    // Basic styling - Real implementation would use a syntax highlighter (Prism.js, highlight.js)
    return (
        <pre className={`p-3 rounded-md ${bg} ${textColor} text-xs font-mono overflow-x-auto custom-scrollbar mt-2 border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <code>{code}</code>
        </pre>
    );
});

// --- Main Message Component ---

export const AgentMessage = React.memo<AgentMessageProps>(({ message, isActiveAgent }) => {
  const { theme } = useTheme();
  const isUser = message.sender === 'user';

  // --- Memoized Style Calculations ---
  const styles = useMemo(() => {
    return {
      agentBubbleBg: theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-100/40',
      userBubbleBg: theme === 'dark' 
          ? 'bg-gradient-to-br from-blue-600/50 to-purple-600/50' 
          : 'bg-gradient-to-br from-blue-400/60 to-purple-400/60',
      activeRing: theme === 'dark' ? 'ring-purple-400/60' : 'ring-purple-500/60',
      codeTheme: theme
    };
  }, [theme]);

  // --- Memoized Animations ---
  const animations = useMemo(() => {
    return {
      messageVariants: {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
        exit: { opacity: 0, transition: { duration: 0.15 } }
      },
      agentStateVariants: {
        active: { opacity: 1, scale: 1.02, transition: { duration: 0.3 } },
        inactive: { opacity: 0.7, scale: 1, transition: { duration: 0.3 } },
      }
    };
  }, []);

  // --- Memoized Render Content Function ---
  const renderContent = useMemo(() => {
    return (content: MessageContent) => {
      switch (content.type) {
        case 'code':
          return <CodeBlock code={content.value} language={content.language} theme={styles.codeTheme} />;
        case 'text':
        default:
          return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content.value}</p>;
      }
    };
  }, [styles.codeTheme]);

  if (isUser) {
    return (
      <motion.div
        key={message.id}
        className="flex justify-end mb-4 ml-auto max-w-[85%] group"
        variants={animations.messageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className={`px-3.5 py-2.5 rounded-xl ${styles.userBubbleBg} backdrop-blur-sm shadow-sm text-white`}>
          {renderContent(message.content)}
        </div>
      </motion.div>
    );
  } else {
    // Agent Message
    const agentInfo = message.sender as AgentInfo; // Type assertion
    return (
      <motion.div
        key={message.id}
        className="flex items-start mb-4 mr-auto max-w-[85%] group"
        variants={animations.messageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <AgentAvatar agent={agentInfo} theme={theme} />
        <motion.div 
          className={`flex flex-col items-start p-3 rounded-xl ${styles.agentBubbleBg} backdrop-blur-sm shadow-sm border ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} ${isActiveAgent ? `ring-1 ${styles.activeRing}` : ''}`}
          variants={animations.agentStateVariants}
          animate={isActiveAgent ? 'active' : 'inactive'}
          style={{ transformOrigin: 'left center' }} // Scale from the avatar side
        >
          <span className="text-xs font-medium mb-1 opacity-80">{agentInfo.name}</span>
           {renderContent(message.content)}
        </motion.div>
      </motion.div>
    );
  }
});

// export default AgentMessage; 