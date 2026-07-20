package com.galaxy_mobile.foreground;

import android.os.Handler;
import android.os.Looper;
import com.galaxy_mobile.logger.GxyLogger;

import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.facebook.fbreact.specs.NativeForegroundModuleSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.permissions.PermissionAware;

@ReactModule(name = ForegroundModule.NAME)
public class ForegroundModule extends NativeForegroundModuleSpec implements PermissionAware {

    private static final String TAG = "ForegroundModule";

    private final ReactApplicationContext reactContext;
    private LifecycleEventObserver lifecycleObserver;
    private Handler mainHandler;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "constructor called");

        this.reactContext = reactContext;
    }

    @Override
    public void onPermissionsGranted() {
        initializeAfterPermissions();
    }

    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "initializeAfterPermissions() called");

        initLifecycleObserver();
        GxyLogger.d(TAG, "initializeAfterPermissions() completed");

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
            ForegroundService.start(reactContext);
            GxyLogger.d(TAG, "Started foreground service");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on handleAppBackgrounded", e);
        }
    }

    private void handleAppForegrounded() {
        try {
            ForegroundService.stop(reactContext);
            GxyLogger.d(TAG, "Stopped foreground service");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on handleAppForegrounded", e);
        }
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void setMicOn() {
        GxyLogger.d(TAG, "setMicOn called");
        ForegroundService.setMicOn();
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void setMicOff() {
        GxyLogger.d(TAG, "setMicOff");
        ForegroundService.setMicOff();
    }

    public void cleanup() {
        GxyLogger.d(TAG, "cleanup() called");
        try {
            if (lifecycleObserver != null) {
                ProcessLifecycleOwner.get().getLifecycle().removeObserver(lifecycleObserver);
                lifecycleObserver = null;
            }
            if (mainHandler != null) {
                mainHandler.removeCallbacksAndMessages(null);
            }
            ForegroundService.stop(reactContext);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on cleanup", e);
        }
    }
}