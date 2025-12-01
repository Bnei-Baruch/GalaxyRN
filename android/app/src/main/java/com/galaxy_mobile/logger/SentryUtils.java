package com.galaxy_mobile.logger;

import android.util.Log;
import io.sentry.Sentry;
import io.sentry.SentryLevel;
import io.sentry.Attachment;
import io.sentry.Hint;
import java.nio.charset.StandardCharsets;

/**
 * Utility class for Sentry integration
 * Centralizes all Sentry-related functionality for the GalaxyRN application
 */
public class SentryUtils {

    private static final String TAG = "SentryUtils";

    public static void reportToSentry(SentryLevel level, String tag, String message, Throwable throwable) {
        Log.d(TAG, "reportToSentry: level=" + level + ", tag=" + tag + ", message=" + message);
        try {
            // Create a formatted message with tag
            String sentryMessage = String.format("[%s] %s", tag, message);
            Log.v(TAG, "Created formatted message for Sentry: " + sentryMessage);

            if (throwable != null) {
                Log.d(TAG, "Reporting exception to Sentry with message");
                // Report exception with message
                Sentry.withScope(scope -> {
                    scope.setTag("logger_tag", tag);
                    scope.setLevel(level);
                    scope.setExtra("formatted_message", sentryMessage);
                    Sentry.captureException(throwable);
                });
                Log.i(TAG, "Successfully reported exception to Sentry");
            } else {
                Log.d(TAG, "Reporting message-only to Sentry");
                // Report message only
                Sentry.withScope(scope -> {
                    scope.setTag("logger_tag", tag);
                    scope.setLevel(level);
                    Sentry.captureMessage(sentryMessage);
                });
                Log.i(TAG, "Successfully reported message to Sentry");
            }
        } catch (Exception e) {
            // Don't let Sentry errors break the logging
            Log.e(TAG, "Failed to report to Sentry", e);
        }
    }

    public static void reportCritical(String tag, String message, Throwable throwable) {
        Log.w(TAG, "reportCritical called: tag=" + tag + ", message=" + message);
        // Always log critical errors locally
        Log.e(tag, "CRITICAL: " + message, throwable);

        // Always report to Sentry, regardless of settings
        try {
            String criticalMessage = String.format("CRITICAL: [%s] %s", tag, message);
            Log.d(TAG, "Formatted critical message: " + criticalMessage);

            Sentry.withScope(scope -> {
                scope.setTag("logger_tag", tag);
                scope.setTag("severity", "critical");
                scope.setLevel(SentryLevel.FATAL);
                scope.setExtra("formatted_message", criticalMessage);
                if (throwable != null) {
                    Sentry.captureException(throwable);
                } else {
                    Sentry.captureMessage(criticalMessage);
                }
            });
            Log.i(TAG, "Successfully reported critical error to Sentry");
        } catch (Exception e) {
            Log.e(TAG, "Failed to report critical error to Sentry", e);
        }
    }

    public static void addBreadcrumb(String category, String message) {
        Log.d(TAG, "addBreadcrumb: category=" + category + ", message=" + message);
        try {
            Sentry.addBreadcrumb(message, category);
            Log.v(TAG, "Successfully added breadcrumb to Sentry");
        } catch (Exception e) {
            Log.e(TAG, "Failed to add breadcrumb to Sentry", e);
        }
    }

    public static void sendLogFile(String email, String logs) {
        try {
            Log.d(TAG, "Sending log file to Sentry for email: " + email);
            if (logs == null || logs.isEmpty()) {
                Log.e(TAG, "No logs to send");
                return;
            }

            byte[] logsBytes = logs.getBytes(StandardCharsets.UTF_8);
            Log.d(TAG, "Logs converted to bytes, size: " + logsBytes.length + " bytes");

            Attachment attachment = new Attachment(logsBytes, "application-logs.txt");
            Log.d(TAG, "Attachment created from bytes, size: " + logsBytes.length + " bytes");
            Hint hint = Hint.withAttachment(attachment);
            Log.d(TAG, "Hint created with attachment");

            Exception logException = new Exception("Log file sent to " + email);

            Sentry.withScope(scope -> {
                scope.setTag("email", email);
                scope.setLevel(SentryLevel.ERROR);
                scope.addAttachment(attachment);
                Log.d(TAG, "Attachment added to scope");

                Sentry.captureException(logException, hint);
                Log.d(TAG, "Exception captured with attachment via Hint");
            });

            Log.i(TAG, "Successfully sent log file to Sentry");
        } catch (Exception e) {
            Log.e(TAG, "Failed to send log file to Sentry", e);
            throw new RuntimeException("Failed to send log file to Sentry", e);
        }
    }
}
