/**
 * Logger utility for production-ready logging
 * Different log levels for development vs production
 */

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = process.env.NODE_ENV === 'production'
  ? logLevels.INFO
  : logLevels.DEBUG;

const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    env: process.env.NODE_ENV,
  };

  if (data) {
    logEntry.data = data;
  }

  return JSON.stringify(logEntry);
};

const logger = {
  error: (message, error = null) => {
    if (currentLogLevel >= logLevels.ERROR) {
      console.error(formatLog('ERROR', message, error ? error.message : null));
    }
  },

  warn: (message, data = null) => {
    if (currentLogLevel >= logLevels.WARN) {
      console.warn(formatLog('WARN', message, data));
    }
  },

  info: (message, data = null) => {
    if (currentLogLevel >= logLevels.INFO) {
      console.log(formatLog('INFO', message, data));
    }
  },

  debug: (message, data = null) => {
    if (currentLogLevel >= logLevels.DEBUG) {
      console.log(formatLog('DEBUG', message, data));
    }
  },
};

module.exports = logger;
