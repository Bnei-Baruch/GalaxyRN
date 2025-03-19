package com.galaxyrn;

import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.galaxyrn.permissions.PermissionHelper;
import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.webrtc.audio.JavaAudioDeviceModule;

import io.sentry.android.core.SentryAndroid;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "GalaxyRN";
    }

    private PermissionHelper permissionHelper;

    /**
     * Returns the instance of the ReactActivityDelegate.
     * We use DefaultReactActivityDelegate which allows enabling the New Architecture
     * with a single boolean flag fabricEnabled.
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(this, getMainComponentName(), false);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);
        ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();

        Log.d("MainActivity", "onCreate" + reactContext);


        permissionHelper = new PermissionHelper(this);
        permissionHelper.checkPermissions(new PermissionHelper.PermissionCallback() {
            @Override
            public void onAllPermissionsGranted() {
                Toast.makeText(MainActivity.this, "Разрешение на камеру предоставлено", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onPermissionsDenied() {
                Toast.makeText(MainActivity.this, "Разрешение на камеру отклонено", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);
        if (getReactInstanceManager() != null) {
            ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
            if (reactContext != null) {
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("AppTerminated", null);
            }
        }
    }


    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        permissionHelper.handlePermissionsResult(requestCode, grantResults);
    }
}