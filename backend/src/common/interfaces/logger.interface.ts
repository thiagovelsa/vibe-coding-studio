export interface LoggerOptions {
  context?: string;
  level?: string;
}

export interface LogPayload {
  message: string;
  context?: string;
  [key: string]: any;
}

export interface ILogger {
  log(message: string, context?: string, ...args: any[]): void;
  error(message: string, trace?: string, context?: string, ...args: any[]): void;
  warn(message: string, context?: string, ...args: any[]): void;
  debug(message: string, context?: string, ...args: any[]): void;
  verbose(message: string, context?: string, ...args: any[]): void;
} 