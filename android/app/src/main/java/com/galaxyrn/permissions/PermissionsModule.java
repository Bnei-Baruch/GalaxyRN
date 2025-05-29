package com.galaxyrn.permissions;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;
import android.util.Log;

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
        Log.d(TAG, "Creating PermissionsModule");
        this.reactContext = reactContext;
    }

    public void initializeAfterPermissions() {
        Log.d(TAG, "Initializing PermissionsModule after permissions granted");
        PermissionsModule.isInitialized = true;
        Log.d(TAG, "PermissionsModule initialized: " + PermissionsModule.isInitialized);
    }

    @ReactMethod
    public void getPermissionStatus(Promise promise) {
        Log.d(TAG, "Getting permission status: " + PermissionsModule.isInitialized);
        promise.resolve(PermissionsModule.isInitialized);
    }

    @Override
    public String getName() {
        return NAME;
    }
}