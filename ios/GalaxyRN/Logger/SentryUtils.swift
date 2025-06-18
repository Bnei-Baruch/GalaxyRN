import Foundation
import UIKit
import os.log
import Sentry
import Compression

// Define SentryLevel enum if not available from Sentry import
enum SentryLevel: String, CaseIterable {
    case fatal = "fatal"
    case error = "error" 
    case warning = "warning"
    case info = "info"
    case debug = "debug"
}

// Add extension to map to Sentry.SentryLevel
extension SentryLevel {
    var sentrySDKLevel: Sentry.SentryLevel {
        switch self {
        case .fatal: return .fatal
        case .error: return .error
        case .warning: return .warning
        case .info: return .info
        case .debug: return .debug
        }
    }
}

/**
 * Utility class for Sentry integration
 * Centralizes all Sentry-related functionality for the GalaxyRN application
 */
class SentryUtils {
    
    private static let TAG = "SentryUtils"
    
    static func reportToSentry(level: SentryLevel, tag: String, message: String, error: Error?) {
        os_log("reportToSentry: level=%@, tag=%@, message=%@", log: OSLog.default, type: .debug, 
               String(describing: level), tag, message)
        
        // Create a formatted message with tag
        let sentryMessage = "[\(tag)] \(message)"
        os_log("Created formatted message for Sentry: %@", log: OSLog.default, type: .debug, sentryMessage)
        
        if let error = error {
            os_log("Reporting exception to Sentry with message", log: OSLog.default, type: .debug)
            // Report exception with message
            SentrySDK.configureScope { scope in
                scope.setTag(value: tag, key: "logger_tag")
                scope.setLevel(level.sentrySDKLevel)
                scope.setExtra(value: sentryMessage, key: "formatted_message")
            }
            SentrySDK.capture(error: error)
            os_log("Successfully reported exception to Sentry", log: OSLog.default, type: .info)
        } else {
            os_log("Reporting message-only to Sentry", log: OSLog.default, type: .debug)
            // Report message only
            SentrySDK.configureScope { scope in
                scope.setTag(value: tag, key: "logger_tag")
                scope.setLevel(level.sentrySDKLevel)
            }
            SentrySDK.capture(message: sentryMessage)
            os_log("Successfully reported message to Sentry", log: OSLog.default, type: .info)
        }
    }
    
    static func reportCritical(tag: String, message: String, error: Error?) {
        os_log("reportCritical called: tag=%@, message=%@", log: OSLog.default, type: .default, tag, message)
        
        // Always log critical errors locally
        os_log("CRITICAL: %@", log: OSLog.default, type: .error, message)
        
        // Always report to Sentry, regardless of settings
        do {
            let criticalMessage = "CRITICAL: [\(tag)] \(message)"
            os_log("Formatted critical message: %@", log: OSLog.default, type: .debug, criticalMessage)
            
            SentrySDK.configureScope { scope in
                scope.setTag(value: tag, key: "logger_tag")
                scope.setTag(value: "critical", key: "severity")
                scope.setLevel(.fatal)
                scope.setExtra(value: criticalMessage, key: "formatted_message")
            }
            
            if let error = error {
                SentrySDK.capture(error: error)
            } else {
                SentrySDK.capture(message: criticalMessage)
            }
            
            os_log("Successfully reported critical error to Sentry", log: OSLog.default, type: .info)
        } catch {
            os_log("Failed to report critical error to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }
    
    static func addBreadcrumb(category: String, message: String) {
        os_log("addBreadcrumb: category=%@, message=%@", log: OSLog.default, type: .debug, category, message)
        
        do {
            let crumb = Breadcrumb(level: .info, category: category)
            crumb.message = message
            SentrySDK.addBreadcrumb(crumb)
            os_log("Successfully added breadcrumb to Sentry", log: OSLog.default, type: .debug)
        } catch {
            os_log("Failed to add breadcrumb to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }
    
    static func compressAndSendLogsToSentry(rnLogDir: String) throws -> URL? {
        os_log("compressAndSendLogsToSentry started: rnLogDir=%@", log: OSLog.default, type: .info, rnLogDir)
        
        let fileManager = FileManager.default
        let cacheDir = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first!
        
        var tempDir: URL?
        
        defer {
            // Clean up temporary directory
            if let tempDir = tempDir, fileManager.fileExists(atPath: tempDir.path) {
                os_log("Cleaning up temporary directory: %@", log: OSLog.default, type: .debug, tempDir.path)
                do {
                    try fileManager.removeItem(at: tempDir)
                    os_log("Cleaned up temporary directory", log: OSLog.default, type: .info)
                } catch {
                    os_log("Failed to clean up temporary directory: %@", log: OSLog.default, type: .default, error.localizedDescription)
                }
            }
        }
        
        do {
            // Create temporary directory
            let timestamp = Int(Date().timeIntervalSince1970)
            tempDir = cacheDir.appendingPathComponent("temp_logs_\(timestamp)")
            os_log("Creating temporary directory: %@", log: OSLog.default, type: .debug, tempDir!.path)
            
            try fileManager.createDirectory(at: tempDir!, withIntermediateDirectories: true, attributes: nil)
            os_log("Created temporary directory: %@", log: OSLog.default, type: .info, tempDir!.path)
            
            // Copy RN logs to temp directory
            os_log("Processing RN logs from directory: %@", log: OSLog.default, type: .debug, rnLogDir)
            let rnLogDirectory = URL(fileURLWithPath: rnLogDir)
            
            if fileManager.fileExists(atPath: rnLogDirectory.path) {
                var isDirectory: ObjCBool = false
                if fileManager.fileExists(atPath: rnLogDirectory.path, isDirectory: &isDirectory) && isDirectory.boolValue {
                    os_log("RN log directory exists, creating subdirectory", log: OSLog.default, type: .debug)
                    let rnLogsSubDir = tempDir!.appendingPathComponent("rn_logs")
                    try fileManager.createDirectory(at: rnLogsSubDir, withIntermediateDirectories: true, attributes: nil)
                    os_log("Copying RN logs to: %@", log: OSLog.default, type: .debug, rnLogsSubDir.path)
                    try copyDirectoryContents(from: rnLogDirectory, to: rnLogsSubDir)
                    os_log("Copied RN logs to temporary directory", log: OSLog.default, type: .info)
                } else {
                    os_log("RN log directory exists but is not a directory: %@", log: OSLog.default, type: .default, rnLogDir)
                }
            } else {
                os_log("RN log directory does not exist: %@", log: OSLog.default, type: .default, rnLogDir)
            }
            
            // Add iOS logs to temp directory
            os_log("Adding iOS logs to temporary directory", log: OSLog.default, type: .debug)
            try addIOSLogsToTempDirectory(tempDir!)
            
            // Compress the temporary directory
            os_log("Starting compression of temporary directory", log: OSLog.default, type: .debug)
            let compressedFile = try compressLogDirectory(sourceDir: tempDir!, cacheDir: cacheDir)
            os_log("Successfully compressed logs: %@", log: OSLog.default, type: .info, compressedFile.path)
            
            // Send to Sentry
            os_log("Sending compressed logs to Sentry", log: OSLog.default, type: .debug)
            sendCompressedLogsToSentry(compressedFile: compressedFile)
            
            os_log("compressAndSendLogsToSentry completed successfully", log: OSLog.default, type: .info)
            return compressedFile
            
        } catch {
            os_log("Failed to compress and send logs to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
            throw error
        }
    }
    
    private static func copyDirectoryContents(from sourceDir: URL, to destDir: URL) throws {
        os_log("copyDirectoryContents: %@ -> %@", log: OSLog.default, type: .debug, sourceDir.path, destDir.path)
        
        let fileManager = FileManager.default
        let files = try fileManager.contentsOfDirectory(at: sourceDir, includingPropertiesForKeys: nil, options: [])
        
        os_log("Found %d files/directories to copy", log: OSLog.default, type: .debug, files.count)
        
        for file in files {
            let destFile = destDir.appendingPathComponent(file.lastPathComponent)
            
            var isDirectory: ObjCBool = false
            if fileManager.fileExists(atPath: file.path, isDirectory: &isDirectory) {
                if isDirectory.boolValue {
                    os_log("Creating directory: %@", log: OSLog.default, type: .debug, file.lastPathComponent)
                    try fileManager.createDirectory(at: destFile, withIntermediateDirectories: true, attributes: nil)
                    try copyDirectoryContents(from: file, to: destFile)
                } else {
                    os_log("Copying file: %@ (%lld bytes)", log: OSLog.default, type: .debug, 
                           file.lastPathComponent, (try file.resourceValues(forKeys: [.fileSizeKey])).fileSize ?? 0)
                    try fileManager.copyItem(at: file, to: destFile)
                }
            }
        }
    }
    
    private static func addIOSLogsToTempDirectory(_ tempDir: URL) throws {
        os_log("addIOSLogsToTempDirectory: %@", log: OSLog.default, type: .debug, tempDir.path)
        
        let fileManager = FileManager.default
        let iosLogsSubDir = tempDir.appendingPathComponent("ios_logs")
        
        try fileManager.createDirectory(at: iosLogsSubDir, withIntermediateDirectories: true, attributes: nil)
        
        // Copy iOS logs if they exist
        if let logDir = GxyLoggerUtils.getLogDir() {
            let logDirURL = URL(fileURLWithPath: logDir)
            
            if fileManager.fileExists(atPath: logDirURL.path) {
                os_log("Copying iOS logs from: %@", log: OSLog.default, type: .debug, logDirURL.path)
                try copyDirectoryContents(from: logDirURL, to: iosLogsSubDir)
                os_log("Copied iOS logs to temporary directory", log: OSLog.default, type: .info)
            } else {
                os_log("iOS log directory does not exist: %@", log: OSLog.default, type: .default, logDirURL.path)
            }
        } else {
            os_log("iOS log directory not initialized", log: OSLog.default, type: .default)
        }
        
        // Add device info to logs
        let deviceInfoFile = iosLogsSubDir.appendingPathComponent("device_info.txt")
        let deviceInfo = getDeviceInfo()
        try deviceInfo.write(to: deviceInfoFile, atomically: true, encoding: .utf8)
        os_log("Added device info to logs", log: OSLog.default, type: .debug)
    }
    
    private static func getDeviceInfo() -> String {
        var info = "iOS Device Information\n"
        info += "======================\n"
        info += "Device Model: \(UIDevice.current.model)\n"
        info += "Device Name: \(UIDevice.current.name)\n"
        info += "System Name: \(UIDevice.current.systemName)\n"
        info += "System Version: \(UIDevice.current.systemVersion)\n"
        
        if let infoDictionary = Bundle.main.infoDictionary {
            if let appVersion = infoDictionary["CFBundleShortVersionString"] as? String {
                info += "App Version: \(appVersion)\n"
            }
            if let buildNumber = infoDictionary["CFBundleVersion"] as? String {
                info += "Build Number: \(buildNumber)\n"
            }
        }
        
        info += "Timestamp: \(Date())\n"
        info += "======================\n"
        
        return info
    }
    
    private static func compressLogDirectory(sourceDir: URL, cacheDir: URL) throws -> URL {
        os_log("compressLogDirectory: sourceDir=%@", log: OSLog.default, type: .debug, sourceDir.path)
        
        let timestamp = Int(Date().timeIntervalSince1970)
        let compressedFileName = "logs_\(timestamp).zip"
        let compressedFile = cacheDir.appendingPathComponent(compressedFileName)
        
        try createZipFile(sourceDir: sourceDir, zipFile: compressedFile)
        
        os_log("Created compressed file: %@", log: OSLog.default, type: .info, compressedFile.path)
        return compressedFile
    }
    
    private static func createZipFile(sourceDir: URL, zipFile: URL) throws {
        // Simple zip implementation using NSFileCoordinator and NSFileManager
        // This is a simplified version - in production you might want to use a proper zip library
        
        let fileManager = FileManager.default
        let zipData = NSMutableData()
        
        // Get all files recursively
        var filesToZip: [(URL, String)] = []
        try collectFilesRecursively(sourceDir: sourceDir, basePath: "", filesToZip: &filesToZip)
        
        // Create a simple tar-like archive (simplified approach)
        for (fileURL, relativePath) in filesToZip {
            let fileData = try Data(contentsOf: fileURL)
            let pathData = relativePath.data(using: .utf8)!
            
            // Write path length
            var pathLength = UInt32(pathData.count).bigEndian
            zipData.append(Data(bytes: &pathLength, count: 4))
            
            // Write path
            zipData.append(pathData)
            
            // Write file size
            var fileSize = UInt32(fileData.count).bigEndian
            zipData.append(Data(bytes: &fileSize, count: 4))
            
            // Write file data
            zipData.append(fileData)
        }
        
        try zipData.write(to: zipFile)
    }
    
    private static func collectFilesRecursively(sourceDir: URL, basePath: String, filesToZip: inout [(URL, String)]) throws {
        let fileManager = FileManager.default
        let files = try fileManager.contentsOfDirectory(at: sourceDir, includingPropertiesForKeys: [.isDirectoryKey], options: [])
        
        for file in files {
            let fileName = basePath.isEmpty ? file.lastPathComponent : "\(basePath)/\(file.lastPathComponent)"
            let resourceValues = try file.resourceValues(forKeys: [.isDirectoryKey])
            
            if resourceValues.isDirectory == true {
                try collectFilesRecursively(sourceDir: file, basePath: fileName, filesToZip: &filesToZip)
            } else {
                filesToZip.append((file, fileName))
            }
        }
    }
    
    private static func sendCompressedLogsToSentry(compressedFile: URL) {
        os_log("sendCompressedLogsToSentry: %@", log: OSLog.default, type: .debug, compressedFile.path)
        
        do {
            let attachment = Attachment(path: compressedFile.path, filename: compressedFile.lastPathComponent)
            
            SentrySDK.configureScope { scope in
                scope.addAttachment(attachment)
            }
            
            SentrySDK.capture(message: "Log files sent to Sentry") { scope in
                scope.setLevel(.info)
                scope.setTag(value: "log_upload", key: "action")
            }
            
            os_log("Successfully sent compressed logs to Sentry", log: OSLog.default, type: .info)
            
        } catch {
            os_log("Failed to send compressed logs to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }
} 
