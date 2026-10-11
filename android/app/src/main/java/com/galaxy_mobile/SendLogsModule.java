package com.galaxy_mobile;

import com.facebook.fbreact.specs.NativeSendLogsModuleSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.logger.GxyLogger;
import com.galaxy_mobile.logger.LogFileWriter;

/**
 * Bridge to the persistent log file (LogFileWriter). JS batches its log lines
 * into appendLogs; "Send logs" reads everything back via readLogs and uploads
 * it to Sentry from JS.
 */
@ReactModule(name = SendLogsModule.NAME)
public class SendLogsModule extends NativeSendLogsModuleSpec {
    private static final String TAG = "SendLogsModule";

    public SendLogsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        LogFileWriter.init(reactContext.getApplicationContext());
        GxyLogger.d(TAG, "constructor called");
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void appendLogs(String text) {
        LogFileWriter.append(text);
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void setVerboseUntil(double until) {
        LogFileWriter.setVerboseUntil((long) until);
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void readLogs(Promise promise) {
        LogFileWriter.readAll((logs, error) -> {
            if (error != null) {
                GxyLogger.e(TAG, "Error reading log files", error);
                promise.reject("LOG_READ_ERROR", "Failed to read logs: " + error.getMessage(), error);
            } else {
                promise.resolve(logs);
            }
        });
    }
}
