package com.galaxyrn.logger;

import android.util.Log;
import io.sentry.SentryLevel;
import com.galaxyrn.BuildConfig;

/**
 * Custom Logger for GalaxyRN Android Application
 * Provides structured logging with different levels and automatic filtering for
 * release builds
 */
public class GxyLogger {

    // Log levels
    public static final int VERBOSE = 0;
    public static final int DEBUG = 1;
    public static final int INFO = 2;
    public static final int WARN = 3;
    public static final int ERROR = 4;

    // Default configuration
    private static final String DEFAULT_TAG = "GalaxyRN";
    private static boolean isDebugMode = BuildConfig.DEBUG;
    private static int minLogLevel = isDebugMode ? VERBOSE : ERROR;

    /**
     * Configure logger settings
     */
    public static void configure(boolean debugMode, int minimumLogLevel) {
        isDebugMode = debugMode;
        minLogLevel = minimumLogLevel;
    }

    // VERBOSE level logging
    public static void v(String message) {
        v(DEFAULT_TAG, message);
    }

    public static void v(String tag, String message) {
        if (shouldLog(VERBOSE)) {
            Log.v(tag, GxyLoggerUtils.formatMessage(message));
            GxyLoggerUtils.saveToFile("V", tag, message, null);
        }
    }

    public static void v(String tag, String message, Throwable throwable) {
        if (shouldLog(VERBOSE)) {
            Log.v(tag, GxyLoggerUtils.formatMessage(message), throwable);
            GxyLoggerUtils.saveToFile("V", tag, message, throwable);
        }
    }

    // DEBUG level logging
    public static void d(String message) {
        d(DEFAULT_TAG, message);
    }

    public static void d(String tag, String message) {
        if (shouldLog(DEBUG)) {
            Log.d(tag, GxyLoggerUtils.formatMessage(message));
            GxyLoggerUtils.saveToFile("D", tag, message, null);
        }
    }

    public static void d(String tag, String message, Throwable throwable) {
        if (shouldLog(DEBUG)) {
            Log.d(tag, GxyLoggerUtils.formatMessage(message), throwable);
            GxyLoggerUtils.saveToFile("D", tag, message, throwable);
        }
    }

    // INFO level logging
    public static void i(String message) {
        i(DEFAULT_TAG, message);
    }

    public static void i(String tag, String message) {
        if (shouldLog(INFO)) {
            Log.i(tag, GxyLoggerUtils.formatMessage(message));
            GxyLoggerUtils.saveToFile("I", tag, message, null);
        }
    }

    public static void i(String tag, String message, Throwable throwable) {
        if (shouldLog(INFO)) {
            Log.i(tag, GxyLoggerUtils.formatMessage(message), throwable);
            GxyLoggerUtils.saveToFile("I", tag, message, throwable);
        }
    }

    // WARN level logging
    public static void w(String message) {
        w(DEFAULT_TAG, message);
    }

    public static void w(String tag, String message) {
        if (shouldLog(WARN)) {
            Log.w(tag, GxyLoggerUtils.formatMessage(message));
            GxyLoggerUtils.saveToFile("W", tag, message, null);
            GxyLoggerUtils.reportToSentry(SentryLevel.WARNING, tag, message, null);
        }
    }

    public static void w(String tag, String message, Throwable throwable) {
        if (shouldLog(WARN)) {
            Log.w(tag, GxyLoggerUtils.formatMessage(message), throwable);
            GxyLoggerUtils.saveToFile("W", tag, message, throwable);
            GxyLoggerUtils.reportToSentry(SentryLevel.WARNING, tag, message, throwable);
        }
    }

    // ERROR level logging
    public static void e(String message) {
        e(DEFAULT_TAG, message);
    }

    public static void e(String tag, String message) {
        if (shouldLog(ERROR)) {
            Log.e(tag, GxyLoggerUtils.formatMessage(message));
            GxyLoggerUtils.saveToFile("E", tag, message, null);
            GxyLoggerUtils.reportToSentry(SentryLevel.ERROR, tag, message, null);
        }
    }

    public static void e(String tag, String message, Throwable throwable) {
        if (shouldLog(ERROR)) {
            Log.e(tag, GxyLoggerUtils.formatMessage(message), throwable);
            GxyLoggerUtils.saveToFile("E", tag, message, throwable);
            GxyLoggerUtils.reportToSentry(SentryLevel.ERROR, tag, message, throwable);
        }
    }

    // Core utility methods

    /**
     * Check if logging should occur for given level
     */
    private static boolean shouldLog(int level) {
        return isDebugMode || level >= minLogLevel;
    }
}