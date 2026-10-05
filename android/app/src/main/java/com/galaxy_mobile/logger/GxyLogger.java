package com.galaxy_mobile.logger;

import android.util.Log;
import io.sentry.SentryLevel;

public class GxyLogger {

    // Log levels
    public static final int VERBOSE = 0;
    public static final int DEBUG = 1;
    public static final int INFO = 2;
    public static final int WARN = 3;
    public static final int ERROR = 4;

    // Default configuration
    private static final String DEFAULT_TAG = "GalaxyLogger";

    // VERBOSE level logging
    public static void v(String message) {
        v(DEFAULT_TAG, message);
    }

    public static void v(String tag, String message) {
        Log.v(tag, GxyLoggerUtils.formatMessage(message));
        toFile("V", tag, message, null);
    }

    public static void v(String tag, String message, Throwable throwable) {
        Log.v(tag, GxyLoggerUtils.formatMessage(message), throwable);
        toFile("V", tag, message, throwable);
    }

    // DEBUG level logging
    public static void d(String message) {
        d(DEFAULT_TAG, message);
    }

    public static void d(String tag, String message) {
        Log.d(tag, GxyLoggerUtils.formatMessage(message));
        toFile("D", tag, message, null);
    }

    public static void d(String tag, String message, Throwable throwable) {
        Log.d(tag, GxyLoggerUtils.formatMessage(message), throwable);
        toFile("D", tag, message, throwable);
    }

    // INFO level logging
    public static void i(String message) {
        i(DEFAULT_TAG, message);
    }

    public static void i(String tag, String message) {
        Log.i(tag, GxyLoggerUtils.formatMessage(message));
        toFile("I", tag, message, null);
    }

    public static void i(String tag, String message, Throwable throwable) {
        Log.i(tag, GxyLoggerUtils.formatMessage(message), throwable);
        toFile("I", tag, message, throwable);
    }

    // WARN level logging
    public static void w(String message) {
        w(DEFAULT_TAG, message);
    }

    public static void w(String tag, String message) {
        Log.w(tag, GxyLoggerUtils.formatMessage(message));
        toFile("W", tag, message, null);
        SentryUtils.reportToSentry(SentryLevel.WARNING, tag, message, null);
    }

    public static void w(String tag, String message, Throwable throwable) {
        Log.w(tag, GxyLoggerUtils.formatMessage(message), throwable);
        toFile("W", tag, message, throwable);
        SentryUtils.reportToSentry(SentryLevel.WARNING, tag, message, throwable);
    }

    // ERROR level logging
    public static void e(String message) {
        e(DEFAULT_TAG, message);
    }

    public static void e(String tag, String message) {
        Log.e(tag, GxyLoggerUtils.formatMessage(message));
        toFile("E", tag, message, null);
        SentryUtils.reportToSentry(SentryLevel.ERROR, tag, message, null);
    }

    public static void e(String tag, String message, Throwable throwable) {
        Log.e(tag, GxyLoggerUtils.formatMessage(message), throwable);
        toFile("E", tag, message, throwable);
        SentryUtils.reportToSentry(SentryLevel.ERROR, tag, message, throwable);
    }

    // Debug/verbose lines go to the log file only while verbose logging is on
    private static void toFile(String level, String tag, String message, Throwable throwable) {
        if ((level.equals("V") || level.equals("D")) && !LogFileWriter.isVerbose()) return;
        LogFileWriter.appendLine(level, tag, message, throwable);
    }
}
