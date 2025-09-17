package com.galaxyrn.foreground;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.galaxyrn.logger.GxyLogger;
import android.view.WindowManager;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import androidx.annotation.NonNull;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import com.galaxyrn.MainApplication;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

/**
 * React Native module that manages foreground service and screen behavior
 * based on application lifecycle.
 */
@ReactModule(name = ForegroundModule.NAME)
public class ForegroundModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

    public static final String NAME = "ForegroundModule";
    private static final String TAG = "ForegroundModule";
    private final ForegroundService foregroundService;
    private final Handler mainHandler;
    private boolean isServiceRunning = false;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.foregroundService = new ForegroundService();
        this.mainHandler = new Handler(Looper.getMainLooper());

        // Register as lifecycle listener
        reactContext.addLifecycleEventListener(this);

        // Also use ProcessLifecycleOwner for more reliable app state detection
        initLifecycleObserver(reactContext);

        GxyLogger.d(TAG, "ForegroundModule initialized");
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Initializes the lifecycle observer to detect app foreground/background state
     *
     * @param reactContext The React application context
     */
    private void initLifecycleObserver(ReactApplicationContext reactContext) {
        mainHandler.post(() -> {
            ProcessLifecycleOwner.get().getLifecycle().addObserver((LifecycleEventObserver) (source, event) -> {
                if (event == Lifecycle.Event.ON_STOP) {
                    GxyLogger.d(TAG, "App entered background");
                    handleAppBackgrounded(reactContext);
                } else if (event == Lifecycle.Event.ON_START) {
                    GxyLogger.d(TAG, "App entered foreground");
                    handleAppForegrounded(reactContext);
                } else if (event == Lifecycle.Event.ON_DESTROY) {
                    GxyLogger.w(TAG, "App destruction detected - performing cleanup");
                    ensureServiceStopped(reactContext);
                    performCleanup(reactContext);
                }
            });
        });
    }

    /**
     * Handles actions when app goes to background
     */
    private void handleAppBackgrounded(ReactApplicationContext context) {
        if (!isServiceRunning) {
            foregroundService.start(context);
            isServiceRunning = true;
            GxyLogger.d(TAG, "Started foreground service");
        }
        disableKeepScreenOn();
    }

    private void handleAppForegrounded(ReactApplicationContext context) {
        if (isServiceRunning) {
            foregroundService.stop(context);
            isServiceRunning = false;
            GxyLogger.d(TAG, "Stopped foreground service");
        }
        enableKeepScreenOn();
    }

    private void ensureServiceStopped(ReactApplicationContext context) {
        if (context != null && isServiceRunning) {
            GxyLogger.d(TAG, "Ensuring foreground service is stopped during cleanup");
            foregroundService.stop(context);
            isServiceRunning = false;
        }
    }

    @Override
    public void invalidate() {
        GxyLogger.d(TAG, "Module invalidate() called - cleaning up resources");

        // Get context before calling super which might null it
        ReactApplicationContext context = getReactApplicationContext();

        super.invalidate();

        mainHandler.post(() -> {
            disableKeepScreenOn();

            // Stop the service if it's running
            if (context != null && isServiceRunning) {
                GxyLogger.d(TAG, "Stopping foreground service during module invalidation");
                foregroundService.stop(context);
                isServiceRunning = false;
            }
        });
    }

    // React Native Lifecycle Event Listener methods
    @Override
    public void onHostResume() {
        GxyLogger.d(TAG, "onHostResume");
        // App is in foreground
        handleAppForegrounded(getReactApplicationContext());
    }

    @Override
    public void onHostPause() {
        GxyLogger.d(TAG, "onHostPause");
        // App is in background
        handleAppBackgrounded(getReactApplicationContext());
    }

    @Override
    public void onHostDestroy() {
        GxyLogger.d(TAG, "onHostDestroy");
        performCleanup(getReactApplicationContext());
    }

    /**
     * Exposed to JS - manually stop the foreground service
     */
    @ReactMethod
    public void stopForegroundService() {
        ReactApplicationContext context = getReactApplicationContext();
        if (context != null && isServiceRunning) {
            GxyLogger.d(TAG, "Manually stopping foreground service from JS");
            foregroundService.stop(context);
            isServiceRunning = false;
        }
    }

    /**
     * Enables the KEEP_SCREEN_ON flag to prevent the screen from turning off
     */
    private void enableKeepScreenOn() {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            GxyLogger.d(TAG, "Cannot keep screen on: no current activity");
            return;
        }

        activity.runOnUiThread(() -> activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON));
    }

    /**
     * Disables the KEEP_SCREEN_ON flag to allow normal screen timeout behavior
     */
    private void disableKeepScreenOn() {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            GxyLogger.d(TAG, "Cannot modify screen flags: no current activity");
            return;
        }

        activity.runOnUiThread(() -> activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON));
    }

    private void performCleanup(ReactApplicationContext context) {
        GxyLogger.i(TAG, "Starting cleanup");

        // 1. Notify JS side and destroy React Native context
        try {
            MainApplication app = MainApplication.getInstance();
            if (app != null && app.getReactNativeHost() != null) {
                ReactInstanceManager rim = app.getReactNativeHost().getReactInstanceManager();
                if (rim != null) {
                    try {
                        if (context != null) {
                            rim.getCurrentReactContext()
                                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                    .emit("appTerminating", null);
                            GxyLogger.d(TAG, "Sent termination signal to JS");
                            Thread.sleep(1000);
                        }
                    } catch (Exception jsError) {
                        GxyLogger.w(TAG, "Could not send JS signal (normal during swipe-kill)", jsError);
                    }

                    GxyLogger.i(TAG, "Destroying React Native context");
                    rim.destroy();
                }
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error destroying React Native context", e);
        }

        // 2. Reset audio state
        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                am.abandonAudioFocus(null);
                am.setMode(AudioManager.MODE_NORMAL);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error resetting audio", e);
        }

        // 3. Flush Sentry
        try {
            io.sentry.Sentry.flush(1000); // Reduced timeout
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error flushing Sentry", e);
        }

        // 4. Force cleanup system resources
        try {
            GxyLogger.i(TAG, "Forcing garbage collection");
            System.gc();
            System.runFinalization();

            Thread.sleep(500);

            GxyLogger.i(TAG, "Cleanup completed - terminating process");

            // More aggressive process termination
            android.os.Process.killProcess(android.os.Process.myPid());
            System.exit(0);

        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during final cleanup", e);
            System.exit(1);
        }
    }
}