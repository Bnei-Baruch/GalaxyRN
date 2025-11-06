import Foundation
import UIKit
import os.log

/**
 * Custom Logger for GalaxyRN iOS Application
 * Provides structured logging with different levels
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
    
    // MARK: - VERBOSE level logging
    
    static func v(_ message: String) {
        v(DEFAULT_TAG, message)
    }
    
    static func v(_ tag: String, _ message: String) {
        os_log("%@", log: OSLog.default, type: .debug, GxyLoggerUtils.formatMessage(message))
    }
    
    static func v(_ tag: String, _ message: String, _ error: Error?) {
        let formattedMessage = GxyLoggerUtils.formatMessage(message)
        if let error = error {
            os_log("%@ - Error: %@", log: OSLog.default, type: .debug, formattedMessage, error.localizedDescription)
        } else {
            os_log("%@", log: OSLog.default, type: .debug, formattedMessage)
        }
    }
    
    // MARK: - DEBUG level logging
    
    static func d(_ message: String) {
        d(DEFAULT_TAG, message)
    }
    
    static func d(_ tag: String, _ message: String) {
        os_log("%@", log: OSLog.default, type: .debug, GxyLoggerUtils.formatMessage(message))
    }
    
    static func d(_ tag: String, _ message: String, _ error: Error?) {
        let formattedMessage = GxyLoggerUtils.formatMessage(message)
        if let error = error {
            os_log("%@ - Error: %@", log: OSLog.default, type: .debug, formattedMessage, error.localizedDescription)
        } else {
            os_log("%@", log: OSLog.default, type: .debug, formattedMessage)
        }
    }
    
    // MARK: - INFO level logging
    
    static func i(_ message: String) {
        i(DEFAULT_TAG, message)
    }
    
    static func i(_ tag: String, _ message: String) {
        os_log("%@", log: OSLog.default, type: .info, GxyLoggerUtils.formatMessage(message))
    }
    
    static func i(_ tag: String, _ message: String, _ error: Error?) {
        let formattedMessage = GxyLoggerUtils.formatMessage(message)
        if let error = error {
            os_log("%@ - Error: %@", log: OSLog.default, type: .info, formattedMessage, error.localizedDescription)
        } else {
            os_log("%@", log: OSLog.default, type: .info, formattedMessage)
        }
    }
    
    // MARK: - WARN level logging
    
    static func w(_ message: String) {
        w(DEFAULT_TAG, message)
    }
    
    static func w(_ tag: String, _ message: String) {
        os_log("%@", log: OSLog.default, type: .default, GxyLoggerUtils.formatMessage(message))
    }
    
    static func w(_ tag: String, _ message: String, _ error: Error?) {
        let formattedMessage = GxyLoggerUtils.formatMessage(message)
        if let error = error {
            os_log("%@ - Error: %@", log: OSLog.default, type: .default, formattedMessage, error.localizedDescription)
        } else {
            os_log("%@", log: OSLog.default, type: .default, formattedMessage)
        }
    }
    
    // MARK: - ERROR level logging
    
    static func e(_ message: String) {
        e(DEFAULT_TAG, message)
    }
    
    static func e(_ tag: String, _ message: String) {
        os_log("%@", log: OSLog.default, type: .error, GxyLoggerUtils.formatMessage(message))
    }
    
    static func e(_ tag: String, _ message: String, _ error: Error?) {
        let formattedMessage = GxyLoggerUtils.formatMessage(message)
        if let error = error {
            os_log("%@ - Error: %@", log: OSLog.default, type: .error, formattedMessage, error.localizedDescription)
        } else {
            os_log("%@", log: OSLog.default, type: .error, formattedMessage)
        }
    }
}
