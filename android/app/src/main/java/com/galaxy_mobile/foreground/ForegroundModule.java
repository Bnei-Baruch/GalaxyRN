package com.galaxy_mobile.foreground;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import com.galaxy_mobile.logger.GxyLogger;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.ReactApplicationContext;

@ReactModule(name = ForegroundModule.NAME)
public class ForegroundModule extends ReactContextBaseJavaModule {

    public static final String NAME = "ForegroundModule";
    private static final String TAG = "ForegroundModule";

    private ForegroundService foregroundService;
    private final ReactApplicationContext reactContext;
    private LifecycleEventObserver lifecycleObserver;
    private Handler mainHandler;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "constructor called"); 

        this.reactContext = reactContext;
    }

    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "initializeAfterPermissions() called");

        this.foregroundService = new ForegroundService(this.reactContext);
        this.foregroundService.init();
        initLifecycleObserver();
        GxyLogger.d(TAG, "initializeAfterPermissions() completed");

    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    private void initLifecycleObserver() {
        this.mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.post(() -> {
            lifecycleObserver = (source, event) -> {
                GxyLogger.d(TAG, "ProcessLifecycleOwner event: " + event);

                if (event == Lifecycle.Event.ON_STOP) {
                    GxyLogger.d(TAG, "App entered background");
                    handleAppBackgrounded();
                } else if (event == Lifecycle.Event.ON_START) {
                    GxyLogger.d(TAG, "App entered foreground");
                    handleAppForegrounded();
                }
            };

            ProcessLifecycleOwner.get().getLifecycle().addObserver(lifecycleObserver);
            GxyLogger.d(TAG, "Lifecycle observer added");
        });
    }

    private void handleAppBackgrounded() {
        try {
            foregroundService.start();
            GxyLogger.d(TAG, "Started foreground service");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on handleAppBackgrounded", e);
        }
    }

    private void handleAppForegrounded() {
        try {
            foregroundService.stop();
            GxyLogger.d(TAG, "Stopped foreground service");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on handleAppForegrounded", e);
        }
    }

    @ReactMethod
    public void setMicOn() {
        GxyLogger.d(TAG, "setMicOn called");
        foregroundService.setMicOn();
    }

    @ReactMethod
    public void setMicOff() {
        GxyLogger.d(TAG, "setMicOff");
        foregroundService.setMicOff();
    }

    public void cleanup() {
        GxyLogger.d(TAG, "cleanup() called");
        try {
            if (foregroundService != null) {
                foregroundService.cleanup();
            }
            mainHandler.removeCallbacksAndMessages(null);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on cleanup", e);
        }
    }
}