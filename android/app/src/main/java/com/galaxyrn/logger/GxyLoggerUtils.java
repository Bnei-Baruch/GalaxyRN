package com.galaxyrn.logger;

import android.os.Build;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Utility class for GxyLogger containing message formatting and helper
 * functionality
 */
public class GxyLoggerUtils {

    private static final String TAG = "GxyLoggerUtils";

    // Date formatter for timestamps
    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault());
    // ========================================
    // PUBLIC UTILITY METHODS
    // ========================================

    /**
     * Format log message with additional info (always includes timestamp, thread
     * info, and method info)
     */
    public static String formatMessage(String message) {
        StringBuilder formatted = new StringBuilder();

        // Add timestamp (always)
        formatted.append("[").append(dateFormat.format(new Date())).append("] ");

        // Add thread info (always)
        Thread currentThread = Thread.currentThread();
        formatted.append("[Thread:").append(currentThread.getName()).append("] ");

        // Add method info (always)
        StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();
        if (stackTrace.length > 6) {
            StackTraceElement caller = stackTrace[6]; // Skip this class and logger methods
            String className = caller.getClassName();
            String simpleClassName = className.substring(className.lastIndexOf('.') + 1);
            formatted.append("[")
                    .append(simpleClassName)
                    .append(".")
                    .append(caller.getMethodName())
                    .append(":")
                    .append(caller.getLineNumber())
                    .append("] ");
        }

        formatted.append(message);
        return formatted.toString();
    }

    /**
     * Log device information (useful for debugging)
     */
    public static void logDeviceInfo(String defaultTag) {
        GxyLogger.i(defaultTag, "=== DEVICE INFORMATION ===");
        GxyLogger.i(defaultTag, "Manufacturer: " + Build.MANUFACTURER);
        GxyLogger.i(defaultTag, "Model: " + Build.MODEL);
        GxyLogger.i(defaultTag, "Android Version: " + Build.VERSION.RELEASE);
        GxyLogger.i(defaultTag, "API Level: " + Build.VERSION.SDK_INT);
        GxyLogger.i(defaultTag, "========================");
    }
}