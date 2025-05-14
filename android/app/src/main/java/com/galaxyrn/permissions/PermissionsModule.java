package com.galaxyrn.permissions;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

/**
 * Module that serves as a bridge for permissions handling in React Native.
 * This module is only used for adding event listener for permissions in React.
 */
public class PermissionsModule extends ReactContextBaseJavaModule  {
    public PermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "PermissionsModule";
    }
} 