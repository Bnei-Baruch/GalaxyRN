package com.galaxyrn;

import android.app.Activity;
import android.util.Log;
import android.view.WindowManager;
import com.galaxyrn.logger.GxyLogger;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = WakeLockModule.NAME)
public class WakeLockModule extends ReactContextBaseJavaModule {
    public static final String NAME = "WakeLockModule";
    private static final String TAG = "WakeLockModule";
    private final ReactApplicationContext reactContext;

    public WakeLockModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void keepScreenOn() {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    try {
                        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        GxyLogger.d(TAG, "Screen will stay on (FLAG_KEEP_SCREEN_ON added)");
                    } catch (Exception e) {
                        GxyLogger.e(TAG, "Error keeping screen on: " + e.getMessage());
                    }
                });
            } else {
                GxyLogger.w(TAG, "Could not get current activity to keep screen on");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in keepScreenOn: " + e.getMessage());
        }
    }

    @ReactMethod
    public void releaseScreenOn() {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    try {
                        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        GxyLogger.d(TAG, "Screen can turn off normally (FLAG_KEEP_SCREEN_ON cleared)");
                    } catch (Exception e) {
                        GxyLogger.e(TAG, "Error releasing screen lock: " + e.getMessage());
                    }
                });
            } else {
                GxyLogger.w(TAG, "Could not get current activity to release screen lock");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in releaseScreenOn: " + e.getMessage());
        }
    }
}