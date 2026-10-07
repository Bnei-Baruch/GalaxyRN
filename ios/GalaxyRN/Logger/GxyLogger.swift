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
        toFile("V", tag, message, nil)
        os_log("%@", log: OSLog.default, type: .debug, GxyLoggerUtils.formatMessage(message))
    }
    
    static func v(_ tag: String, _ message: String, _ error: Error?) {
        toFile("V", tag, message, error)
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
        toFile("D", tag, message, nil)
        os_log("%@", log: OSLog.default, type: .debug, GxyLoggerUtils.formatMessage(message))
    }
    
    static func d(_ tag: String, _ message: String, _ error: Error?) {
        toFile("D", tag, message, error)
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
        toFile("I", tag, message, nil)
        os_log("%@", log: OSLog.default, type: .info, GxyLoggerUtils.formatMessage(message))
    }
    
    static func i(_ tag: String, _ message: String, _ error: Error?) {
        toFile("I", tag, message, error)
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
        toFile("W", tag, message, nil)
        os_log("%@", log: OSLog.default, type: .default, GxyLoggerUtils.formatMessage(message))
        SentryUtils.reportToSentry(level: .warning, tag: tag, message: message, error: nil)
    }
    
    static func w(_ tag: String, _ message: String, _ error: Error?) {
        toFile("W", tag, message, error)
        let formattedMessage = GxyLoggerUtils.formatMessage(message)
        if let error = error {
            os_log("%@ - Error: %@", log: OSLog.default, type: .default, formattedMessage, error.localizedDescription)
        } else {
            os_log("%@", log: OSLog.default, type: .default, formattedMessage)
        }
        SentryUtils.reportToSentry(level: .warning, tag: tag, message: message, error: error)
    }
    
    // MARK: - ERROR level logging
    
    static func e(_ message: String) {
        e(DEFAULT_TAG, message)
    }
    
    static func e(_ tag: String, _ message: String) {
        toFile("E", tag, message, nil)
        os_log("%@", log: OSLog.default, type: .error, GxyLoggerUtils.formatMessage(message))
        SentryUtils.reportToSentry(level: .error, tag: tag, message: message, error: nil)
    }
    
    static func e(_ tag: String, _ message: String, _ error: Error?) {
        toFile("E", tag, message, error)
        let formattedMessage = GxyLoggerUtils.formatMessage(message)
        if let error = error {
            os_log("%@ - Error: %@", log: OSLog.default, type: .error, formattedMessage, error.localizedDescription)
        } else {
            os_log("%@", log: OSLog.default, type: .error, formattedMessage)
        }
        SentryUtils.reportToSentry(level: .error, tag: tag, message: message, error: error)
    }

    // Debug/verbose lines go to the log file only while verbose logging is on
    private static func toFile(_ level: String, _ tag: String, _ message: String, _ error: Error?) {
        if (level == "V" || level == "D") && !LogFileWriter.shared.isVerbose() { return }
        LogFileWriter.shared.appendLine(level: level, tag: tag, message: message, error: error)
    }
}

/**
 * Persistent rotating log file shared by JS (via SendLogsModule.appendLogs) and
 * native (via GxyLogger). All file I/O runs on a serial background queue.
 *
 * Uses os_log for its own diagnostics, never GxyLogger, to avoid recursion.
 */
final class LogFileWriter {
    static let shared = LogFileWriter()

    private static let maxFileBytes: UInt64 = 1024 * 1024
    private static let maxFiles = 5

    private let queue = DispatchQueue(label: "com.galaxy.mobile.logfile", qos: .utility)
    private let dir: URL?
    private let formatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private let verboseLock = NSLock()
    private var verboseUntil: Double = 0

    // Accessed only on queue
    private var handle: FileHandle?
    private var currentSize: UInt64 = 0

    private init() {
        let fm = FileManager.default
        guard var url = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?
            .appendingPathComponent("logs", isDirectory: true) else {
            dir = nil
            return
        }
        do {
            try fm.createDirectory(at: url, withIntermediateDirectories: true)
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            try url.setResourceValues(values)
            dir = url
        } catch {
            os_log("LogFileWriter: failed to create log dir: %@", log: OSLog.default, type: .error, error.localizedDescription)
            dir = nil
        }
    }

    func setVerboseUntil(_ until: Double) {
        verboseLock.lock()
        verboseUntil = until
        verboseLock.unlock()
    }

    func isVerbose() -> Bool {
        verboseLock.lock()
        defer { verboseLock.unlock() }
        return Date().timeIntervalSince1970 * 1000 < verboseUntil
    }

    /// Appends a native log line.
    func appendLine(level: String, tag: String, message: String, error: Error?) {
        guard dir != nil else { return }
        let date = Date()
        queue.async {
            var line = "\(self.formatter.string(from: date)) \(level) [native:\(tag)] \(message)"
            if let error = error {
                line += " - Error: \(error.localizedDescription)"
            }
            self.write(line + "\n")
        }
    }

    /// Appends pre-formatted text (newline-terminated lines) coming from JS.
    func append(_ text: String) {
        guard dir != nil, !text.isEmpty else { return }
        queue.async { self.write(text) }
    }

    /// Reads all log files, oldest first.
    func readAll(_ completion: @escaping (Result<String, Error>) -> Void) {
        queue.async {
            guard self.dir != nil else {
                completion(.success(""))
                return
            }
            var result = ""
            for i in stride(from: LogFileWriter.maxFiles - 1, through: 0, by: -1) {
                let url = self.fileAt(i)
                guard FileManager.default.fileExists(atPath: url.path) else { continue }
                do {
                    let data = try Data(contentsOf: url)
                    result += String(decoding: data, as: UTF8.self)
                } catch {
                    completion(.failure(error))
                    return
                }
            }
            completion(.success(result))
        }
    }

    private func write(_ text: String) {
        let data = Data(text.utf8)
        do {
            if handle == nil { try openHandle() }
            guard let handle = handle else { return }
            try handle.write(contentsOf: data)
            currentSize += UInt64(data.count)
            if currentSize >= LogFileWriter.maxFileBytes { rotate() }
        } catch {
            os_log("LogFileWriter: failed to write: %@", log: OSLog.default, type: .error, error.localizedDescription)
            try? handle?.close()
            handle = nil
        }
    }

    private func openHandle() throws {
        let url = fileAt(0)
        if !FileManager.default.fileExists(atPath: url.path) {
            FileManager.default.createFile(atPath: url.path, contents: nil)
        }
        let h = try FileHandle(forWritingTo: url)
        currentSize = try h.seekToEnd()
        handle = h
    }

    private func rotate() {
        try? handle?.close()
        handle = nil
        let fm = FileManager.default
        try? fm.removeItem(at: fileAt(LogFileWriter.maxFiles - 1))
        for i in stride(from: LogFileWriter.maxFiles - 2, through: 0, by: -1) {
            let from = fileAt(i)
            if fm.fileExists(atPath: from.path) {
                try? fm.moveItem(at: from, to: fileAt(i + 1))
            }
        }
        currentSize = 0
    }

    private func fileAt(_ index: Int) -> URL {
        // Only called when dir != nil
        return dir!.appendingPathComponent("gxy-\(index).log")
    }
}
