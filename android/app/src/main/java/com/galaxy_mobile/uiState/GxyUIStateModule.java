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
            isForeground = false;
            GxyLogger.d(TAG, "Started foreground service");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to start foreground service when app backgrounded", e);
        }
        disableKeepScreenOn();
    }

    private void handleAppForegrounded() {
        isForeground = true;
        if (!GxyUIStateModule.isMicOn) {
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
    public void updateUIState(boolean isMicOn, boolean isInRoom, String room, boolean isCammute) {
        GxyLogger.d(TAG, "updateUIState: isMicOn: " + isMicOn + " isInRoom: " + isInRoom + " room: " + room + " isCammute: " + isCammute);
        boolean needPIPUpdate = (isMicOn != GxyUIStateModule.isMicOn) || (isInRoom != GxyUIStateModule.isInRoom)
        || (isCammute != GxyUIStateModule.isCammute);
        
        boolean needForegroundUpdate = (isMicOn != GxyUIStateModule.isMicOn) || (isInRoom != GxyUIStateModule.isInRoom)
        || (room != GxyUIStateModule.room);

        GxyLogger.d(TAG, "needPIPUpdate: " + needPIPUpdate + " needForegroundUpdate: " + needForegroundUpdate);
        
        GxyUIStateModule.isMicOn = isMicOn;
        GxyUIStateModule.isInRoom = isInRoom;
        GxyUIStateModule.room = room;
        GxyUIStateModule.isCammute = isCammute;
        
        if (needForegroundUpdate) {
            if (!isMicOn && isForeground) {
                stopService();
            } else {
                startService();
            }
        }
        
        if (needPIPUpdate) {
            Activity activity = getCurrentActivity();
            if (activity != null && activity.isInPictureInPictureMode()) {
                GxyPipBuilder pipBuilder = new GxyPipBuilder(getReactApplicationContext());
                pipBuilder.build();
            }
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

    /**
     * Start the foreground service from MainActivity (used in pip mode)
     * 
     * @param activity
     */
    public static void startForegroundService(Activity activity) {
        GxyLogger.d(TAG, "startForegroundService");
        Intent intent = new Intent(activity, ForegroundService.class);
        intent.setAction(ForegroundService.START_SERVICE_ACTION);
        activity.startForegroundService(intent);
    }

}