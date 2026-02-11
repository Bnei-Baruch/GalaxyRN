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

@ReactModule(name = ForegroundModule.NAME)
public class ForegroundModule extends ReactContextBaseJavaModule {

    public static final String NAME = "ForegroundModule";
    private static final String TAG = "ForegroundModule";

    private Handler mainHandler;
    private LifecycleEventObserver lifecycleObserver;
    private boolean isForeground = true;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "ForegroundModule constructor called");
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    private void initLifecycleObserver() {
        mainHandler = new Handler(Looper.getMainLooper());
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
            GxyLogger.d(TAG, "initLifecycleObserver completed");
        });
    }

    private void handleAppBackgrounded() {
        try {
            startService();
            this.isForeground = false;
            GxyLogger.d(TAG, "Started foreground service");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to start foreground service when app backgrounded", e);
        }
        disableKeepScreenOn();
    }

    private void handleAppForegrounded() {
        this.isForeground = true;
        if (!ForegroundService.isMicOn) {
            GxyLogger.d(TAG, "Mic is off, stopped foreground service");
            stopService();
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
    public void updateForegroundService(boolean isMicOn, boolean isInRoom, String room) {
        ForegroundService.isMicOn = isMicOn;
        ForegroundService.isInRoom = isInRoom;
        ForegroundService.room = room;
        if (!isMicOn && this.isForeground) {
            stopService();
        } else {
            startService();
        }
    }

    private void startService() {
        GxyLogger.d(TAG, "startService");
        Intent intent = new Intent(getCurrentActivity(), ForegroundService.class);
        intent.setAction(ForegroundService.START_SERVICE_ACTION);
        getCurrentActivity().startForegroundService(intent);
    }

    private void stopService() {
        if (!ForegroundService.isRunning) {
            GxyLogger.d(TAG, "Skipping stopService");
            return;
        }
        GxyLogger.d(TAG, "stopService");
        Intent intent = new Intent(getCurrentActivity(), ForegroundService.class);
        intent.setAction(ForegroundService.STOP_SERVICE_ACTION);
        getCurrentActivity().startForegroundService(intent);
    }
}