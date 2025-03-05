package com.galaxyrn;

import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.webrtc.audio.JavaAudioDeviceModule;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "GalaxyRN";
    }

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
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
        //options.enableMediaProjectionService = true;
        ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();

        Log.d("MainActivity", "onCreate" + reactContext);
        /*if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {

            int legacyStreamType = AudioManager.STREAM_MUSIC;
            //int contentType = AudioAttributes.CONTENT_TYPE_MOVIE;
            int contentType = AudioAttributes.CONTENT_TYPE_MUSIC;
            int usage = AudioAttributes.USAGE_MEDIA;
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(usage)
                    .setContentType(contentType)
                    .setLegacyStreamType(legacyStreamType)
                    .build();
            options.audioDeviceModule = JavaAudioDeviceModule.builder(reactContext)
                    .setEnableVolumeLogger(false)
                    .setAudioAttributes(audioAttributes)
                    .createAudioDeviceModule();
        }*/


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
}