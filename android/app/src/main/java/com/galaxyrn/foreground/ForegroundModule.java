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
public class ForegroundModule extends ReactContextBaseJavaModule {

    public static final String NAME = "ForegroundModule";
    private static final String TAG = "ForegroundModule";

    private ForegroundService foregroundService;
    private Handler mainHandler;
    private final ReactApplicationContext context;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "ForegroundModule constructor called - context: " + reactContext);

        this.context = reactContext;
    }

    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "Initializing ForegroundModule after permissions granted");

        this.foregroundService = new ForegroundService();
        this.mainHandler = new Handler(Looper.getMainLooper());
        initLifecycleObserver();
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
    private void initLifecycleObserver() {
        mainHandler.post(() -> {
            ProcessLifecycleOwner.get().getLifecycle().addObserver((LifecycleEventObserver) (source, event) -> {
                GxyLogger.d(TAG, "ProcessLifecycleOwner event: " + event);

                if (event == Lifecycle.Event.ON_STOP) {
                    GxyLogger.d(TAG, "App entered background");
                    handleAppBackgrounded();
                } else if (event == Lifecycle.Event.ON_START) {
                    GxyLogger.d(TAG, "App entered foreground");
                    handleAppForegrounded();
                }
            });
        });
    }

    /**
     * Handles actions when app goes to background
     */
    private void handleAppBackgrounded() {
        if (foregroundService == null) {
            GxyLogger.w(TAG, "Cannot start foreground service: not initialized");
            return;
        }
        try {
            foregroundService.start(this.context);
            GxyLogger.d(TAG, "Started foreground service");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to start foreground service when app backgrounded", e);
        }
        disableKeepScreenOn();
    }

    private void handleAppForegrounded() {
        if (foregroundService == null) {
            GxyLogger.w(TAG, "Cannot stop foreground service: not initialized");
            enableKeepScreenOn();
            return;
        }
        foregroundService.stop(this.context);
        GxyLogger.d(TAG, "Stopped foreground service");
        enableKeepScreenOn();
    }

    @Override
    public void invalidate() {
        super.invalidate();

        disableKeepScreenOn();
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

    /**
     * On setMicOn, start the foreground service with microphone access
     */
    @ReactMethod
    public void setMicOn() {
        GxyLogger.d(TAG, "setMicOn");
        if (foregroundService == null) {
            GxyLogger.w(TAG, "Cannot setMicOn: ForegroundService not initialized (permissions not granted yet)");
            return;
        }
        foregroundService.setMicOn(this.context);
    }

    /**
     * On setMicOff, stop the foreground service
     */
    @ReactMethod
    public void setMicOff() {
        GxyLogger.d(TAG, "setMicOff");
        if (foregroundService == null) {
            GxyLogger.w(TAG, "Cannot setMicOff: ForegroundService not initialized (permissions not granted yet)");
            return;
        }
        foregroundService.setMicOff(this.context);
    }
}