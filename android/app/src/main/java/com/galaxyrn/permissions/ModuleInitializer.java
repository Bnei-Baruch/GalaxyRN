package com.galaxyrn.permissions;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.galaxyrn.callManager.CallListenerModule;
import com.galaxyrn.callManager.PhoneCallListener;
import com.galaxyrn.audioManager.AudioDeviceModule;
import com.galaxyrn.WakeLockModule;
import com.galaxyrn.foreground.ForegroundModule;
import com.galaxyrn.permissions.PermissionsModule;

public class ModuleInitializer {
    private static final String TAG = "ModuleInitializer";

    private final ReactApplicationContext reactContext;

    public ModuleInitializer(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
    }

    public void initializeModules() {
        Log.d(TAG, "Starting module initialization after permissions granted");

        initializeCallListenerModule();
        initializeAudioDeviceModule();
        initializePermissionsModule();

        Log.d(TAG, "All modules initialization completed");
    }

    private void initializeCallListenerModule() {
        try {
            if (reactContext != null) {
                Log.d(TAG, "Initializing CallListenerModule after permissions granted");

                // Get the CallListenerModule instance from React Native module registry
                CallListenerModule callListenerModule = reactContext.getNativeModule(CallListenerModule.class);
                if (callListenerModule != null) {
                    callListenerModule.initializeAfterPermissions();
                    Log.d(TAG, "CallListenerModule.initializeAfterPermissions() called successfully");
                } else {
                    Log.w(TAG, "CallListenerModule not found in React Native module registry");

                    // Fallback: try to initialize PhoneCallListener directly
                    PhoneCallListener callListener = PhoneCallListener.getInstance();
                    if (callListener != null && !callListener.isInitialized()) {
                        boolean success = callListener.initialize(reactContext);
                        if (success) {
                            Log.d(TAG, "PhoneCallListener initialized successfully after permissions (fallback)");
                        } else {
                            Log.e(TAG, "Failed to initialize PhoneCallListener after permissions (fallback)");
                        }
                    }
                }
            } else {
                Log.w(TAG, "ReactApplicationContext is null, cannot initialize CallListenerModule");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing CallListenerModule after permissions: " + e.getMessage(), e);
        }
    }

    /**
     * Initialize the AudioDeviceModule after permissions are granted
     */
    private void initializeAudioDeviceModule() {
        try {
            if (reactContext != null) {
                Log.d(TAG, "Initializing AudioDeviceModule after permissions granted");

                // Get the AudioDeviceModule instance from React Native module registry
                AudioDeviceModule audioDeviceModule = reactContext.getNativeModule(AudioDeviceModule.class);
                if (audioDeviceModule != null) {
                    audioDeviceModule.initializeAfterPermissions();
                    Log.d(TAG, "AudioDeviceModule.initializeAfterPermissions() called successfully");
                } else {
                    Log.w(TAG, "AudioDeviceModule not found in React Native module registry");
                }
            } else {
                Log.w(TAG, "ReactApplicationContext is null, cannot initialize AudioDeviceModule");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing AudioDeviceModule after permissions: " + e.getMessage(), e);
        }
    }

    private void initializePermissionsModule() {
        try {
            if (reactContext != null) {
                Log.d(TAG, "Initializing PermissionsModule after permissions granted");

                // Get the PermissionsModule instance from React Native module registry
                PermissionsModule permissionsModule = reactContext.getNativeModule(PermissionsModule.class);
                if (permissionsModule != null) {
                    Log.d(TAG, "PermissionsModule found and ready to use");
                    permissionsModule.initializeAfterPermissions();
                } else {
                    Log.w(TAG, "PermissionsModule not found in React Native module registry");
                }
            } else {
                Log.w(TAG, "ReactApplicationContext is null, cannot initialize PermissionsModule");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing PermissionsModule after permissions: " + e.getMessage(), e);
        }
    }
}