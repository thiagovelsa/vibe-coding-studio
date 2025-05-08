import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  constructor(private readonly pinoLogger: PinoLogger) {}

  setContext(context: string) {
    this.pinoLogger.setContext(context);
  }

  trace(message: string, ...args: any[]) {
    this.pinoLogger.trace(message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.pinoLogger.debug(message, ...args);
  }

  log(message: string, ...args: any[]) {
    this.pinoLogger.info(message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.pinoLogger.info(message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.pinoLogger.warn(message, ...args);
  }

  error(message: string, error?: unknown, ...args: any[]) {
    if (error instanceof Error) {
      this.pinoLogger.error({ err: error }, message, ...args);
    } else if (error !== undefined) {
      this.pinoLogger.error({ err: { message: String(error) } }, message, ...args);
    } else {
      this.pinoLogger.error(message, ...args);
    }
  }

  fatal(message: string, error?: unknown, ...args: any[]) {
    if (error instanceof Error) {
      this.pinoLogger.fatal({ err: error }, message, ...args);
    } else if (error !== undefined) {
      this.pinoLogger.fatal({ err: { message: String(error) } }, message, ...args);
    } else {
      this.pinoLogger.fatal(message, ...args);
    }
  }
} 