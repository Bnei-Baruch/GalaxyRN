package com.galaxy_mobile;

import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;

import androidx.annotation.NonNull;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.galaxy_mobile.permissions.PermissionHelper;
import com.facebook.react.ReactInstanceManager;
import com.galaxy_mobile.logger.GxyLogger;
import com.galaxy_mobile.logger.GxyLoggerUtils;

public class MainActivity extends ReactActivity {
    private static final String TAG = "MainActivity";
    private PermissionHelper permissionHelper;

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
        return new DefaultReactActivityDelegate(this, getMainComponentName(),
                DefaultNewArchitectureEntryPoint.getFabricEnabled());
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);

        permissionHelper = new PermissionHelper(this);

        GxyLogger.i(TAG, "onCreate");
        GxyLoggerUtils.logDeviceInfo(TAG);

        ReactApplication reactApplication = (ReactApplication) getApplication();
        ReactHost reactHost = reactApplication.getReactHost();

        GxyLogger.d(TAG, "onCreate: reactHost: " + Boolean.toString(reactHost == null));

        if (reactHost != null) {
            reactHost.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                @Override
                public void onReactContextInitialized(ReactContext context) {
                    GxyLogger.i(TAG, "Updating Permissions ready");
                    if (!permissionHelper.permissionsReady) {
                        permissionHelper.initModules((ReactApplicationContext) context);
                    } else {
                        permissionHelper.sendPermissions();
                    }
                }
            });
        } else {
            GxyLogger.w(TAG, "ReactHost is null, cannot get ReactInstanceManager");
        }
    }

    @Override
    protected void onDestroy() {
        GxyLogger.d(TAG, "onDestroy");
        super.onDestroy();

        MainApplication.performCleanup();

        try {
            setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);
            GxyLogger.i(TAG, "Activity cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during activity cleanup", e);
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

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        try {
            super.onWindowFocusChanged(hasFocus);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in onWindowFocusChanged", e);
        }
    }
}