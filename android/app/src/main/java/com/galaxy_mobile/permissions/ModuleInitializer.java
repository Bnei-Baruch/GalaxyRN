package com.galaxy_mobile.permissions;

import android.util.Log;
import com.galaxy_mobile.logger.GxyLogger;
import com.facebook.react.bridge.ReactApplicationContext;
import com.galaxy_mobile.callManager.CallListenerModule;
import com.galaxy_mobile.callManager.PhoneCallListener;
import com.galaxy_mobile.audioManager.AudioDeviceModule;
import com.galaxy_mobile.permissions.PermissionsModule;

public class ModuleInitializer {
    private static final String TAG = "ModuleInitializer";

    private final ReactApplicationContext reactContext;

    public ModuleInitializer(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
    }

    public void initializeModules() {
        GxyLogger.d(TAG, "Starting module initialization after permissions granted");

        initializeCallListenerModule();
        initializeAudioDeviceModule();
        initializePermissionsModule();

        GxyLogger.d(TAG, "All modules initialization completed");
    }

    private void initializeCallListenerModule() {
        try {
            if (reactContext != null) {
                GxyLogger.d(TAG, "Initializing CallListenerModule after permissions granted");

                // Get the CallListenerModule instance from React Native module registry
                CallListenerModule callListenerModule = reactContext.getNativeModule(CallListenerModule.class);
                if (callListenerModule != null) {
                    callListenerModule.initializeAfterPermissions();
                    GxyLogger.d(TAG, "CallListenerModule.initializeAfterPermissions() called successfully");
                } else {
                    GxyLogger.w(TAG, "CallListenerModule not found in React Native module registry");

                    // Fallback: try to initialize PhoneCallListener directly
                    PhoneCallListener callListener = PhoneCallListener.getInstance();
                    if (callListener != null && !callListener.isInitialized()) {
                        boolean success = callListener.initialize(reactContext);
                        if (success) {
                            GxyLogger.d(TAG, "PhoneCallListener initialized successfully after permissions (fallback)");
                        } else {
                            GxyLogger.e(TAG, "Failed to initialize PhoneCallListener after permissions (fallback)");
                        }
                    }
                }
            } else {
                GxyLogger.w(TAG, "ReactApplicationContext is null, cannot initialize CallListenerModule");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error initializing CallListenerModule after permissions: " + e.getMessage(), e);
        }
    }

    /**
     * Initialize the AudioDeviceModule after permissions are granted
     */
    private void initializeAudioDeviceModule() {
        try {
            if (reactContext != null) {
                GxyLogger.d(TAG, "Initializing AudioDeviceModule after permissions granted");

                // Get the AudioDeviceModule instance from React Native module registry
                AudioDeviceModule audioDeviceModule = reactContext.getNativeModule(AudioDeviceModule.class);
                if (audioDeviceModule != null) {
                    audioDeviceModule.initializeAfterPermissions();
                    GxyLogger.d(TAG, "AudioDeviceModule.initializeAfterPermissions() called successfully");
                } else {
                    GxyLogger.w(TAG, "AudioDeviceModule not found in React Native module registry");
                }
            } else {
                GxyLogger.w(TAG, "ReactApplicationContext is null, cannot initialize AudioDeviceModule");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error initializing AudioDeviceModule after permissions: " + e.getMessage(), e);
        }
    }

    private void initializePermissionsModule() {
        try {
            if (reactContext != null) {
                GxyLogger.d(TAG, "Initializing PermissionsModule after permissions granted");

                // Get the PermissionsModule instance from React Native module registry
                PermissionsModule permissionsModule = reactContext.getNativeModule(PermissionsModule.class);
                if (permissionsModule != null) {
                    GxyLogger.d(TAG, "PermissionsModule found and ready to use");
                    permissionsModule.initializeAfterPermissions();
                } else {
                    GxyLogger.w(TAG, "PermissionsModule not found in React Native module registry");
                }
            } else {
                GxyLogger.w(TAG, "ReactApplicationContext is null, cannot initialize PermissionsModule");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error initializing PermissionsModule after permissions: " + e.getMessage(), e);
        }
    }
}