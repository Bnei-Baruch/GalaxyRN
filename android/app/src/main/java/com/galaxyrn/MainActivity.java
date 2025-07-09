package com.galaxyrn;

import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;
import android.util.Log;
import android.os.Process;

import androidx.annotation.NonNull;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.galaxyrn.foreground.ForegroundService;
import com.galaxyrn.permissions.PermissionHelper;
import com.facebook.react.ReactInstanceManager;
import com.galaxyrn.logger.GxyLogger;
import com.galaxyrn.logger.GxyLoggerUtils;

public class MainActivity extends ReactActivity {
    private static final String TAG = "MainActivity";

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "GalaxyRN";
    }

    private PermissionHelper permissionHelper;

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(this, getMainComponentName(), false);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);

        permissionHelper = new PermissionHelper(this);

        // Using custom logger instead of Log.d
        GxyLogger.i("MainActivity", "onCreate");
        GxyLoggerUtils.logDeviceInfo("MainActivity");

        getReactInstanceManager().addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
            @Override
            public void onReactContextInitialized(ReactContext context) {
                GxyLogger.i("ReactContext",
                        "Updating PermissionHelper with ReactApplicationContext. Permissions ready: "
                                + permissionHelper.permissionsReady);
                if (!permissionHelper.permissionsReady) {
                    permissionHelper.initModules((ReactApplicationContext) context);
                } else {
                    permissionHelper.sendPermissions();
                }
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        GxyLogger.d(TAG, "onResume");
    }

    @Override
    protected void onPause() {
        super.onPause();
        GxyLogger.d(TAG, "onPause");
    }

    @Override
    protected void onStop() {
        super.onStop();
        GxyLogger.d(TAG, "onStop");
    }

    @Override
    protected void onDestroy() {
        GxyLogger.d(TAG, "onDestroy - ensuring all services are stopped");

        // Abandon audio focus
        try {
            GxyLogger.d(TAG, "Attempting to get ReactContext for audio cleanup");
            ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
            if (reactContext != null) {
                GxyLogger.d(TAG, "ReactContext obtained, abandoning audio focus");
                AudioManager audioManager = (AudioManager) getSystemService(reactContext.AUDIO_SERVICE);
                audioManager.abandonAudioFocus(null);
                GxyLogger.d(TAG, "Audio focus abandoned successfully");
            } else {
                GxyLogger.w(TAG, "ReactContext is null, cannot abandon audio focus");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error stopping audio session", e);
        }

        // Stop any foreground services that might be running
        GxyLogger.d(TAG, "Stopping foreground services");
        stopForegroundServices();

        // Reset volume control stream
        GxyLogger.d(TAG, "Resetting volume control stream to default");
        setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);

        // Emit app termination event
        GxyLogger.d(TAG, "Attempting to emit AppTerminated event");
        if (getReactInstanceManager() != null) {
            ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
            if (reactContext != null) {
                GxyLogger.d(TAG, "Emitting AppTerminated event");
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("AppTerminated",
                        null);
                GxyLogger.d(TAG, "AppTerminated event emitted successfully");
            } else {
                GxyLogger.w(TAG, "ReactContext is null, cannot emit AppTerminated event");
            }
        } else {
            GxyLogger.w(TAG, "ReactInstanceManager is null, cannot emit AppTerminated event");
        }

        GxyLogger.d(TAG, "Calling super.onDestroy()");
        super.onDestroy();
        GxyLogger.d(TAG, "onDestroy completed");
    }

    /**
     * Ensures all foreground services are stopped when the app is destroyed
     */
    private void stopForegroundServices() {
        try {
            GxyLogger.d(TAG, "Manually stopping foreground services");

            // Stop the foreground service
            Intent serviceIntent = new Intent(this, ForegroundService.class);
            boolean stopped = stopService(serviceIntent);
            GxyLogger.d(TAG, "ForegroundService stopped: " + stopped);

        } catch (Exception e) {
            GxyLogger.e(TAG, "Error stopping foreground services", e);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        permissionHelper.handlePermissionResult(requestCode, permissions, grantResults);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (permissionHelper != null) {
            permissionHelper.onActivityResult(requestCode, resultCode, data);
        }
    }
}