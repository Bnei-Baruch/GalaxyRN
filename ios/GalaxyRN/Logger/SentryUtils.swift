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
                SentrySDK.configureScope { scope in
                    scope.setTag(value: tag, key: "logger_tag")
                    scope.setLevel(level)
                    scope.setExtra(value: sentryMessage, key: "formatted_message")
                }
                SentrySDK.capture(error: error)
                os_log("Successfully reported exception to Sentry", log: OSLog.default, type: .info)
            } else {
                os_log("Reporting message-only to Sentry", log: OSLog.default, type: .debug)
                // Report message only
                SentrySDK.configureScope { scope in
                    scope.setTag(value: tag, key: "logger_tag")
                    scope.setLevel(level)
                }
                SentrySDK.capture(message: sentryMessage)
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
}
