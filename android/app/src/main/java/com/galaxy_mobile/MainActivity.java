package com.galaxy_mobile;

import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.NonNull;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.galaxy_mobile.logger.GxyLogger;
import com.galaxy_mobile.logger.GxyLoggerUtils;
import com.galaxy_mobile.permissions.PermissionHelper;
import com.galaxy_mobile.SendEventToClient;
import com.oney.WebRTCModule.WebRTCModuleOptions;
import com.galaxy_mobile.uiState.GxyUIStateModule;


import org.webrtc.audio.JavaAudioDeviceModule;

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
        return new DefaultReactActivityDelegate(this, getMainComponentName(), false);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);

        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
        options.audioDeviceModule = JavaAudioDeviceModule.builder(this)
                .setAudioAttributes(audioAttributes)
                .createAudioDeviceModule();

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
    public void onUserLeaveHint() {
        GxyLogger.d(TAG, "onUserLeaveHint");
        if (GxyUIStateModule.isInRoom) {
            enterPictureInPictureMode();
        }
        super.onUserLeaveHint();
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
        WritableMap data = Arguments.createMap();
        data.putBoolean("active", isInPictureInPictureMode);
        SendEventToClient.sendEvent("isInPIPMode", data);
        if (isInPictureInPictureMode) {
            GxyUIStateModule.startForegroundService(this);
        }
    }

    @Override
    protected void onDestroy() {
        GxyLogger.d(TAG, "onDestroy - ensuring all services are stopped");
        super.onDestroy();

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
}