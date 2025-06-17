package com.galaxyrn.permissions;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import android.util.Log;
import com.galaxyrn.logger.GxyLogger;
import com.galaxyrn.SendEventToClient;

/**
 * Module that serves as a bridge for permissions handling in React Native.
 * This module is only used for adding event listener for permissions in React.
 */
@ReactModule(name = PermissionsModule.NAME)
public class PermissionsModule extends ReactContextBaseJavaModule {
    public static final String NAME = "PermissionsModule";
    private static final String TAG = "PermissionsModule";
    private final ReactApplicationContext reactContext;
    private static boolean isInitialized = false;

    public PermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "Creating PermissionsModule");
        this.reactContext = reactContext;
    }

    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "Initializing PermissionsModule after permissions granted");
        PermissionsModule.isInitialized = true;
        GxyLogger.d(TAG, "PermissionsModule initialized: " + PermissionsModule.isInitialized);

        // Send event to React Native that permissions are ready
        try {
            WritableMap params = Arguments.createMap();
            params.putBoolean("allGranted", true);
            SendEventToClient.sendEvent("permissionsStatus", params);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error sending permissions status event: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getPermissionStatus(Promise promise) {
        GxyLogger.d(TAG, "Getting permission status: " + PermissionsModule.isInitialized);
        promise.resolve(PermissionsModule.isInitialized);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}