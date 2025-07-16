// Frontend logging utility
class FrontendLogger {
  constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'error';
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  shouldLog(level) {
    return this.logLevels[level] >= this.logLevels[this.logLevel];
  }

  formatLog(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...data
    };
  }

  async sendToBackend(logEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send log to backend:', error);
    }
  }

  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLog(level, message, data);
    
    // Console output
    console[level](`[${level.toUpperCase()}] ${message}`, data);
    
    // Send to backend for errors and warnings
    if (level === 'error' || level === 'warn') {
      this.sendToBackend(logEntry);
    }
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  // Specialized logging methods
  logUserAction(action, details = {}) {
    this.info(`User action: ${action}`, details);
  }

  logApiCall(endpoint, method, status, duration = null) {
    this.info(`API call: ${method} ${endpoint}`, {
      status,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  logError(error, context = {}) {
    this.error('Application error', {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }

  logComponentError(componentName, error, props = {}) {
    this.error(`Component error in ${componentName}`, {
      message: error.message,
      stack: error.stack,
      props,
      url: window.location.href
    });
  }
}

// Create singleton instance
const logger = new FrontendLogger();

export default logger; 