package com.galaxy_mobile.foreground;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.galaxy_mobile.logger.GxyLogger;
import android.view.WindowManager;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import androidx.annotation.NonNull;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import com.galaxy_mobile.MainApplication;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
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
    private LifecycleEventObserver lifecycleObserver;
    private boolean isInitialized = false;
    private boolean isMicOn = false;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "ForegroundModule constructor called");
        this.isMicOn = false;
    }

    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "Initializing ForegroundModule after permissions granted");


        foregroundService = new ForegroundService();
        GxyLogger.d(TAG, "ForegroundModule initialized");

    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    private void initLifecycleObserver() {
        mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.post(() -> {
            // Remove old observer if exists (safety check)
            if (lifecycleObserver != null) {
                try {
                    ProcessLifecycleOwner.get().getLifecycle().removeObserver(lifecycleObserver);
                    GxyLogger.d(TAG, "Removed old lifecycle observer");
                } catch (Exception e) {
                    GxyLogger.e(TAG, "Error removing old observer", e);
                }
            }

            // Create and add new observer
            lifecycleObserver = (source, event) -> {
                GxyLogger.d(TAG, "ProcessLifecycleOwner event: " + event);

                if (event == Lifecycle.Event.ON_STOP) {
                    GxyLogger.d(TAG, "App entered background Mic is on: " + this.isMicOn);
                    ForegroundService.isActive = false;
                    handleAppBackgrounded();
                } else if (event == Lifecycle.Event.ON_START) {
                    GxyLogger.d(TAG, "App entered foreground Mic is on: " + this.isMicOn);
                    ForegroundService.isActive = true;
                    handleAppForegrounded();
                }

            };

            ProcessLifecycleOwner.get().getLifecycle().addObserver(lifecycleObserver);
            GxyLogger.d(TAG, "Lifecycle observer added successfully");
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
            foregroundService.start();
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
        /* TODO: check if can make it on other way.
        If mic is on, don't stop the foreground service.
        Cause after impossible to start the foreground microphone again. 
        */
        GxyLogger.d(TAG, "Mic is on: " + this.isMicOn);
        if (!this.isMicOn) {
            foregroundService.stop();
            GxyLogger.d(TAG, "Mic is off, stopped foreground service");
        } 
        enableKeepScreenOn();
    }

    @Override
    public void invalidate() {
        super.invalidate();

        // Remove lifecycle observer
        if (lifecycleObserver != null) {
            try {
                mainHandler.post(() -> {
                    ProcessLifecycleOwner.get().getLifecycle().removeObserver(lifecycleObserver);
                    GxyLogger.d(TAG, "Lifecycle observer removed on invalidate");
                });
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error removing observer on invalidate", e);
            }
        }

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

        activity.runOnUiThread(() -> {
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            GxyLogger.d(TAG, "Screen will stay on (FLAG_KEEP_SCREEN_ON added)");
        });
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

        activity.runOnUiThread(() -> {
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            GxyLogger.d(TAG, "Screen timeout enabled (FLAG_KEEP_SCREEN_ON removed)");
        });
    }

    
    @ReactMethod
    public void startForegroundListener(Promise promise) {
        GxyLogger.d(TAG, "startForegroundListener");
        initLifecycleObserver();
        promise.resolve(true);
    }

    @ReactMethod
    public void setMicOn() {
        GxyLogger.d(TAG, "setMicOn");
        this.isMicOn = true;
        if (foregroundService == null) {
            GxyLogger.d(TAG, "Cannot setMicOn: ForegroundService not initialized");
            return;
        }
        foregroundService.setMicOn();
    }

    /**
     * On setMicOff, stop the foreground service
     */
    @ReactMethod
    public void setMicOff() {
        GxyLogger.d(TAG, "setMicOff");
        this.isMicOn = false;
        if (foregroundService == null) {
            GxyLogger.d(TAG, "Cannot setMicOff: ForegroundService not initialized");
            return;
        }
        foregroundService.setMicOff();
    }
}