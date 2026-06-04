/**
 * Production-ready Logger Utility
 * Supports levels: DEBUG, INFO, WARN, ERROR
 * In production mode, DEBUG logs are suppressed for performance and privacy.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Suppress debug logs in production
const IS_PROD = import.meta.env.PROD;
const CURRENT_LEVEL = IS_PROD ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

class Logger {
  constructor(context) {
    this.context = context || 'App';
  }

  formatMessage(level, message, meta) {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      meta: meta && Object.keys(meta).length ? meta : undefined,
    };
  }

  log(levelName, message, meta) {
    const level = LOG_LEVELS[levelName];
    if (level < CURRENT_LEVEL) return;

    const formatted = this.formatMessage(levelName, message, meta);

    const badgeStyle = this.getBadgeStyle(levelName);
    const contextStyle = 'color: #94a3b8; font-weight: 500;';
    const textStyle = 'color: inherit;';

    const consoleArgs = [
      `%c[${levelName}]%c [${formatted.context}] %c${formatted.message}`,
      badgeStyle,
      contextStyle,
      textStyle,
    ];

    if (formatted.meta) {
      consoleArgs.push(formatted.meta);
    }

    // Route to appropriate console method
    if (levelName === 'ERROR') {
      console.error(...consoleArgs);
    } else if (levelName === 'WARN') {
      console.warn(...consoleArgs);
    } else if (levelName === 'DEBUG') {
      console.debug(...consoleArgs);
    } else {
      console.log(...consoleArgs);
    }
  }

  getBadgeStyle(level) {
    const base = 'padding: 2px 4px; border-radius: 3px; font-weight: bold; text-transform: uppercase; font-size: 10px;';
    switch (level) {
      case 'DEBUG': return `${base} bg-slate-800 text-slate-400;`;
      case 'INFO':  return `${base} bg-indigo-950 text-indigo-400 border border-indigo-900;`;
      case 'WARN':  return `${base} bg-amber-950 text-amber-400 border border-amber-900;`;
      case 'ERROR': return `${base} bg-rose-950 text-rose-400 border border-rose-900;`;
      default:      return base;
    }
  }

  debug(message, meta) {
    this.log('DEBUG', message, meta);
  }

  info(message, meta) {
    this.log('INFO', message, meta);
  }

  warn(message, meta) {
    this.log('WARN', message, meta);
  }

  error(message, meta) {
    this.log('ERROR', message, meta);
  }
}

export const createLogger = (context) => new Logger(context);
export default createLogger('App');
