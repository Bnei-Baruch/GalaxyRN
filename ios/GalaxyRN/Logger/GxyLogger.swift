import Foundation
import UIKit
import os.log

/**
 * Custom Logger for GalaxyRN iOS Application
 * Provides structured logging with different levels and automatic filtering for
 * release builds
 */
class GxyLogger {
    
    // Log levels
    static let VERBOSE = 0
    static let DEBUG = 1
    static let INFO = 2
    static let WARN = 3
    static let ERROR = 4
    
    // Default configuration
    private static let DEFAULT_TAG = "GalaxyRN"
    private static var isDebugMode: Bool = {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }()
    private static var minLogLevel = isDebugMode ? VERBOSE : ERROR
    
    /**
     * Configure logger settings
     */
    static func configure(debugMode: Bool, minimumLogLevel: Int) {
        isDebugMode = debugMode
        minLogLevel = minimumLogLevel
    }
    
    // MARK: - VERBOSE level logging
    
    static func v(_ message: String) {
        v(DEFAULT_TAG, message)
    }
    
    static func v(_ tag: String, _ message: String) {
        if shouldLog(VERBOSE) {
            os_log("%@", log: OSLog.default, type: .debug, GxyLoggerUtils.formatMessage(message))
            GxyLoggerUtils.saveToFile("V", tag: tag, message: message, throwable: nil)
        }
    }
    
    static func v(_ tag: String, _ message: String, _ error: Error?) {
        if shouldLog(VERBOSE) {
            let formattedMessage = GxyLoggerUtils.formatMessage(message)
            if let error = error {
                os_log("%@ - Error: %@", log: OSLog.default, type: .debug, formattedMessage, error.localizedDescription)
            } else {
                os_log("%@", log: OSLog.default, type: .debug, formattedMessage)
            }
            GxyLoggerUtils.saveToFile("V", tag: tag, message: message, throwable: error)
        }
    }
    
    // MARK: - DEBUG level logging
    
    static func d(_ message: String) {
        d(DEFAULT_TAG, message)
    }
    
    static func d(_ tag: String, _ message: String) {
        if shouldLog(DEBUG) {
            os_log("%@", log: OSLog.default, type: .debug, GxyLoggerUtils.formatMessage(message))
            GxyLoggerUtils.saveToFile("D", tag: tag, message: message, throwable: nil)
        }
    }
    
    static func d(_ tag: String, _ message: String, _ error: Error?) {
        if shouldLog(DEBUG) {
            let formattedMessage = GxyLoggerUtils.formatMessage(message)
            if let error = error {
                os_log("%@ - Error: %@", log: OSLog.default, type: .debug, formattedMessage, error.localizedDescription)
            } else {
                os_log("%@", log: OSLog.default, type: .debug, formattedMessage)
            }
            GxyLoggerUtils.saveToFile("D", tag: tag, message: message, throwable: error)
        }
    }
    
    // MARK: - INFO level logging
    
    static func i(_ message: String) {
        i(DEFAULT_TAG, message)
    }
    
    static func i(_ tag: String, _ message: String) {
        if shouldLog(INFO) {
            os_log("%@", log: OSLog.default, type: .info, GxyLoggerUtils.formatMessage(message))
            GxyLoggerUtils.saveToFile("I", tag: tag, message: message, throwable: nil)
        }
    }
    
    static func i(_ tag: String, _ message: String, _ error: Error?) {
        if shouldLog(INFO) {
            let formattedMessage = GxyLoggerUtils.formatMessage(message)
            if let error = error {
                os_log("%@ - Error: %@", log: OSLog.default, type: .info, formattedMessage, error.localizedDescription)
            } else {
                os_log("%@", log: OSLog.default, type: .info, formattedMessage)
            }
            GxyLoggerUtils.saveToFile("I", tag: tag, message: message, throwable: error)
        }
    }
    
    // MARK: - WARN level logging
    
    static func w(_ message: String) {
        w(DEFAULT_TAG, message)
    }
    
    static func w(_ tag: String, _ message: String) {
        if shouldLog(WARN) {
            os_log("%@", log: OSLog.default, type: .default, GxyLoggerUtils.formatMessage(message))
            GxyLoggerUtils.saveToFile("W", tag: tag, message: message, throwable: nil)
            GxyLoggerUtils.reportToSentry(level: .warning, tag: tag, message: message, error: nil)
        }
    }
    
    static func w(_ tag: String, _ message: String, _ error: Error?) {
        if shouldLog(WARN) {
            let formattedMessage = GxyLoggerUtils.formatMessage(message)
            if let error = error {
                os_log("%@ - Error: %@", log: OSLog.default, type: .default, formattedMessage, error.localizedDescription)
            } else {
                os_log("%@", log: OSLog.default, type: .default, formattedMessage)
            }
            GxyLoggerUtils.saveToFile("W", tag: tag, message: message, throwable: error)
            GxyLoggerUtils.reportToSentry(level: .warning, tag: tag, message: message, error: error)
        }
    }
    
    // MARK: - ERROR level logging
    
    static func e(_ message: String) {
        e(DEFAULT_TAG, message)
    }
    
    static func e(_ tag: String, _ message: String) {
        if shouldLog(ERROR) {
            os_log("%@", log: OSLog.default, type: .error, GxyLoggerUtils.formatMessage(message))
            GxyLoggerUtils.saveToFile("E", tag: tag, message: message, throwable: nil)
            GxyLoggerUtils.reportToSentry(level: .error, tag: tag, message: message, error: nil)
        }
    }
    
    static func e(_ tag: String, _ message: String, _ error: Error?) {
        if shouldLog(ERROR) {
            let formattedMessage = GxyLoggerUtils.formatMessage(message)
            if let error = error {
                os_log("%@ - Error: %@", log: OSLog.default, type: .error, formattedMessage, error.localizedDescription)
            } else {
                os_log("%@", log: OSLog.default, type: .error, formattedMessage)
            }
            GxyLoggerUtils.saveToFile("E", tag: tag, message: message, throwable: error)
            GxyLoggerUtils.reportToSentry(level: .error, tag: tag, message: message, error: error)
        }
    }
    
    // MARK: - Core utility methods
    
    /**
     * Check if logging should occur for given level
     */
    private static func shouldLog(_ level: Int) -> Bool {
        return isDebugMode || level >= minLogLevel
    }
} 