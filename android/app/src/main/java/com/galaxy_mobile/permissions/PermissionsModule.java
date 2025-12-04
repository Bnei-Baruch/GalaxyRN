package com.galaxy_mobile.permissions;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.SendEventToClient;
import com.galaxy_mobile.logger.GxyLogger;
import com.facebook.react.bridge.ReactApplicationContext;

@ReactModule(name = PermissionsModule.NAME)
public class PermissionsModule extends ReactContextBaseJavaModule {
    public static final String NAME = "PermissionsModule";
    private static final String TAG = "PermissionsModule";
    private boolean isInitialized = false;

    public PermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "constructor called");
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "Initializing PermissionsModule after permissions granted");
        this.isInitialized = true;
        GxyLogger.d(TAG, "PermissionsModule initialized: " + Boolean.toString(this.isInitialized));

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
        GxyLogger.d(TAG, "Getting permission status: " + Boolean.toString(this.isInitialized));
        promise.resolve(this.isInitialized);
    }
}