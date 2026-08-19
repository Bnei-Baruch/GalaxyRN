package com.galaxy_mobile.backgroundTimer;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;

import com.facebook.fbreact.specs.NativeBackgroundTimerModuleSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.logger.GxyLogger;

@ReactModule(name = BackgroundTimerModule.NAME)
public class BackgroundTimerModule extends NativeBackgroundTimerModuleSpec implements LifecycleEventListener {
    public static final String NAME = "BackgroundTimerModule";
    private static final String TAG = "BackgroundTimerModule";

    private final ReactApplicationContext reactContext;
    private final PowerManager.WakeLock wakeLock;

    public BackgroundTimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        PowerManager powerManager = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
        this.wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                BackgroundTimerModule.class.getCanonicalName());

        reactContext.addLifecycleEventListener(this);
        GxyLogger.d(TAG, "constructor: module created, wakeLock allocated");
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void start() {
        GxyLogger.d(TAG, "start() called, wakeLock.isHeld()=" + wakeLock.isHeld());
        try {
            if (!wakeLock.isHeld()) {
                wakeLock.acquire();
                GxyLogger.d(TAG, "start(): wakeLock acquired");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error acquiring wake lock: " + e.getMessage(), e);
        }
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void stop() {
        GxyLogger.d(TAG, "stop() called, wakeLock.isHeld()=" + wakeLock.isHeld());
        try {
            if (wakeLock.isHeld()) {
                wakeLock.release();
                GxyLogger.d(TAG, "stop(): wakeLock released");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error releasing wake lock: " + e.getMessage(), e);
        }
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void setTimeout(double id, double timeoutMs) {
        GxyLogger.d(TAG, "setTimeout(): arming id=" + id + " timeoutMs=" + timeoutMs
                + " wakeLock.isHeld()=" + wakeLock.isHeld());
        Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(() -> {
            boolean active = reactContext.hasActiveCatalystInstance();
            GxyLogger.d(TAG, "setTimeout(): fired id=" + id + " hasActiveCatalystInstance=" + active
                    + " wakeLock.isHeld()=" + wakeLock.isHeld());
            if (active) {
                try {
                    emitTimeout(id);
                } catch (Exception e) {
                    GxyLogger.e(TAG, "Error emitting timeout: " + e.getMessage(), e);
                }
            } else {
                GxyLogger.w(TAG, "setTimeout(): dropped id=" + id + " - no active catalyst instance");
            }
        }, (long) timeoutMs);
    }

    @Override
    public void onHostResume() {
        GxyLogger.d(TAG, "onHostResume()");
    }

    @Override
    public void onHostPause() {
        GxyLogger.d(TAG, "onHostPause(): app moving to background, wakeLock.isHeld()=" + wakeLock.isHeld());
    }

    @Override
    public void onHostDestroy() {
        GxyLogger.d(TAG, "onHostDestroy(): wakeLock.isHeld()=" + wakeLock.isHeld());
        try {
            if (wakeLock.isHeld()) {
                wakeLock.release();
                GxyLogger.d(TAG, "onHostDestroy(): wakeLock released defensively");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error releasing wake lock on host destroy: " + e.getMessage(), e);
        }
    }
}
