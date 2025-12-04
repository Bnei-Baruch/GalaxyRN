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

@ReactModule(name = SendLogsModule.NAME)
public class SendLogsModule extends ReactContextBaseJavaModule {
    public static final String NAME = "SendLogsModule";
    private static final String TAG = "SendLogsModule";
    private static final int MAX_LINES = 1000;

    // Package name for filtering logs
    private static final String PACKAGE_NAME = "com.galaxy_mobile";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    public SendLogsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "constructor called");
    }

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

            return logs.toString();

        } catch (SecurityException e) {
            GxyLogger.w(TAG, "Security exception - logcat access denied: " + e.getMessage());
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

    public void cleanup() {
        GxyLogger.d(TAG, "Cleaning up SendLogsModule");
        try {
            io.sentry.Sentry.flush(1000);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error flushing Sentry", e);
        }
    }
}
