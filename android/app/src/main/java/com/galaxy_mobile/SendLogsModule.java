package com.galaxy_mobile;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.logger.GxyLogger;
import com.galaxy_mobile.logger.SentryUtils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Module for collecting and sending application logs
 */
@ReactModule(name = SendLogsModule.NAME)
public class SendLogsModule extends ReactContextBaseJavaModule {
    public static final String NAME = "SendLogsModule";
    private static final String TAG = "SendLogsModule";
    private final ReactApplicationContext reactContext;
    private static final int MAX_LINES = 10;

    // Package name for filtering logs
    private static final String PACKAGE_NAME = "com.galaxy_mobile";

    public SendLogsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        GxyLogger.d(TAG, "SendLogsModule created");
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Collects application logs from logcat
     * 
     * @param promise Promise to resolve with log string or reject with error
     */
    @ReactMethod
    public void sendLogs(String email, Promise promise) {
        GxyLogger.d(TAG, "Getting application logs for email: " + email);

        try {
            String logs = collectLogs();
            if (logs != null && !logs.isEmpty()) {
                // Send logs to Sentry with attachment
                sendLogsToSentry(email, logs);
                promise.resolve("Logs sent successfully");
            } else {
                GxyLogger.w(TAG, "No logs collected");
                promise.resolve("No logs available. Logs may not be accessible in production builds.");
            }
        } catch (SecurityException e) {
            GxyLogger.w(TAG, "Security exception - logcat access denied: " + e.getMessage());
            promise.reject("LOG_ACCESS_DENIED", "Permission required to read system logs.", e);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error collecting logs: " + e.getMessage(), e);
            promise.reject("LOG_COLLECTION_ERROR", "Failed to collect logs: " + e.getMessage(), e);
        }
    }

    /**
     * Collects logs from logcat
     * Note: In production builds, logcat access may be restricted
     */
    private String collectLogs() {
        Process process = null;
        BufferedReader reader = null;
        StringBuilder logs = new StringBuilder();

        try {
            List<String> command = new ArrayList<>();
            command.add("logcat");
            command.add("-d"); // dump and exit
            command.add("-v"); // format
            command.add("time"); // time format
            command.add("-t"); // tail
            command.add(String.valueOf(MAX_LINES));

            process = Runtime.getRuntime().exec(command.toArray(new String[0]));
            reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            String line;
            int lineCount = 0;
            while ((line = reader.readLine()) != null && lineCount < MAX_LINES) {
                if (line.contains(PACKAGE_NAME) ||
                        line.contains("ReactNativeJS") ||
                        line.contains("ReactNative") ||
                        line.contains("GxyLogger")) {
                    logs.append(line).append("\n");
                    lineCount++;
                }
            }

            String logsContent = logs.toString();
            GxyLogger.d(TAG, "Logs collected: " + logsContent);
            // Add header with device info
            String header = buildLogHeader();
            GxyLogger.d(TAG, "Header: " + header);
            return header + logsContent;

        } catch (SecurityException e) {
            GxyLogger.w(TAG, "Security exception - logcat access denied: " + e.getMessage());
            // Re-throw SecurityException to be handled in getApplicationLogs with special
            // error code
            throw e;
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error reading logcat: " + e.getMessage(), e);
            return "Error collecting logs: " + e.getMessage();
        } finally {
            try {
                if (reader != null) {
                    reader.close();
                }
                if (process != null) {
                    process.destroy();
                }
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error closing logcat stream: " + e.getMessage());
            }
        }
    }

    private void sendLogsToSentry(String email, String logs) {
        GxyLogger.d(TAG, "Sending logs to Sentry, email: " + email);
        SentryUtils.sendLogFile(email, logs);
    }

    /**
     * Builds a header with device and app information
     */
    private String buildLogHeader() {
        StringBuilder header = new StringBuilder();
        header.append("=== Application Logs ===\n");
        header.append("Package: ").append(PACKAGE_NAME).append("\n");
        header.append("Android Version: ").append(android.os.Build.VERSION.RELEASE).append("\n");
        header.append("Device: ").append(android.os.Build.MANUFACTURER)
                .append(" ").append(android.os.Build.MODEL).append("\n");
        header.append("SDK: ").append(android.os.Build.VERSION.SDK_INT).append("\n");
        try {
            String packageName = reactContext.getPackageName();
            android.content.pm.PackageInfo packageInfo = reactContext.getPackageManager()
                    .getPackageInfo(packageName, 0);
            header.append("App Version: ").append(packageInfo.versionName)
                    .append(" (").append(packageInfo.versionCode).append(")\n");
        } catch (Exception e) {
            GxyLogger.d(TAG, "Could not get package info: " + e.getMessage());
        }
        header.append("Timestamp: ").append(new java.util.Date().toString()).append("\n");
        header.append("========================\n\n");
        return header.toString();
    }
}
