import Foundation
import UIKit
import os.log

/**
 * Utility class for GxyLogger containing Sentry integration,
 * message formatting, and other helper functionality
 */
class GxyLoggerUtils {
    
    private static let TAG = "GxyLoggerUtils"
    
    // Date formatters for timestamps
    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss.SSS"
        formatter.locale = Locale.current
        return formatter
    }()
    
    private static let fileDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        formatter.locale = Locale.current
        return formatter
    }()
    
    // File logging options
    private static var logDir: String?
    private static var logFileName = "gxy_logger.log"
    private static var documentsLogDir: String?
    private static var maxLogFileSize: Int64 = 5 * 1024 * 1024 // 5MB default
    private static var maxLogFiles = 3 // Keep 3 log files
    
    // Buffer for batched logging
    private static var logBuffer: [String] = []
    private static let BUFFER_SIZE = 50 // Write every 50 logs
    private static var isWriting = false
    private static let logQueue = DispatchQueue(label: "com.galaxyrn.logger.filewrite", qos: .utility)
    
    // MARK: - PUBLIC UTILITY METHODS
    
    /**
     * Format log message with additional info (always includes timestamp, thread
     * info, and method info)
     */
    static func formatMessage(_ message: String) -> String {
        var formatted = ""
        
        // Add timestamp (always)
        formatted += "[\(dateFormatter.string(from: Date()))] "
        
        // Add thread info (always)
        let currentThread = Thread.current
        let threadName = currentThread.isMainThread ? "Main" : (currentThread.name ?? "Background")
        formatted += "[Thread:\(threadName)] "
        
        // Add method info (always)
        let stackTrace = Thread.callStackSymbols
        if stackTrace.count > 6 {
            let caller = stackTrace[6]
            // Parse the stack trace to get class and method info
            if let range = caller.range(of: " ") {
                let methodInfo = String(caller[range.upperBound...])
                if let spaceRange = methodInfo.range(of: " ") {
                    let className = String(methodInfo[..<spaceRange.lowerBound])
                    formatted += "[\(className)] "
                }
            }
        }
        
        formatted += message
        return formatted
    }
    
    /**
     * Log device information (useful for debugging)
     */
    static func logDeviceInfo(_ defaultTag: String = TAG) {
        GxyLogger.i(defaultTag, "=== DEVICE INFORMATION ===")
        GxyLogger.i(defaultTag, "Device Model: \(UIDevice.current.model)")
        GxyLogger.i(defaultTag, "Device Name: \(UIDevice.current.name)")
        GxyLogger.i(defaultTag, "System Name: \(UIDevice.current.systemName)")
        GxyLogger.i(defaultTag, "System Version: \(UIDevice.current.systemVersion)")
        
        if let infoDictionary = Bundle.main.infoDictionary {
            if let appVersion = infoDictionary["CFBundleShortVersionString"] as? String {
                GxyLogger.i(defaultTag, "App Version: \(appVersion)")
            }
            if let buildNumber = infoDictionary["CFBundleVersion"] as? String {
                GxyLogger.i(defaultTag, "Build Number: \(buildNumber)")
            }
        }
        
        GxyLogger.i(defaultTag, "========================")
    }
    
    /**
     * Get current log level as string
     */
    static func getCurrentLogLevel(_ minLogLevel: Int) -> String {
        switch minLogLevel {
        case GxyLogger.VERBOSE:
            return "VERBOSE"
        case GxyLogger.DEBUG:
            return "DEBUG"
        case GxyLogger.INFO:
            return "INFO"
        case GxyLogger.WARN:
            return "WARN"
        case GxyLogger.ERROR:
            return "ERROR"
        default:
            return "UNKNOWN"
        }
    }
    
    // MARK: - SENTRY METHODS
    
    /**
     * Report warning and error messages to Sentry
     */
    static func reportToSentry(level: SentryLevel, tag: String, message: String, error: Error?) {
        SentryUtils.reportToSentry(level: level, tag: tag, message: message, error: error)
    }
    
    /**
     * Report critical errors that should always be sent to Sentry
     * regardless of log level settings
     */
    static func reportCritical(tag: String, message: String, error: Error?) {
        SentryUtils.reportCritical(tag: tag, message: message, error: error)
    }
    
    /**
     * Add breadcrumb to Sentry for tracking user actions
     */
    static func addBreadcrumb(category: String, message: String) {
        GxyLogger.d("Breadcrumb", "[\(category)] \(message)")
        SentryUtils.addBreadcrumb(category: category, message: message)
    }
    
    // MARK: - FILE LOGGING INITIALIZATION
    
    /**
     * Initialize file logging with log directory path
     */
    static func initializeFileLogging() {
        // Use the app's documents directory for logs
        if let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            logDir = documentsDirectory.appendingPathComponent("logs").path
            GxyLogger.i(TAG, "Log directory: \(logDir!)")
            
            do {
                try FileManager.default.createDirectory(atPath: logDir!, withIntermediateDirectories: true, attributes: nil)
            } catch {
                os_log("Failed to create log directory: %@", log: OSLog.default, type: .error, logDir!)
            }
        }
        
        // Also create a logs directory in the app's caches directory for external access
        if let cachesDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first {
            documentsLogDir = cachesDirectory.appendingPathComponent("logs").path
            GxyLogger.i(TAG, "Documents log directory: \(documentsLogDir!)")
            
            do {
                try FileManager.default.createDirectory(atPath: documentsLogDir!, withIntermediateDirectories: true, attributes: nil)
            } catch {
                os_log("Failed to create documents log directory: %@", log: OSLog.default, type: .error, documentsLogDir!)
            }
        }
    }
    
    /**
     * Configure file logging settings
     */
    static func configureFileLogging(fileName: String, maxFileSize: Int64, maxFiles: Int) {
        logFileName = fileName
        maxLogFileSize = maxFileSize
        self.maxLogFiles = maxFiles
    }
    
    // MARK: - FILE LOGGING CORE FUNCTIONALITY
    
    /**
     * Save log message to buffer
     */
    static func saveToFile(_ level: String, tag: String, message: String, throwable: Error?) {
        guard let logDir = logDir, !logDir.isEmpty else {
            return
        }
        
        // Format the log entry and add to buffer
        let logEntry = formatFileLogEntry(level: level, tag: tag, message: message, error: throwable)
        
        logQueue.async {
            logBuffer.append(logEntry)
            
            // Flush if buffer is full
            if logBuffer.count >= BUFFER_SIZE {
                flushBuffer()
            }
        }
    }
    
    /**
     * Flush the log buffer to file
     */
    static func flushBuffer() {
        guard !isWriting else { return }
        guard !logBuffer.isEmpty else { return }
        guard let logDir = logDir else { return }
        
        isWriting = true
        
        let logsToWrite = logBuffer
        logBuffer.removeAll()
        
        let logFile = getLogFile()
        
        do {
            // Check if file needs rotation
            if let fileAttributes = try? FileManager.default.attributesOfItem(atPath: logFile.path),
               let fileSize = fileAttributes[.size] as? Int64,
               fileSize > maxLogFileSize {
                rotateLogFiles()
            }
            
            // Append logs to file
            let logContent = logsToWrite.joined(separator: "\n") + "\n"
            
            if FileManager.default.fileExists(atPath: logFile.path) {
                if let fileHandle = FileHandle(forWritingAtPath: logFile.path) {
                    fileHandle.seekToEndOfFile()
                    if let data = logContent.data(using: .utf8) {
                        fileHandle.write(data)
                    }
                    fileHandle.closeFile()
                }
            } else {
                try logContent.write(to: logFile, atomically: true, encoding: .utf8)
            }
            
        } catch {
            os_log("Failed to write logs to file: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
        
        isWriting = false
    }
    
    /**
     * Force flush all pending logs immediately
     */
    static func forceFlush() {
        logQueue.sync {
            flushBuffer()
        }
    }
    
    /**
     * Clear all log files
     */
    static func clearLogFiles() {
        guard let logDir = logDir else { return }
        
        do {
            let fileManager = FileManager.default
            let logFiles = try fileManager.contentsOfDirectory(atPath: logDir)
            
            for file in logFiles {
                if file.hasSuffix(".log") {
                    let filePath = URL(fileURLWithPath: logDir).appendingPathComponent(file).path
                    try fileManager.removeItem(atPath: filePath)
                }
            }
            
            GxyLogger.i(TAG, "Cleared all log files")
        } catch {
            GxyLogger.e(TAG, "Failed to clear log files", error)
        }
    }
    
    /**
     * Check if file logging is enabled
     */
    static func isFileLoggingEnabled() -> Bool {
        return logDir != nil
    }
    
    /**
     * Get the log directory path
     */
    static func getLogDir() -> String? {
        return logDir
    }
    
    /**
     * Get the documents log directory path
     */
    static func getDocumentsLogDir() -> String? {
        return documentsLogDir
    }
    
    /**
     * Get the current log file path
     */
    static func getLogFilePath() -> String? {
        guard let logDir = logDir else { return nil }
        return URL(fileURLWithPath: logDir).appendingPathComponent(logFileName).path
    }
    
    /**
     * Get information about log files
     */
    static func getLogFilesInfo() -> String {
        guard let logDir = logDir else {
            return "Log directory not initialized"
        }
        
        var info = "Log Files Information:\n"
        info += "Log Directory: \(logDir)\n"
        
        do {
            let fileManager = FileManager.default
            let logFiles = try fileManager.contentsOfDirectory(atPath: logDir)
            let sortedLogFiles = logFiles.filter { $0.hasSuffix(".log") }.sorted()
            
            if sortedLogFiles.isEmpty {
                info += "No log files found\n"
            } else {
                info += "Found \(sortedLogFiles.count) log files:\n"
                
                for file in sortedLogFiles {
                    let filePath = URL(fileURLWithPath: logDir).appendingPathComponent(file).path
                    if let attributes = try? fileManager.attributesOfItem(atPath: filePath),
                       let fileSize = attributes[.size] as? Int64,
                       let modificationDate = attributes[.modificationDate] as? Date {
                        let sizeInKB = Double(fileSize) / 1024.0
                        info += "- \(file): \(String(format: "%.2f", sizeInKB)) KB, modified: \(fileDateFormatter.string(from: modificationDate))\n"
                    }
                }
            }
        } catch {
            info += "Error reading log directory: \(error.localizedDescription)\n"
        }
        
        return info
    }
    
    // MARK: - PRIVATE HELPER METHODS
    
    private static func getLogFile() -> URL {
        let logDirURL = URL(fileURLWithPath: logDir!)
        return logDirURL.appendingPathComponent(logFileName)
    }
    
    private static func rotateLogFiles() {
        guard let logDir = logDir else { return }
        
        let fileManager = FileManager.default
        let logDirURL = URL(fileURLWithPath: logDir)
        
        do {
            // Move current log file
            let currentLogFile = logDirURL.appendingPathComponent(logFileName)
            
            if fileManager.fileExists(atPath: currentLogFile.path) {
                let timestamp = Int(Date().timeIntervalSince1970)
                let rotatedFileName = logFileName.replacingOccurrences(of: ".log", with: "_\(timestamp).log")
                let rotatedLogFile = logDirURL.appendingPathComponent(rotatedFileName)
                
                try fileManager.moveItem(at: currentLogFile, to: rotatedLogFile)
            }
            
            // Clean up old log files
            let logFiles = try fileManager.contentsOfDirectory(atPath: logDir)
            let sortedLogFiles = logFiles.filter { $0.hasSuffix(".log") && $0 != logFileName }
                .sorted { $0 > $1 } // Sort by name descending (newest first)
            
            // Keep only the most recent maxLogFiles-1 (plus current)
            if sortedLogFiles.count >= maxLogFiles {
                let filesToDelete = Array(sortedLogFiles.dropFirst(maxLogFiles - 1))
                for file in filesToDelete {
                    let filePath = logDirURL.appendingPathComponent(file).path
                    try fileManager.removeItem(atPath: filePath)
                }
            }
            
        } catch {
            os_log("Failed to rotate log files: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }
    
    private static func formatFileLogEntry(level: String, tag: String, message: String, error: Error?) -> String {
        var logEntry = "\(fileDateFormatter.string(from: Date())) [\(level)] [\(tag)] \(message)"
        
        if let error = error {
            logEntry += "\nError: \(error.localizedDescription)"
            
            // Add stack trace if available
            if let nsError = error as NSError? {
                if let stackTrace = nsError.userInfo["NSStackTraceKey"] as? String {
                    logEntry += "\nStack Trace: \(stackTrace)"
                }
            }
        }
        
        return logEntry
    }
} 