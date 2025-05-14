package com.galaxyrn;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import android.view.WindowManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class WakeLockModule extends ReactContextBaseJavaModule {
    private static final String TAG = "WakeLockModule";
    private PowerManager.WakeLock wakeLock;
    private final ReactApplicationContext reactContext;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public WakeLockModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "WakeLockModule";
    }

    @ReactMethod
    public void keepScreenOn(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            mainHandler.post(() -> {
                try {
                    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    Log.d(TAG, "Screen wake lock enabled");
                    promise.resolve(true);
                } catch (Exception e) {
                    Log.e(TAG, "Error enabling screen wake lock", e);
                    promise.reject("SCREEN_WAKE_LOCK_ERROR", e.getMessage());
                }
            });
        } else {
            promise.reject("NO_ACTIVITY", "No activity available");
        }
    }

    @ReactMethod
    public void releaseScreenOn(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            mainHandler.post(() -> {
                try {
                    activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    Log.d(TAG, "Screen wake lock disabled");
                    promise.resolve(true);
                } catch (Exception e) {
                    Log.e(TAG, "Error disabling screen wake lock", e);
                    promise.reject("SCREEN_WAKE_LOCK_ERROR", e.getMessage());
                }
            });
        } else {
            promise.reject("NO_ACTIVITY", "No activity available");
        }
    }
}