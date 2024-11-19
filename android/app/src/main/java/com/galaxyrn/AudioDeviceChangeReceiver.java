package com.galaxyrn;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AudioDeviceChangeReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {

        Log.i("GalaxyRN custom: AudioDeviceChangeReceiver", "onReceive devices start" + intent.getAction());
        ReactApplicationContext reactContext = (ReactApplicationContext) context.getApplicationContext();


        var audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        var devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
        Log.i("GalaxyRN custom: AudioDeviceChangeReceiver", "onReceive devices = " + devices.toString());
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("AudioOutputDevicesChanged", devices);
    }
}