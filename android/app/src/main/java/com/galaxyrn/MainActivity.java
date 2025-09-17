package com.galaxyrn;

import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;
import android.util.Log;
import android.os.Process;
import android.content.IntentFilter;
import android.content.Context;
import android.view.WindowManager;

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
    private PermissionHelper permissionHelper;
    private static volatile boolean isCleanupInProgress = false;

    private synchronized boolean startCleanup() {
        if (isCleanupInProgress) {
            GxyLogger.w(TAG, "Cleanup already in progress, skipping");
            return false;
        }
        isCleanupInProgress = true;
        return true;
    }

    private void finishCleanup() {
        isCleanupInProgress = false;
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "GalaxyRN";
    }

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
        GxyLogger.i(TAG, "onCreate");
        GxyLoggerUtils.logDeviceInfo(TAG);

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

        if (!startCleanup()) {
            super.onDestroy();
            return;
        }

        try {
            // Clear screen lock flag first
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

            // Reset volume control stream
            setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);

            // Stop foreground services
            stopForegroundServices();

            // Final cleanup log
            GxyLogger.i(TAG, "Activity cleanup completed");

        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during activity cleanup", e);
        } finally {
            finishCleanup();
            super.onDestroy();
            GxyLogger.d(TAG, "onDestroy completed");
        }
    }

    private void stopForegroundServices() {
        try {
            GxyLogger.d(TAG, "Stopping foreground services");

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