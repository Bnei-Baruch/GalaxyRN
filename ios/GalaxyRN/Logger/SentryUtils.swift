import Foundation
import os.log
import Sentry

/**
 * Utility class for Sentry integration
 * Centralizes all Sentry-related functionality for the GalaxyRN application
 */
class SentryUtils {

    private static let TAG = "SentryUtils"

    /**
     * Report warning and error messages to Sentry
     */
    static func reportToSentry(level: SentryLevel, tag: String, message: String, error: Error?) {
        os_log("reportToSentry: level=%@, tag=%@, message=%@", log: OSLog.default, type: .debug, String(describing: level), tag, message)

        do {
            // Create a formatted message with tag
            let sentryMessage = "[\(tag)] \(message)"
            os_log("Created formatted message for Sentry: %@", log: OSLog.default, type: .debug, sentryMessage)

            if let error = error {
                os_log("Reporting exception to Sentry with message", log: OSLog.default, type: .debug)
                // Report exception with message
                let event = Event(error: error)
                event.tags = ["logger_tag": tag]
                event.level = level
                event.extra = ["formatted_message": sentryMessage]
                SentrySDK.capture(event: event)
                os_log("Successfully reported exception to Sentry", log: OSLog.default, type: .info)
            } else {
                os_log("Reporting message-only to Sentry", log: OSLog.default, type: .debug)
                // Report message only
                let event = Event(level: level)
                event.message = SentryMessage(formatted: sentryMessage)
                event.tags = ["logger_tag": tag]
                SentrySDK.capture(event: event)
                os_log("Successfully reported message to Sentry", log: OSLog.default, type: .info)
            }
        } catch {
            // Don't let Sentry errors break the logging
            os_log("Failed to report to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }

    /**
     * Report critical errors that should always be sent to Sentry
     * regardless of log level settings
     */
    static func reportCritical(tag: String, message: String, error: Error?) {
        os_log("reportCritical called: tag=%@, message=%@", log: OSLog.default, type: .default, tag, message)

        // Always log critical errors locally
        if let error = error {
            os_log("CRITICAL: %@ - Error: %@", log: OSLog.default, type: .error, message, error.localizedDescription)
        } else {
            os_log("CRITICAL: %@", log: OSLog.default, type: .error, message)
        }

        // Always report to Sentry, regardless of settings
        do {
            let criticalMessage = "CRITICAL: [\(tag)] \(message)"
            os_log("Formatted critical message: %@", log: OSLog.default, type: .debug, criticalMessage)

            if let error = error {
                let event = Event(error: error)
                event.tags = ["logger_tag": tag, "severity": "critical"]
                event.level = .fatal
                event.extra = ["formatted_message": criticalMessage]
                SentrySDK.capture(event: event)
            } else {
                let event = Event(level: .fatal)
                event.message = SentryMessage(formatted: criticalMessage)
                event.tags = ["logger_tag": tag, "severity": "critical"]
                event.extra = ["formatted_message": criticalMessage]
                SentrySDK.capture(event: event)
            }

            os_log("Successfully reported critical error to Sentry", log: OSLog.default, type: .info)
        } catch {
            os_log("Failed to report critical error to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }

    /**
     * Add breadcrumb to Sentry for tracking user actions
     */
    static func addBreadcrumb(category: String, message: String) {
        os_log("addBreadcrumb: category=%@, message=%@", log: OSLog.default, type: .debug, category, message)

        do {
            let breadcrumb = Breadcrumb()
            breadcrumb.category = category
            breadcrumb.message = message
            breadcrumb.level = .info
            SentrySDK.addBreadcrumb(breadcrumb)
            os_log("Successfully added breadcrumb to Sentry", log: OSLog.default, type: .debug)
        } catch {
            os_log("Failed to add breadcrumb to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }
    
    //TODO: This is not working, in current SentrySDK no method to send log file with attachment.
    /**
     * Send log file to Sentry with attachment
     */
    static func sendLogFile(email: String, logs: String) {
        os_log("Sending log file to Sentry for email: %@", log: OSLog.default, type: .debug, email)
        
        guard !logs.isEmpty else {
            os_log("No logs to send", log: OSLog.default, type: .error)
            return
        }
        
        do {
            // Convert logs string to data
            guard let logsData = logs.data(using: .utf8) else {
                os_log("Failed to convert logs to data", log: OSLog.default, type: .error)
                return
            }
            
            os_log("Logs converted to data, size: %d bytes", log: OSLog.default, type: .debug, logsData.count)
            
            // Check file size limit (20 MB compressed, 100 MB uncompressed)
            let maxSize = 100 * 1024 * 1024 // 100 MB
            let finalData: Data
            if logsData.count > maxSize {
                os_log("Log file size exceeds 100 MB limit, truncating to last 100 MB", log: OSLog.default, type: .default)
                let startIndex = logsData.count - maxSize
                finalData = logsData.subdata(in: startIndex..<logsData.count)
            } else {
                finalData = logsData
            }
            
            // Create attachment from data
            let attachment = Attachment(data: finalData, filename: "application-logs.txt", contentType: "text/plain")
            os_log("Attachment created from data, size: %d bytes", log: OSLog.default, type: .debug, finalData.count)
            
            // Create exception to capture with attachment
            let logException = NSError(domain: "SendLogsModule", code: 0, userInfo: [NSLocalizedDescriptionKey: "Log file sent to \(email)"])
   
          // Capture error with scope block
         /*  SentrySDK.capture(error: logException, block: { scope in
              scope.setTag(value: email, key: "email")
              scope.addAttachment(attachment)
              os_log("Attachment added to scope", log: OSLog.default, type: .debug)
          }) */
          
        } catch {
            os_log("Failed to send log file to Sentry: %@", log: OSLog.default, type: .error, error.localizedDescription)
        }
    }
}
