/**
 * Logger Module for Corgi SLO Manager
 * Provides centralized logging functionality
 */

console.log('Logger module loading...');

// Global Logger object
window.Logger = (function() {
    // Log levels
    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };
    
    // Current log level (default: INFO in production, DEBUG in development)
    let currentLogLevel = LOG_LEVELS.INFO;
    
    // Toggle debug mode
    const setDebugMode = (isDebug) => {
        currentLogLevel = isDebug ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    };
    
    // Check if we should log at this level
    const shouldLog = (level) => {
        return level >= currentLogLevel;
    };
    
    // Core logging function
    const log = (level, message, data) => {
        if (!shouldLog(level)) return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}]`;
        
        switch (level) {
            case LOG_LEVELS.DEBUG:
                console.debug(prefix, 'DEBUG:', message, data || '');
                break;
            case LOG_LEVELS.INFO:
                console.info(prefix, 'INFO:', message, data || '');
                break;
            case LOG_LEVELS.WARN:
                console.warn(prefix, 'WARNING:', message, data || '');
                break;
            case LOG_LEVELS.ERROR:
                console.error(prefix, 'ERROR:', message, data || '');
                break;
        }
    };
    
    // Public API
    return {
        setDebugMode,
        debug: (message, data) => log(LOG_LEVELS.DEBUG, message, data),
        info: (message, data) => log(LOG_LEVELS.INFO, message, data),
        warn: (message, data) => log(LOG_LEVELS.WARN, message, data),
        error: (message, data) => log(LOG_LEVELS.ERROR, message, data)
    };
})();

console.log('Logger module loaded'); 