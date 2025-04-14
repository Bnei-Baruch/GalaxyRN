package com.galaxyrn.foreground;

import android.app.Activity;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

/**
 * React Native module that manages foreground service and screen behavior 
 * based on application lifecycle.
 */
public class ForegroundModule extends ReactContextBaseJavaModule {

    private static final String TAG = "ForegroundModule";
    private final ForegroundService foregroundService;
    private final Handler mainHandler;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.foregroundService = new ForegroundService();
        this.mainHandler = new Handler(Looper.getMainLooper());
        
        initLifecycleObserver(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "GxyModule";
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
                    Log.d(TAG, "App entered background");
                    handleAppBackgrounded(reactContext);
                } else if (event == Lifecycle.Event.ON_START) {
                    Log.d(TAG, "App entered foreground");
                    handleAppForegrounded(reactContext);
                }
            });
        });
    }
    
    /**
     * Handles actions when app goes to background
     *
     * @param context The React application context
     */
    private void handleAppBackgrounded(ReactApplicationContext context) {
        foregroundService.start(context);
        disableKeepScreenOn();
    }
    
    /**
     * Handles actions when app returns to foreground
     *
     * @param context The React application context
     */
    private void handleAppForegrounded(ReactApplicationContext context) {
        foregroundService.stop(context);
        enableKeepScreenOn();
    }

    @Override
    public void invalidate() {
        super.invalidate();

        mainHandler.post(() -> {
            disableKeepScreenOn();
            foregroundService.stop(getReactApplicationContext());
        });
    }

    /**
     * Enables the KEEP_SCREEN_ON flag to prevent the screen from turning off
     */
    private void enableKeepScreenOn() {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            Log.d(TAG, "Cannot keep screen on: no current activity");
            return;
        }
        
        activity.runOnUiThread(() -> 
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        );
    }

    /**
     * Disables the KEEP_SCREEN_ON flag to allow normal screen timeout behavior
     */
    private void disableKeepScreenOn() {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            Log.d(TAG, "Cannot modify screen flags: no current activity");
            return;
        }
        
        activity.runOnUiThread(() -> 
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        );
    }
}