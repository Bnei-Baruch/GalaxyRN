package com.galaxyrn;

import android.content.Context;
import android.media.AudioManager;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.logging.Logger;

class SwitchAudioDeviceModule extends ReactContextBaseJavaModule {
    SwitchAudioDeviceModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "SwitchAudioDeviceModule";
    }

    @ReactMethod
    public void switchDevice(String device) {
        Log.i("SwitchAudioDeviceModule", "switchDevice new device: " + device);
        var manager = new AudioOutputManager(getReactApplicationContext());
        switch (device) {
            case "headset":
                manager.switchToHeadset();
                break;
            case "bluetooth":
                manager.switchToBluetooth();
                break;
            default:
                manager.switchToSpeaker();
        }
    }
}