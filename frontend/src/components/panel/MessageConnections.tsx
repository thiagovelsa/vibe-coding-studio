import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface MessageConnectionsProps {
  // In a real implementation, props would include message positions, relationships, etc.
  // For now, it's purely decorative to show the style.
  messageCount?: number; // Example prop to vary the display slightly
}

export const MessageConnections: React.FC<MessageConnectionsProps> = ({ messageCount = 5 }) => {
  const { theme } = useTheme();

  const strokeColor = theme === 'dark' ? 'url(#line-gradient-dark)' : 'url(#line-gradient-light)';
  const initialPathLength = 0.2; // Start partially drawn
  const animatePathLength = 0.8 + Math.random() * 0.2; // Animate to almost full

  // NOTE: These paths are *not* dynamically calculated based on message positions.
  // They are representative examples of the desired curve and style.
  const examplePaths = [
    "M 30 20 Q 50 50 30 80",
    "M 30 120 Q 60 150 30 180",
    "M 30 220 Q 50 250 30 280",
  ];

  return (
    <div 
        className="absolute inset-0 pointer-events-none" 
        aria-hidden="true"
        style={{ zIndex: -1 }} // Ensure it's behind messages
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="line-gradient-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(167, 139, 250, 0)" /> 
            <stop offset="50%" stopColor="rgba(167, 139, 250, 0.5)" /> 
            <stop offset="100%" stopColor="rgba(167, 139, 250, 0)" />
          </linearGradient>
          <linearGradient id="line-gradient-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </linearGradient>
        </defs>

        {/* Render a few example paths based on messageCount */}
        {examplePaths.slice(0, Math.min(examplePaths.length, Math.floor(messageCount / 2))).map((pathD, index) => (
          <motion.path
            key={index}
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: initialPathLength, opacity: 0 }}
            animate={{
              pathLength: animatePathLength,
              opacity: 0.6,
              transition: {
                pathLength: { duration: 1.5, ease: "easeInOut", delay: index * 0.2 },
                opacity: { duration: 0.5, delay: index * 0.2 }
              }
            }}
          />
        ))}
      </svg>
    </div>
  );
};

// export default MessageConnections; 