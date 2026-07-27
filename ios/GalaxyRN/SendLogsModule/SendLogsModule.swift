import Foundation
import React
import UIKit
import os.log
import OSLog

@objc(SendLogsModule)
class SendLogsModule: NSObject {
    private static let TAG = "SendLogsModule"
    private static let MAX_LINES = 1000
    private static let PACKAGE_NAME = "com.galaxy_mobile"
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func sendLogs(_ email: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        os_log("Getting application logs for email: %@", log: OSLog.default, type: .debug, email)
        
        do {
            let logs = try collectLogs()
            if !logs.isEmpty {
                // Send logs to Sentry with attachment
                sendLogsToSentry(email: email, logs: logs)
                resolve("Logs sent successfully")
            } else {
                resolve("No logs available. Logs may not be accessible in production builds.")
            }
        } catch {
            if let securityError = error as? SecurityError {
                os_log("Security exception - log access denied: %@", log: OSLog.default, type: .default, securityError.localizedDescription)
                reject("LOG_ACCESS_DENIED", "Permission required to read system logs.", securityError)
            } else {
                os_log("Error collecting logs: %@", log: OSLog.default, type: .error, error.localizedDescription)
                reject("LOG_COLLECTION_ERROR", "Failed to collect logs: \(error.localizedDescription)", error)
            }
        }
    }
    
    /**
     * Collects logs from OSLogStore
     * Note: In production builds, log access may be restricted
     */
    private func collectLogs() throws -> String {
        var logs = ""
        
        // Try to get logs from OSLogStore
        if #available(iOS 15.0, *) {
            do {
                let logStore = try OSLogStore(scope: .currentProcessIdentifier)
                let position = logStore.position(timeIntervalSinceEnd: -3600) // Last hour
                
                let entries = try logStore.getEntries(at: position)
                
                var lineCount = 0
                for entry in entries {
                    if lineCount >= SendLogsModule.MAX_LINES {
                        break
                    }
                    
                    // Filter by package name or common app tags
                    let subsystem = entry.subsystem
                    let category = entry.category
                    let message = entry.composedMessage
                    let entryString = "\(entry.date) [\(subsystem)] [\(category)] \(message)"
                    
                    if subsystem.contains(SendLogsModule.PACKAGE_NAME) ||
                       subsystem.contains("Galaxy") ||
                       message.contains("ReactNativeJS") ||
                       message.contains("ReactNative") ||
                       message.contains("GxyLogger") ||
                       category.contains("Galaxy") {
                        logs += entryString + "\n"
                        lineCount += 1
                    }
                }
                
                if lineCount == 0 {
                    // If no filtered logs, try to get all recent logs
                    var allLogs = ""
                    var count = 0
                    for entry in entries {
                        if count >= 500 { // Limit to 500 lines
                            break
                        }
                        allLogs += "\(entry.date) [\(entry.subsystem)] [\(entry.category)] \(entry.composedMessage)\n"
                        count += 1
                    }
                    logs = allLogs
                }
            } catch {
                os_log("Error reading OSLogStore: %@", log: OSLog.default, type: .error, error.localizedDescription)
                // Return error message instead of throwing
                return "Error collecting logs: \(error.localizedDescription)\nNote: Log access may be restricted in production builds."
            }
        } else {
            // iOS < 15: OSLogStore not available, return message
            return "Log collection requires iOS 15.0 or later. Current iOS version does not support OSLogStore API."
        }
        
        // Add header with device info
        let header = buildLogHeader()
        return header + logs
    }
    
    /**
     * Builds a header with device and app information
     */
    private func buildLogHeader() -> String {
        var header = "=== Application Logs ===\n"
        header += "Package: \(SendLogsModule.PACKAGE_NAME)\n"
        header += "iOS Version: \(UIDevice.current.systemVersion)\n"
        header += "Device: \(UIDevice.current.model) \(UIDevice.current.name)\n"
        
        if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
           let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String {
            header += "App Version: \(version) (\(buildNumber))\n"
        }
        
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .medium
        header += "Timestamp: \(formatter.string(from: Date()))\n"
        header += "========================\n\n"
        
        return header
    }
    
    private func sendLogsToSentry(email: String, logs: String) {
        os_log("Sending logs to Sentry, email: %@", log: OSLog.default, type: .debug, email)
        SentryUtils.sendLogFile(email: email, logs: logs)
    }
}

// Custom error for security exceptions
enum SecurityError: Error {
    case logAccessDenied(String)
    
    var localizedDescription: String {
        switch self {
        case .logAccessDenied(let message):
            return message
        }
    }
}

