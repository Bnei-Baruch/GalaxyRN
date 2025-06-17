package com.galaxyrn.callManager;

import android.os.Build;
import android.util.Log;
import com.galaxyrn.logger.GxyLogger;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;
import io.sentry.Sentry;
import com.facebook.react.bridge.ReactMethod;

/**
 * React Native module for managing phone call events.
 * Handles lifecycle events and manages the phone call listener.
 * Note: This module is initialized only after permissions are granted.
 */
@ReactModule(name = CallListenerModule.NAME)
@RequiresApi(api = Build.VERSION_CODES.M)
public class CallListenerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    public static final String NAME = "CallListenerModule";
    private static final String TAG = NAME;

    private final ReactApplicationContext context;
    private ICallListener callListener;
    private boolean isInitialized = false;
    private boolean autoInitializeDisabled = true; // Disable auto-initialization

    /**
     * Constructor for the CallListenerModule
     * 
     * @param reactContext The React application context
     */
    public CallListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
        GxyLogger.d(TAG, "CallListenerModule constructor called - context: " + context);
        try {
            reactContext.addLifecycleEventListener(this);
            GxyLogger.d(TAG, "CallListenerModule constructor completed safely - auto-initialization disabled");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in constructor: " + e.getMessage());
            Sentry.captureException(e);
        }
    }

    /**
     * Returns the name of the module for React Native
     */
    @NonNull
    @Override
    public String getName() {
        GxyLogger.d(TAG, "getName() called - returning: " + NAME);
        return NAME;
    }

    @Override
    public void initialize() {
        super.initialize();
        if (autoInitializeDisabled) {
            return;
        }

        GxyLogger.d(TAG, "Auto-initialization enabled - proceeding with initialization");
        initializeCallListener();
    }

    /**
     * Initialize the call listener - called after permissions are granted
     */
    private void initializeCallListener() {
        GxyLogger.d(TAG, "initializeCallListener() called - isInitialized: " + isInitialized + ", autoInitializeDisabled: "
                + autoInitializeDisabled);
        try {
            // If we're already initialized, don't do it again
            if (isInitialized) {
                GxyLogger.d(TAG, "CallListenerModule already initialized - skipping");
                return;
            }

            GxyLogger.d(TAG, "Starting CallListenerModule initialization for context: " + context);

            try {
                GxyLogger.d(TAG, "Checking callListener instance - callListener null: " + (callListener == null));
                if (callListener == null) {
                    callListener = PhoneCallListener.getInstance();
                    GxyLogger.d(TAG, "PhoneCallListener instance created successfully");
                } else {
                    GxyLogger.d(TAG, "Using existing PhoneCallListener instance");
                }

                if (callListener != null) {
                    GxyLogger.d(TAG, "CallListener is available, checking initialization status: "
                            + callListener.isInitialized());
                    if (!callListener.isInitialized()) {
                        GxyLogger.d(TAG, "Calling PhoneCallListener.initialize() with context" + context);
                        boolean success = callListener.initialize(context);
                        GxyLogger.d(TAG, "PhoneCallListener.initialize() returned: " + success);
                        if (success) {
                            isInitialized = true;
                            autoInitializeDisabled = false; // Enable for future lifecycle events
                            GxyLogger.d(TAG, "CallListenerModule initialized successfully - isInitialized: " + isInitialized);
                        } else {
                            GxyLogger.e(TAG,
                                    "Failed to initialize CallListenerModule - PhoneCallListener.initialize() returned false");
                        }
                    } else {
                        GxyLogger.d(TAG, "PhoneCallListener already initialized, setting module as initialized");
                        isInitialized = true;
                        autoInitializeDisabled = false;
                    }
                } else {
                    GxyLogger.e(TAG, "CallListener is null after getInstance() call");
                }
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error initializing: " + e.getMessage(), e);
                Sentry.captureException(e);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in initializeCallListener(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }

    /**
     * React Native method to check if the module is initialized
     */
    @ReactMethod
    public void isInitialized(Promise promise) {
        GxyLogger.d(TAG, "isInitialized() called from JavaScript - returning: " + isInitialized);
        promise.resolve(isInitialized);
    }

    /**
     * Public method to initialize the module after permissions are granted
     * This is called from the PermissionHelper
     */
    public void initializeAfterPermissions() {
        autoInitializeDisabled = false;
        initializeCallListener();
        GxyLogger.d(TAG, "initializeAfterPermissions() completed");
    }

    /**
     * Called when the host app is resumed
     */
    @Override
    public void onHostResume() {
        GxyLogger.d(TAG, "onHostResume() - current state: isInitialized=" + isInitialized + ", autoInitializeDisabled="
                + autoInitializeDisabled);
        if (!isInitialized && !autoInitializeDisabled) {
            initializeCallListener();
        }
    }

    /**
     * Called when the host app is paused
     */
    @Override
    public void onHostPause() {
        GxyLogger.d(TAG, "onHostPause() - current state: isInitialized=" + isInitialized + ", autoInitializeDisabled="
                + autoInitializeDisabled);
    }

    /**
     * Called when the host app is destroyed
     * Cleans up the phone call listener
     */
    @Override
    public void onHostDestroy() {
        GxyLogger.d(TAG, "onHostDestroy() - current state: isInitialized=" + isInitialized + ", callListener null="
                + (callListener == null));

        try {
            if (callListener != null && callListener.isInitialized()) {
                GxyLogger.d(TAG, "onHostDestroy() - cleaning up callListener");
                callListener.cleanup();
                isInitialized = false;
                GxyLogger.d(TAG, "CallListenerModule cleanup completed - isInitialized set to: " + isInitialized);
            } else {
                GxyLogger.d(TAG, "onHostDestroy() - no cleanup needed: callListener null=" + (callListener == null)
                        + ", callListener initialized="
                        + (callListener != null ? callListener.isInitialized() : "N/A"));
            }
            GxyLogger.d(TAG, "CallListenerModule onHostDestroy() completed successfully");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in onHostDestroy(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
}
