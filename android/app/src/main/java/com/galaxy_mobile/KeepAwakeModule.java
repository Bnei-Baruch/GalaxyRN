package com.galaxy_mobile;

import android.app.Activity;
import android.view.WindowManager;
import com.galaxy_mobile.logger.GxyLogger;

import com.facebook.fbreact.specs.NativeKeepAwakeModuleSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.LifecycleEventListener;

@ReactModule(name = KeepAwakeModule.NAME)
public class KeepAwakeModule extends NativeKeepAwakeModuleSpec implements LifecycleEventListener {
    private static final String TAG = "KeepAwakeModule";
    private final ReactApplicationContext reactContext;
    private boolean isScreenLockActive = false;

    public KeepAwakeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.reactContext.addLifecycleEventListener(this);
    }

    @Override
    @ReactMethod
    @DoNotStrip
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

    @Override
    @ReactMethod
    @DoNotStrip
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
        if (isScreenLockActive) {
            keepScreenOn();
        }
    }

    @Override
    public void onHostPause() {
        GxyLogger.d(TAG, "onHostPause");
    }

    @Override
    public void onHostDestroy() {
        if (isScreenLockActive) {
            releaseScreenOn();
        }
        reactContext.removeLifecycleEventListener(this);
    }

    @Override
    public void invalidate() {
        if (isScreenLockActive) {
            releaseScreenOn();
        }
        reactContext.removeLifecycleEventListener(this);
        super.invalidate();
    }

    public void cleanup() {
        try {
            GxyLogger.d(TAG, "Cleaning up screen lock");
            Activity activity = getCurrentActivity();
            if (activity != null) {
                activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
            reactContext.removeLifecycleEventListener(this);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during cleanup", e);
        }
    }
}