/**
 * Simple logger utility that enhances console logging with levels and formatting
 */
export class Logger {
  private static enabled = true;
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
  
  /**
   * Enable or disable all logging
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Set the minimum log level
   */
  static setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }
  
  /**
   * Log debug level messages
   */
  static debug(message: string, ...args: any[]): void {
    if (!this.enabled || this.getLogLevelValue(this.logLevel) > this.getLogLevelValue('debug')) return;
    console.debug(`[DEBUG] ${message}`, ...args);
  }
  
  /**
   * Log info level messages
   */
  static info(message: string, ...args: any[]): void {
    if (!this.enabled || this.getLogLevelValue(this.logLevel) > this.getLogLevelValue('info')) return;
    console.info(`[INFO] ${message}`, ...args);
  }
  
  /**
   * Log warning level messages
   */
  static warn(message: string, ...args: any[]): void {
    if (!this.enabled || this.getLogLevelValue(this.logLevel) > this.getLogLevelValue('warn')) return;
    console.warn(`[WARN] ${message}`, ...args);
  }
  
  /**
   * Log error level messages
   */
  static error(message: string, ...args: any[]): void {
    if (!this.enabled || this.getLogLevelValue(this.logLevel) > this.getLogLevelValue('error')) return;
    console.error(`[ERROR] ${message}`, ...args);
  }
  
  /**
   * Convert log level to numeric value for comparisons
   */
  private static getLogLevelValue(level: 'debug' | 'info' | 'warn' | 'error'): number {
    switch (level) {
      case 'debug': return 0;
      case 'info': return 1;
      case 'warn': return 2;
      case 'error': return 3;
      default: return 1;
    }
  }
} 