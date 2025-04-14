package com.galaxyrn.callManager;

import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;
import io.sentry.Sentry;

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

    /**
     * Constructor for the CallListenerModule
     * @param reactContext The React application context
     */
    public CallListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
        reactContext.addLifecycleEventListener(this);
        callListener = PhoneCallListener.getInstance();
        Log.d(TAG, "CallListenerModule instantiated for package: " + context.getPackageName());
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
            Log.d(TAG, "Initializing CallListenerModule for package: " + context.getPackageName());
            if (!callListener.isInitialized()) {
                boolean success = callListener.initialize(context);
                if (success) {
                    Log.d(TAG, "CallListenerModule initialized successfully");
                } else {
                    Log.e(TAG, "Failed to initialize CallListenerModule");
                }
            } else {
                Log.d(TAG, "CallListenerModule already initialized");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in initialize(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }

    /**
     * Called when the host app is resumed
     */
    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume()");
        if (!callListener.isInitialized()) {
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
            if (callListener != null && callListener.isInitialized()) {
                callListener.cleanup();
            }
            Log.d(TAG, "CallListenerModule cleaned up successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error in onHostDestroy(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
}
