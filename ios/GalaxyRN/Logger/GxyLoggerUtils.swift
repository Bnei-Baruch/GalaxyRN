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
}
