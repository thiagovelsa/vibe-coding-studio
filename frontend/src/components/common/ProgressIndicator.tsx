import React from 'react';
import { ProgressState } from '../../hooks/useProgressIndicator';

interface ProgressIndicatorProps extends Partial<ProgressState> {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'bar' | 'circular' | 'steps';
  showPercentage?: boolean;
  showStatus?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  thickness?: 'thin' | 'normal' | 'thick';
  animate?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress = 0,
  isIndeterminate = false,
  isComplete = false,
  status = '',
  step = 1,
  className = '',
  size = 'md',
  type = 'bar',
  showPercentage = true,
  showStatus = true,
  color = 'primary',
  thickness = 'normal',
  animate = true,
}) => {
  // Classes para cores
  const colorClasses = {
    primary: 'bg-primary-500 text-primary-500',
    secondary: 'bg-secondary-500 text-secondary-500',
    success: 'bg-green-500 text-green-500',
    warning: 'bg-yellow-500 text-yellow-500',
    error: 'bg-red-500 text-red-500',
    info: 'bg-blue-500 text-blue-500',
  };

  // Classes para espessuras
  const thicknessClasses = {
    thin: 'h-1',
    normal: 'h-2',
    thick: 'h-3',
  };

  // Classes para tamanhos
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Classes para o indicador circular
  const circularSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  // Retorna um indicador de barra de progresso
  const renderBar = () => (
    <div className={`w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${sizeClasses[size]} ${className}`}>
      <div
        className={`
          ${thicknessClasses[thickness]} 
          ${colorClasses[color].split(' ')[0]} 
          ${isIndeterminate ? 'animate-pulse' : isComplete ? '' : animate ? 'transition-all duration-300 ease-out' : ''}
        `}
        style={{
          width: isIndeterminate ? '100%' : `${progress}%`,
          opacity: isIndeterminate ? '0.7' : '1',
          backgroundSize: isIndeterminate ? '200% 100%' : 'initial',
        }}
      />
      {(showPercentage || showStatus) && (
        <div className="mt-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
          {showPercentage && (
            <span>{isIndeterminate ? 'Carregando...' : `${Math.round(progress)}%`}</span>
          )}
          {showStatus && status && <span>{status}</span>}
        </div>
      )}
    </div>
  );

  // Calcula o perímetro e o offset do círculo SVG
  const getCircleProps = () => {
    const radius = size === 'sm' ? 24 : size === 'md' ? 36 : 48;
    const strokeWidth = thickness === 'thin' ? 2 : thickness === 'normal' ? 4 : 6;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const offset = isIndeterminate 
      ? circumference * 0.7 
      : circumference - (progress / 100) * circumference;

    return {
      radius,
      strokeWidth,
      normalizedRadius,
      circumference,
      offset,
    };
  };

  // Retorna um indicador circular de progresso
  const renderCircular = () => {
    const { radius, strokeWidth, normalizedRadius, circumference, offset } = getCircleProps();
    const svgSize = radius * 2 + strokeWidth;

    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className={`relative ${circularSizeClasses[size]}`}>
          <svg width={svgSize} height={svgSize} className="absolute inset-0">
            {/* Círculo de fundo */}
            <circle
              r={normalizedRadius}
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              fill="transparent"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Círculo de progresso */}
            <circle
              r={normalizedRadius}
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              fill="transparent"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              className={`${colorClasses[color].split(' ')[1]}`}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
              style={{
                transition: isIndeterminate ? 'none' : 'stroke-dashoffset 0.3s ease-out',
                animation: isIndeterminate ? 'dash 1.5s ease-in-out infinite' : 'none',
              }}
            />
          </svg>
          {/* Texto central */}
          {showPercentage && !isIndeterminate && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-semibold ${sizeClasses[size]}`}>
                {Math.round(progress)}%
              </span>
            </div>
          )}
          {/* Indicador indeterminado */}
          {isIndeterminate && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-${size} font-semibold text-gray-500 dark:text-gray-400`}>
                ...
              </span>
            </div>
          )}
        </div>
        {/* Status (se habilitado) */}
        {showStatus && status && (
          <div className={`mt-2 text-center text-gray-600 dark:text-gray-400 ${sizeClasses[size]}`}>
            {status}
          </div>
        )}
      </div>
    );
  };

  // Retorna um indicador de passos
  const renderSteps = () => (
    <div className={`w-full ${className}`}>
      <div className="mb-2 flex justify-between">
        {Array.from({ length: step }).map((_, i) => {
          const stepNumber = i + 1;
          const isActive = stepNumber === step;
          const isCompleted = stepNumber < step;

          return (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                isCompleted
                  ? `${colorClasses[color].split(' ')[0]} text-white`
                  : isActive
                  ? `border-${color}-500 ${colorClasses[color].split(' ')[1]}`
                  : 'border-gray-300 text-gray-400 dark:border-gray-600'
              }`}
            >
              {stepNumber}
            </div>
          );
        })}
      </div>
      <div className="relative mb-2">
        <div className={`absolute top-0 h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700`} />
        <div
          className={`absolute top-0 h-1 rounded-full ${colorClasses[color].split(' ')[0]} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showStatus && status && (
        <div className={`mt-1 text-center text-gray-600 dark:text-gray-400 ${sizeClasses[size]}`}>
          {status}
        </div>
      )}
    </div>
  );

  // Renderiza o tipo apropriado de indicador
  switch (type) {
    case 'circular':
      return renderCircular();
    case 'steps':
      return renderSteps();
    case 'bar':
    default:
      return renderBar();
  }
};

export default ProgressIndicator; 