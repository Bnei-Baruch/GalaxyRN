package com.galaxyrn;

import android.content.Intent;
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
import com.galaxyrn.foreground.ForegroundService;
import com.galaxyrn.permissions.PermissionHelper;

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
        
        Log.d(TAG, "onCreate");
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "onResume");
        permissionHelper.sendPermissions();
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "onPause");
    }
    
    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "onStop");
    }

    @Override
    protected void onDestroy() {
        Log.d(TAG, "onDestroy - ensuring all services are stopped");
        
        // Stop any foreground services that might be running
        stopForegroundServices();
        
        setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);
        if (getReactInstanceManager() != null) {
            ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
            if (reactContext != null) {
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("AppTerminated",
                        null);
            }
        }
        
        super.onDestroy();
    }
    
    /**
     * Ensures all foreground services are stopped when the app is destroyed
     */
    private void stopForegroundServices() {
        try {
            Log.d(TAG, "Manually stopping foreground services");
            
            // Stop the foreground service
            Intent serviceIntent = new Intent(this, ForegroundService.class);
            boolean stopped = stopService(serviceIntent);
            Log.d(TAG, "ForegroundService stopped: " + stopped);
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping foreground services", e);
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