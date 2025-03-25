package com.galaxyrn;

import android.app.Activity;
import android.os.Build;
import android.os.PowerManager;
import android.view.WindowManager;
import android.util.Log;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

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

    @ReactMethod
    public void acquireWakeLock(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            mainHandler.post(() -> {
                try {
                    PowerManager powerManager = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);

                    // Проверяем версию Android
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        // Для Android 5.0 и выше используем новый API
                        if (!powerManager.isWakeLockLevelSupported(PowerManager.SCREEN_BRIGHT_WAKE_LOCK)) {
                            promise.reject("WAKE_LOCK_NOT_SUPPORTED", "Wake lock not supported on this device");
                            return;
                        }
                    }

                    // Создаем WakeLock с учетом версии Android
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        // Для Android 8.0 и выше используем новый конструктор
                        wakeLock = powerManager.newWakeLock(
                                PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ON_AFTER_RELEASE,
                                "GalaxyRN:WakeLock");
                    } else {
                        // Для старых версий Android
                        wakeLock = powerManager.newWakeLock(
                                PowerManager.SCREEN_BRIGHT_WAKE_LOCK,
                                "GalaxyRN:WakeLock");
                    }

                    // Проверяем, не удерживается ли уже WakeLock
                    if (!wakeLock.isHeld()) {
                        wakeLock.acquire();
                        Log.d(TAG, "Wake lock acquired successfully");
                        promise.resolve(true);
                    } else {
                        Log.d(TAG, "Wake lock already held");
                        promise.resolve(true);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error acquiring wake lock", e);
                    promise.reject("WAKE_LOCK_ERROR", e.getMessage());
                }
            });
        } else {
            promise.reject("NO_ACTIVITY", "No activity available");
        }
    }

    @ReactMethod
    public void releaseWakeLock(Promise promise) {
        mainHandler.post(() -> {
            try {
                if (wakeLock != null && wakeLock.isHeld()) {
                    wakeLock.release();
                    Log.d(TAG, "Wake lock released successfully");
                    promise.resolve(true);
                } else {
                    Log.d(TAG, "Wake lock not held");
                    promise.resolve(true);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error releasing wake lock", e);
                promise.reject("WAKE_LOCK_ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void isWakeLockSupported(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            PowerManager powerManager = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
            boolean isSupported = false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                isSupported = powerManager.isWakeLockLevelSupported(PowerManager.SCREEN_BRIGHT_WAKE_LOCK);
            } else {
                // На старых версиях Android WakeLock всегда поддерживается
                isSupported = true;
            }

            promise.resolve(isSupported);
        } else {
            promise.reject("NO_ACTIVITY", "No activity available");
        }
    }
}