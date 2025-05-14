package com.galaxyrn.callManager;

import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;
import io.sentry.Sentry;
import com.facebook.react.bridge.ReactMethod;

/**
 * React Native module for managing phone call events.
 * Handles lifecycle events and manages the phone call listener.
 */
@ReactModule(name = CallListenerModule.NAME)
@RequiresApi(api = Build.VERSION_CODES.M)
public class CallListenerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    public static final String NAME = "CallListenerModule";
    private static final String TAG = NAME;
    
    private final ReactApplicationContext context;
    private ICallListener callListener;
    private boolean isInitialized = false;

    /**
     * Constructor for the CallListenerModule
     * @param reactContext The React application context
     */
    public CallListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
        try {
            reactContext.addLifecycleEventListener(this);
            Log.d(TAG, "CallListenerModule constructor completed safely");
        } catch (Exception e) {
            Log.e(TAG, "Error in constructor: " + e.getMessage());
            Sentry.captureException(e);
        }
    }

    /**
     * Returns the name of the module for React Native
     */
    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Initialize the module and phone call listener
     */
    @Override
    public void initialize() {
        super.initialize();

        try {
            // If we're already initialized, don't do it again
            if (isInitialized) {
                Log.d(TAG, "CallListenerModule already initialized");
                return;
            }
            
            Log.d(TAG, "Initializing CallListenerModule for package: " + context.getPackageName());
            
            // Initialize in a separate thread
            new Thread(() -> {
                try {
                    // Initialize on UI thread using UiThreadUtil instead of ReactContext method
                    UiThreadUtil.runOnUiThread(() -> {
                        try {
                            if (callListener == null) {
                                callListener = PhoneCallListener.getInstance();
                                Log.d(TAG, "CallListenerModule instance created");
                            }
                            
                            if (callListener != null && !callListener.isInitialized()) {
                                boolean success = callListener.initialize(context);
                                if (success) {
                                    isInitialized = true;
                                    Log.d(TAG, "CallListenerModule initialized successfully");
                                } else {
                                    Log.e(TAG, "Failed to initialize CallListenerModule");
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error initializing on UI thread: " + e.getMessage(), e);
                            Sentry.captureException(e);
                        }
                    });
                } catch (Exception e) {
                    Log.e(TAG, "Error in initialization thread: " + e.getMessage(), e);
                    Sentry.captureException(e);
                }
            }).start();
        } catch (Exception e) {
            Log.e(TAG, "Error in initialize(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep track of listeners if needed
        Log.d(TAG, "addListener() for event: " + eventName);
    }
    
    @ReactMethod
    public void removeListeners(int count) {
        // Remove listeners if needed
        Log.d(TAG, "removeListeners() count: " + count);
    }

    /**
     * Called when the host app is resumed
     */
    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume()");
        
        if (!isInitialized) {
            initialize();
        }
    }

    /**
     * Called when the host app is paused
     */
    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause()");
    }

    /**
     * Called when the host app is destroyed
     * Cleans up the phone call listener
     */
    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy()");
        
        try {
            new Thread(() -> {
                UiThreadUtil.runOnUiThread(() -> {
                    if (callListener != null && callListener.isInitialized()) {
                        callListener.cleanup();
                        isInitialized = false;
                    }
                    Log.d(TAG, "CallListenerModule cleaned up successfully");
                });
            }).start();
        } catch (Exception e) {
            Log.e(TAG, "Error in onHostDestroy(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
}
