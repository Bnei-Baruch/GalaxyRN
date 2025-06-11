package com.galaxyrn.logger;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

import java.io.File;

/**
 * React Native Logger Module for GalaxyRN Android Application
 * Provides access to GxyLogger functionality and log compression/sending
 * capabilities
 */
@ReactModule(name = LoggerModule.NAME)
public class LoggerModule extends ReactContextBaseJavaModule {

    public static final String NAME = "LoggerModule";
    private static final String TAG = "LoggerModule";
    private final ReactApplicationContext reactContext;

    public LoggerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        GxyLoggerUtils.initializeFileLogging(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Compress a directory and send it to Sentry as an attachment
     * 
     * @param rnLogDir The directory path containing logs to compress and send
     * @param promise  React Native promise to resolve/reject
     */
    @ReactMethod
    public void sendLog(String rnLogDir, Promise promise) {
        try {
            GxyLogger.i(TAG, "Starting log compression and send process for directory: " + rnLogDir);

            // Compress and send to Sentry
            File compressedFile = SentryUtils.compressAndSendLogsToSentry(rnLogDir, reactContext.getCacheDir());
            if (compressedFile == null) {
                String error = "Failed to compress and send log directory";
                GxyLogger.e(TAG, error);
                promise.reject("COMPRESSION_FAILED", error);
                return;
            }

            promise.resolve("Logs compressed and sent to Sentry successfully");
            GxyLogger.i(TAG, "Log compression and send process completed successfully");

        } catch (Exception e) {
            String error = "Error in sendLog: " + e.getMessage();
            GxyLogger.e(TAG, error, e);
            promise.reject("SEND_LOG_ERROR", error, e);
        }
    }

}