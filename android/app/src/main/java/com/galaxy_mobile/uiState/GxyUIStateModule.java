package com.galaxy_mobile.uiState;

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

import com.galaxy_mobile.uiState.GxyPipBuilder;
import com.galaxy_mobile.foreground.ForegroundService;

@ReactModule(name = GxyUIStateModule.NAME)
public class GxyUIStateModule extends ReactContextBaseJavaModule {

    public static final String NAME = "GxyUIStateModule";
    private static final String TAG = "GxyUIStateModule";

    private Handler mainHandler;
    private LifecycleEventObserver lifecycleObserver;
    public static boolean isForeground = true;
    public static boolean isMicOn = false;
    public static boolean isInRoom = false;
    public static String room = "Not in room";
    public static boolean isCammute = false;

    public GxyUIStateModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "GxyUIStateModule constructor called");
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
                    isForeground = false;
                    disableKeepScreenOn();
                } else if (event == Lifecycle.Event.ON_START) {
                    GxyLogger.d(TAG, "App entered foreground");
                    isForeground = true;
                    enableKeepScreenOn();
                }

            };

            ProcessLifecycleOwner.get().getLifecycle().addObserver(lifecycleObserver);
            GxyLogger.d(TAG, "initLifecycleObserver completed");
        });
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
    public void startForeground(Promise promise) {
        GxyLogger.d(TAG, "startForeground");
        initLifecycleObserver();
        isForeground = true;
        startService();
        promise.resolve(true);
    }

    @ReactMethod
    public void stopForeground(Promise promise) {
        GxyLogger.d(TAG, "stopForeground");

        if (!ForegroundService.isRunning) {
            GxyLogger.d(TAG, "Skipping stopForeground");
            promise.resolve(true);
            return;
        }

        Activity activity = getCurrentActivity();
        if (activity == null) {
            GxyLogger.d(TAG, "activity is null, skipping stopForeground");
            promise.resolve(true);
            return;
        }
        Intent intent = new Intent(activity, ForegroundService.class);
        intent.setAction(ForegroundService.STOP_SERVICE_ACTION);
        activity.startForegroundService(intent);
        
        GxyLogger.d(TAG, "stopForeground completed");
        promise.resolve(true);
    }

    @ReactMethod
    public void updateUIState(boolean isMicOn, boolean isInRoom, String room, boolean isCammute) {
        GxyLogger.d(TAG, "updateUIState: isMicOn: " + isMicOn + " isInRoom: " + isInRoom + " room: " + room
                + " isCammute: " + isCammute);
        boolean needPIPUpdate = (isMicOn != GxyUIStateModule.isMicOn) || (isInRoom != GxyUIStateModule.isInRoom)
                || (isCammute != GxyUIStateModule.isCammute);

        boolean needForegroundUpdate = (isMicOn != GxyUIStateModule.isMicOn) || (isInRoom != GxyUIStateModule.isInRoom)
                || !room.equals(GxyUIStateModule.room);

        GxyLogger.d(TAG, "needPIPUpdate: " + needPIPUpdate + " needForegroundUpdate: " + needForegroundUpdate);

        GxyUIStateModule.isMicOn = isMicOn;
        GxyUIStateModule.isInRoom = isInRoom;
        GxyUIStateModule.room = room;
        GxyUIStateModule.isCammute = isCammute;

        if (needForegroundUpdate) {
            startService();
        }

        if (needPIPUpdate) {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                GxyLogger.d(TAG, "activity is null, skipping PIP update");
                return;
            }

            GxyPipBuilder pipBuilder = new GxyPipBuilder(getReactApplicationContext());
            pipBuilder.build();
        }
    }

    @ReactMethod
    public void activatePip(Promise promise) {
        GxyLogger.d(TAG, "activatePip");
        GxyPipBuilder pipBuilder = new GxyPipBuilder(getReactApplicationContext());
        pipBuilder.build();
        promise.resolve(true);
    }

    private void startService() {
        GxyLogger.d(TAG, "startService");
        Intent intent = new Intent(getCurrentActivity(), ForegroundService.class);
        intent.setAction(ForegroundService.START_SERVICE_ACTION);
        getCurrentActivity().startForegroundService(intent);
    }
}