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

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * React Native module that manages foreground service and screen behavior 
 * based on application lifecycle.
 */
public class ForegroundModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

    private static final String TAG = "ForegroundModule";
    private final ForegroundService foregroundService;
    private final Handler mainHandler;
    private boolean isServiceRunning = false;
    private static final long DEBOUNCE_TIME_MS = 500;
    private long lastBackgroundTime = 0;
    private long lastForegroundTime = 0;

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.foregroundService = new ForegroundService();
        this.mainHandler = new Handler(Looper.getMainLooper());
        
        // Register as lifecycle listener
        reactContext.addLifecycleEventListener(this);
        
        // Also use ProcessLifecycleOwner for more reliable app state detection
        initLifecycleObserver(reactContext);
        
        Log.d(TAG, "ForegroundModule initialized");
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
                    Log.d(TAG, "App entered background (ProcessLifecycleOwner)");
                    handleAppBackgrounded(reactContext);
                } else if (event == Lifecycle.Event.ON_START) {
                    Log.d(TAG, "App entered foreground (ProcessLifecycleOwner)");
                    handleAppForegrounded(reactContext);
                } else if (event == Lifecycle.Event.ON_DESTROY) {
                    Log.d(TAG, "App is being destroyed (ProcessLifecycleOwner)");
                    ensureServiceStopped(reactContext);
                }
            });
        });
    }
    
    /**
     * Check if we should debounce the background transition
     */
    private boolean shouldDebounceBackground() {
        long now = System.currentTimeMillis();
        // If we recently went to foreground, debounce the background event
        if (now - lastForegroundTime < DEBOUNCE_TIME_MS) {
            Log.d(TAG, "Debouncing background transition - too soon after foreground");
            return true;
        }
        lastBackgroundTime = now;
        return false;
    }
    
    /**
     * Check if we should debounce the foreground transition
     */
    private boolean shouldDebounceForeground() {
        long now = System.currentTimeMillis();
        // If we recently went to background, debounce the foreground event
        if (now - lastBackgroundTime < DEBOUNCE_TIME_MS) {
            Log.d(TAG, "Debouncing foreground transition - too soon after background");
            return true;
        }
        lastForegroundTime = now;
        return false;
    }
    
    /**
     * Handles actions when app goes to background
     *
     * @param context The React application context
     */
    private void handleAppBackgrounded(ReactApplicationContext context) {
        if (shouldDebounceBackground()) {
            return;
        }
        
        if (!isServiceRunning) {
            mainHandler.postDelayed(() -> {
                // Double-check we're still in background before starting service
                if (!isServiceRunning) {
                    foregroundService.start(context);
                    isServiceRunning = true;
                    Log.d(TAG, "Started foreground service, service running: " + isServiceRunning);
                }
            }, 250); // Small delay to avoid race conditions
        }
        disableKeepScreenOn();
    }
    
    /**
     * Handles actions when app returns to foreground
     *
     * @param context The React application context
     */
    private void handleAppForegrounded(ReactApplicationContext context) {
        if (shouldDebounceForeground()) {
            return;
        }
        
        if (isServiceRunning) {
            mainHandler.postDelayed(() -> {
                // Double-check we're still in foreground before stopping service
                if (isServiceRunning) {
                    foregroundService.stop(context);
                    isServiceRunning = false;
                    Log.d(TAG, "Stopped foreground service, service running: " + isServiceRunning);
                }
            }, 250); // Small delay to avoid race conditions
        }
        enableKeepScreenOn();
    }
    
    /**
     * Ensures service is stopped in any case
     *
     * @param context The React application context
     */
    private void ensureServiceStopped(ReactApplicationContext context) {
        if (context != null && isServiceRunning) {
            Log.d(TAG, "Ensuring foreground service is stopped during cleanup");
            foregroundService.stop(context);
            isServiceRunning = false;
        }
    }

    @Override
    public void invalidate() {
        Log.d(TAG, "Module invalidate() called - cleaning up resources");
        
        // Get context before calling super which might null it
        ReactApplicationContext context = getReactApplicationContext();
        
        super.invalidate();

        mainHandler.post(() -> {
            disableKeepScreenOn();
            
            // Stop the service if it's running
            if (context != null && isServiceRunning) {
                Log.d(TAG, "Stopping foreground service during module invalidation");
                foregroundService.stop(context);
                isServiceRunning = false;
            }
        });
    }
    
    // React Native Lifecycle Event Listener methods
    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume");
        // App is in foreground
        handleAppForegrounded(getReactApplicationContext());
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause");
        // App is in background
        handleAppBackgrounded(getReactApplicationContext());
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy - Cleanup resources");
        // App is being destroyed
        ensureServiceStopped(getReactApplicationContext());
    }
    
    /**
     * Exposed to JS - manually stop the foreground service
     */
    @ReactMethod
    public void stopForegroundService() {
        ReactApplicationContext context = getReactApplicationContext();
        if (context != null && isServiceRunning) {
            Log.d(TAG, "Manually stopping foreground service from JS");
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