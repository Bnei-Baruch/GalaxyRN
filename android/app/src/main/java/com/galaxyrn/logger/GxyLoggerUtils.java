package com.galaxyrn.logger;

import android.os.Build;
import android.util.Log;
import android.content.Context;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.ArrayList;
import java.util.List;
import io.sentry.SentryLevel;
import com.facebook.react.bridge.ReactApplicationContext;

/**
 * Utility class for GxyLogger containing Sentry integration,
 * message formatting, and other helper functionality
 */
public class GxyLoggerUtils {

    private static final String TAG = "GxyLoggerUtils";

    // Date formatter for timestamps
    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault());
    private static final SimpleDateFormat fileDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS",
            Locale.getDefault());

    // File logging options
    private static String logDir;
    private static String logFileName = "gxy_logger.log";
    private static String externalLogDir;
    private static long maxLogFileSize = 5 * 1024 * 1024; // 5MB default
    private static int maxLogFiles = 3; // Keep 3 log files

    // Buffer for batched logging
    private static final List<String> logBuffer = new ArrayList<>();
    private static final int BUFFER_SIZE = 50; // Write every 50 logs
    private static boolean isWriting = false;

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

    /**
     * Get current log level as string
     */
    public static String getCurrentLogLevel(int minLogLevel) {
        switch (minLogLevel) {
            case GxyLogger.VERBOSE:
                return "VERBOSE";
            case GxyLogger.DEBUG:
                return "DEBUG";
            case GxyLogger.INFO:
                return "INFO";
            case GxyLogger.WARN:
                return "WARN";
            case GxyLogger.ERROR:
                return "ERROR";
            default:
                return "UNKNOWN";
        }
    }

    // ========================================
    // SENTRY METHODS
    // ========================================

    /**
     * Report warning and error messages to Sentry
     */
    public static void reportToSentry(SentryLevel level, String tag, String message, Throwable throwable) {
        SentryUtils.reportToSentry(level, tag, message, throwable);
    }

    /**
     * Report critical errors that should always be sent to Sentry
     * regardless of log level settings
     */
    public static void reportCritical(String tag, String message, Throwable throwable) {
        SentryUtils.reportCritical(tag, message, throwable);
    }

    /**
     * Add breadcrumb to Sentry for tracking user actions
     */
    public static void addBreadcrumb(String category, String message) {
        GxyLogger.d("Breadcrumb", String.format("[%s] %s", category, message));
        SentryUtils.addBreadcrumb(category, message);
    }

    // ========================================
    // FILE LOGGING INITIALIZATION
    // ========================================

    /**
     * Initialize file logging with log directory path
     */
    public static void initializeFileLogging(ReactApplicationContext context) {
        logDir = context.getFilesDir().getAbsolutePath() + "/logs";
        GxyLogger.i(TAG, "Log directory: " + logDir);

        try {
            File logsDirectory = new File(logDir);
            if (!logsDirectory.exists()) {
                logsDirectory.mkdirs();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to create log directory: " + logDir, e);
        }

        externalLogDir = context.getExternalFilesDir(null).getAbsolutePath() + "/logs";
        GxyLogger.i(TAG, "External log directory: " + externalLogDir);
        try {
            File externalLogsDirectory = new File(externalLogDir);
            if (!externalLogsDirectory.exists()) {
                externalLogsDirectory.mkdirs();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to create external log directory: " + externalLogDir, e);
        }
    }

    /**
     * Configure file logging settings
     */
    public static void configureFileLogging(String fileName, long maxFileSize, int maxFiles) {
        logFileName = fileName;
        maxLogFileSize = maxFileSize;
        maxLogFiles = maxFiles;
    }

    // ========================================
    // FILE LOGGING CORE FUNCTIONALITY
    // ========================================

    /**
     * Save log message to buffer
     */
    public static void saveToFile(String level, String tag, String message, Throwable throwable) {
        if (logDir == null || logDir.isEmpty()) {
            return;
        }

        // Format the log entry and add to buffer
        String logEntry = formatFileLogEntry(level, tag, message, throwable);

        synchronized (logBuffer) {
            logBuffer.add(logEntry);

            // Flush if buffer is full
            if (logBuffer.size() >= BUFFER_SIZE) {
                flushBuffer();
            }
        }
    }

    /**
     * Flush buffered logs to file
     */
    public static void flushBuffer() {
        if (logDir == null || logDir.isEmpty() || isWriting) {
            return;
        }

        synchronized (logBuffer) {
            if (logBuffer.isEmpty()) {
                return;
            }

            isWriting = true;
            List<String> logsToWrite = new ArrayList<>(logBuffer);
            logBuffer.clear();

            // Write in background thread to avoid blocking
            new Thread(() -> {
                try {
                    File logFile = getLogFile();
                    if (logFile == null) {
                        return;
                    }

                    // Check if log rotation is needed
                    if (logFile.exists() && logFile.length() > maxLogFileSize) {
                        rotateLogFiles();
                        logFile = getLogFile();
                    }

                    // Append all buffered logs to file
                    try (FileWriter writer = new FileWriter(logFile, true)) {
                        for (String logEntry : logsToWrite) {
                            writer.write(logEntry);
                        }
                        writer.flush();
                    }

                } catch (Exception e) {
                    Log.e(TAG, "Failed to write batch to log file", e);
                    // Re-add logs to buffer if write failed
                    synchronized (logBuffer) {
                        logBuffer.addAll(0, logsToWrite);
                    }
                } finally {
                    isWriting = false;
                }
            }).start();
        }
    }

    /**
     * Force flush remaining logs (for app shutdown)
     */
    public static void forceFlush() {
        if (logDir == null || logDir.isEmpty()) {
            return;
        }

        synchronized (logBuffer) {
            if (logBuffer.isEmpty()) {
                return;
            }

            List<String> logsToWrite = new ArrayList<>(logBuffer);
            logBuffer.clear();

            try {
                File logFile = getLogFile();
                if (logFile == null) {
                    return;
                }

                // Check if log rotation is needed
                if (logFile.exists() && logFile.length() > maxLogFileSize) {
                    rotateLogFiles();
                    logFile = getLogFile();
                }

                // Append all buffered logs to file synchronously
                try (FileWriter writer = new FileWriter(logFile, true)) {
                    for (String logEntry : logsToWrite) {
                        writer.write(logEntry);
                    }
                    writer.flush();
                }

            } catch (Exception e) {
                Log.e(TAG, "Failed to force flush logs", e);
            }
        }
    }

    // ========================================
    // FILE MANAGEMENT
    // ========================================

    /**
     * Clear all log files
     */
    public static void clearLogFiles() {
        if (logDir == null || logDir.isEmpty()) {
            return;
        }

        try {
            File logsDirectory = new File(logDir);
            if (logsDirectory.exists()) {
                File[] logFiles = logsDirectory.listFiles((dir, name) -> name.startsWith(logFileName));
                if (logFiles != null) {
                    for (File file : logFiles) {
                        file.delete();
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to clear log files", e);
        }
    }

    // ========================================
    // GETTERS AND INFO METHODS
    // ========================================

    /**
     * Check if file logging is available (always enabled if log directory is set)
     */
    public static boolean isFileLoggingEnabled() {
        return logDir != null && !logDir.isEmpty();
    }

    /**
     * Get the current log directory path
     */
    public static String getLogDir() {
        return logDir;
    }

    /**
     * Get the current external log directory path
     */
    public static String getExternalLogDir() {
        return externalLogDir;
    }

    /**
     * Get log file path for sharing or debugging
     */
    public static String getLogFilePath() {
        File logFile = getLogFile();
        return logFile != null ? logFile.getAbsolutePath() : null;
    }

    /**
     * Get log files info for debugging
     */
    public static String getLogFilesInfo() {
        if (logDir == null || logDir.isEmpty()) {
            return "File logging not initialized";
        }

        try {
            File logsDirectory = new File(logDir);
            if (!logsDirectory.exists()) {
                return "No log files found";
            }

            StringBuilder info = new StringBuilder();
            info.append("Log files directory: ").append(logsDirectory.getAbsolutePath()).append("\n");

            File[] logFiles = logsDirectory.listFiles((dir, name) -> name.startsWith(logFileName));
            if (logFiles != null && logFiles.length > 0) {
                info.append("Log files:\n");
                for (File file : logFiles) {
                    info.append("- ").append(file.getName())
                            .append(" (").append(file.length()).append(" bytes)\n");
                }
            } else {
                info.append("No log files found\n");
            }

            return info.toString();
        } catch (Exception e) {
            return "Error getting log files info: " + e.getMessage();
        }
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    /**
     * Get the current log file
     */
    private static File getLogFile() {
        if (logDir == null || logDir.isEmpty()) {
            return null;
        }

        try {
            File logsDirectory = new File(logDir);
            if (!logsDirectory.exists() && !logsDirectory.mkdirs()) {
                Log.e(TAG, "Failed to create logs directory: " + logDir);
                return null;
            }

            return new File(logsDirectory, logFileName);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get log file", e);
            return null;
        }
    }

    /**
     * Rotate log files when max size is reached
     */
    private static void rotateLogFiles() {
        try {
            File logsDirectory = new File(logDir);
            if (!logsDirectory.exists()) {
                return;
            }

            // Rename existing files
            for (int i = maxLogFiles - 1; i > 0; i--) {
                File oldFile = new File(logsDirectory, logFileName + "." + i);
                File newFile = new File(logsDirectory, logFileName + "." + (i + 1));

                if (oldFile.exists()) {
                    if (i == maxLogFiles - 1) {
                        // Delete the oldest file
                        oldFile.delete();
                    } else {
                        // Rename to next number
                        oldFile.renameTo(newFile);
                    }
                }
            }

            // Rename current log file
            File currentLogFile = new File(logsDirectory, logFileName);
            File rotatedFile = new File(logsDirectory, logFileName + ".1");
            if (currentLogFile.exists()) {
                currentLogFile.renameTo(rotatedFile);
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed to rotate log files", e);
        }
    }

    /**
     * Format log entry for file storage
     */
    private static String formatFileLogEntry(String level, String tag, String message, Throwable throwable) {
        StringBuilder entry = new StringBuilder();

        // Add timestamp
        entry.append(fileDateFormat.format(new Date()));
        entry.append(" ");

        // Add level and tag
        entry.append(level).append("/").append(tag).append(": ");

        // Add message
        entry.append(message);

        // Add exception if present
        if (throwable != null) {
            entry.append("\n").append(Log.getStackTraceString(throwable));
        }

        entry.append("\n");
        return entry.toString();
    }
}