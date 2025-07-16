// Backend logging utility
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatLog(level, message, data = {}) {
    return {
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
      ...data
    };
  }

  writeToFile(filename, logEntry) {
    const logPath = path.join(this.logDir, filename);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logPath, logLine);
  }

  log(level, message, data = {}) {
    const logEntry = this.formatLog(level, message, data);
    
    // Console output
    console.log(`[${level.toUpperCase()}] ${message}`, data);
    
    // File output
    const filename = `${level}.log`;
    this.writeToFile(filename, logEntry);
    
    // Combined log
    this.writeToFile('combined.log', logEntry);
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
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }

  // Specialized logging methods
  logRequest(req, res, next) {
    const logData = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      user: req.user?.id || 'anonymous'
    };

    this.info(`${req.method} ${req.url}`, logData);
    next();
  }

  logError(error, req = null) {
    const logData = {
      error: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      user: req?.user?.id || 'anonymous'
    };

    this.error('Application error', logData);
  }

  logOrder(order, action) {
    this.info(`Order ${action}`, {
      orderId: order.id,
      tableId: order.table_id,
      status: order.status,
      totalPrice: order.total_price,
      itemsCount: order.items?.length || 0
    });
  }

  logUserAction(user, action, details = {}) {
    this.info(`User action: ${action}`, {
      userId: user.id,
      username: user.username,
      role: user.role,
      ...details
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger; 