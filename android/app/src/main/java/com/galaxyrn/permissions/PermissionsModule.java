package com.galaxyrn.permissions;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Module that serves as a bridge for permissions handling in React Native.
 * This module is only used for adding event listener for permissions in React.
 */
public class PermissionsModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public PermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "PermissionsModule";
    }

    /**
     * Required method for NativeEventEmitter
     */
    @ReactMethod
    public void addListener(String eventName) {
        // Implementation required by NativeEventEmitter
    }

    /**
     * Required method for NativeEventEmitter
     */
    @ReactMethod
    public void removeListeners(Integer count) {
        // Implementation required by NativeEventEmitter
    }
}