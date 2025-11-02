/**
 * Structured logging utility for server-side code
 * Logs to console in a structured JSON format that's easy to search in Vercel logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, meta?: LogContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
    };

    const logString = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      default:
        console.log(logString);
    }
  }

  debug(message: string, meta?: LogContext) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: LogContext) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogContext) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: LogContext) {
    this.log('error', message, meta);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

/**
 * Create a logger instance
 * @param context Optional context to include in all log entries
 */
export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = new Logger();
