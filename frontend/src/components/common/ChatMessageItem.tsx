import React, { memo } from 'react';
import { ChatMessage } from '../../services/agent-api.service'; // Ajuste o caminho/tipagem conforme necessário
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { FiUser, FiCpu } from 'react-icons/fi';

interface MessageItemProps {
  message: ChatMessage;
  theme: string;
  isLast: boolean;
  style?: React.CSSProperties;
}

export const ChatMessageItem = memo(({
  message,
  theme,
  isLast,
  style
}: MessageItemProps) => {
  const isUser = message.role === 'user';
  const bgColor = isUser 
    ? theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100' 
    : theme === 'dark' ? 'bg-gray-700' : 'bg-white';
  
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const iconBgColor = isUser
    ? theme === 'dark' ? 'bg-purple-700' : 'bg-purple-600'
    : theme === 'dark' ? 'bg-teal-700' : 'bg-teal-600';

  const Icon = isUser ? FiUser : FiCpu;

  return (
    <div 
      className={`flex gap-3 p-4 ${bgColor} ${isLast ? '' : `border-b ${borderColor}`}`}
      style={style}
    >
      <div className={`flex-shrink-0 ${iconBgColor} w-8 h-8 rounded-full flex items-center justify-center text-white`}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-grow overflow-hidden">
        <div className="font-medium text-sm mb-1.5">
          {isUser ? 'Você' : 'Assistente'}
        </div>
        
        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} ${textColor}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={theme === 'dark' ? vscDarkPlus : vs}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação profunda para evitar re-renderizações desnecessárias
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.theme === nextProps.theme &&
    prevProps.isLast === nextProps.isLast
  );
}); 