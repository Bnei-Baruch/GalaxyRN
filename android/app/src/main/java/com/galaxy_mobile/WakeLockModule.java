package com.galaxy_mobile;

import android.app.Activity;
import android.util.Log;
import android.view.WindowManager;
import com.galaxy_mobile.logger.GxyLogger;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.LifecycleEventListener;

@ReactModule(name = WakeLockModule.NAME)
public class WakeLockModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    public static final String NAME = "WakeLockModule";
    private static final String TAG = "WakeLockModule";
    private final ReactApplicationContext reactContext;
    private boolean isScreenLockActive = false;

    public WakeLockModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.reactContext.addLifecycleEventListener(this);
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
                        isScreenLockActive = true;
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
                        isScreenLockActive = false;
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

    @Override
    public void onHostResume() {
        // If screen lock was active before pause, reapply it
        if (isScreenLockActive) {
            keepScreenOn();
        }
    }

    @Override
    public void onHostPause() {
        // No need to do anything on pause
    }

    @Override
    public void onHostDestroy() {
        // Ensure screen lock is released
        if (isScreenLockActive) {
            releaseScreenOn();
        }
        reactContext.removeLifecycleEventListener(this);
    }

    @Override
    public void invalidate() {
        // Ensure cleanup when module is invalidated
        if (isScreenLockActive) {
            releaseScreenOn();
        }
        reactContext.removeLifecycleEventListener(this);
        super.invalidate();
    }
}