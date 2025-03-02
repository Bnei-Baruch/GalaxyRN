

package com.galaxyrn.audio;

import android.app.Activity;
import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.galaxyrn.SendEventToClient;

import java.util.Arrays;
import java.util.Comparator;

public class AudioDeviceModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String REACT_NATIVE_MODULE_NAME = "AudioDeviceModule";
    private static final String TAG = REACT_NATIVE_MODULE_NAME;
    private final ReactApplicationContext context;

    public AudioDeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);

        this.context = reactContext;
    }


    private AudioDeviceManager audioDeviceManager = null;
    AudioFocusManager audioFocusManager = null;

    @NonNull
    @Override
    public String getName() {
        return REACT_NATIVE_MODULE_NAME;
    }


    @Override
    public void initialize() {
        super.initialize();

        SendEventToClient.init(this.context);
        UpdateAudioDeviceCallback callback = () -> updateAudioDevices(null);
        UiThreadUtil.runOnUiThread(() -> {
            audioDeviceManager = new AudioDeviceManager(this.context, callback);
            keepScreenOn();
        });
        audioFocusManager = new AudioFocusManager(this.context);
        audioFocusManager.requestAudioFocus();
    }

    @Override
    public void onHostResume() {
    }

    @Override
    public void onHostPause() {
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy()");
        audioFocusManager.abandonAudioFocus();
        UiThreadUtil.runOnUiThread(() -> {
            audioDeviceManager.stop();
            keepScreenOff();
        });
    }


    private void keepScreenOn() {
        Activity activity = getCurrentActivity();

        if (activity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.");
            return;
        }
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void keepScreenOff() {
        Activity activity = getCurrentActivity();

        if (activity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.");
            return;
        }

        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @ReactMethod
    public void initAudioDevices() {
        updateAudioDevices(null);
    }

    @ReactMethod
    public void updateAudioDevices(Integer deviceId) {
        UiThreadUtil.runOnUiThread(() -> {
            AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));
            AudioDeviceInfo[] devices;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                devices = audioManager.getAvailableCommunicationDevices().toArray(new AudioDeviceInfo[0]);

            } else {
                devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
            }

            WritableMap data = Arguments.createMap();
            AudioDeviceInfo selected = null;

            for (AudioDeviceInfo d : devices) {
                data.putMap(String.valueOf(d.getId()), deviceInfoToResponse(d));

                if (deviceId != null && deviceId == d.getId()) {
                    selected = d;
                }

                Log.d(TAG, "updateAudioDeviceState() devices: " + AudioHelper.getDeviceTypeName(d.getType()));
            }
            if (selected == null) {
                selected = selectDefaultDevice(devices);
            }
            this.setAudioDevice(selected);

            WritableMap selectedResponse = deviceInfoToResponse(selected);
            selectedResponse.putBoolean("active", true);
            data.putMap(String.valueOf(selected.getId()), selectedResponse);

            Log.d(TAG, "updateAudioDeviceState() result " + data);
            SendEventToClient.sendEvent("updateAudioDevice", data);
        });
    }

    private WritableMap deviceInfoToResponse(AudioDeviceInfo deviceInfo) {
        WritableMap map = Arguments.createMap();
        map.putString("name", (String) deviceInfo.getProductName());
        int type = deviceInfo.getType();
        map.putInt("type", type);
        map.putString("typeStr", AudioHelper.getDeviceTypeName(type));
        map.putInt("id", deviceInfo.getId());
        return map;
    }


    public AudioDeviceInfo selectDefaultDevice(AudioDeviceInfo[] devices) {
        Arrays.sort(devices, new Comparator<AudioDeviceInfo>() {
            @Override
            public int compare(AudioDeviceInfo d1, AudioDeviceInfo d2) {
                return Integer.compare(AudioHelper.devicePriorityOrder.indexOf(d1.getType()), AudioHelper.devicePriorityOrder.indexOf(d2.getType()));
            }
        });
        return devices[0];
    }


    private void setAudioDevice(AudioDeviceInfo device) {
        AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.setCommunicationDevice(device);
        } else {
            setAudioDeviceOld();
        }
    }


    private void setAudioDeviceOld() {
        AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));


        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

        audioManager.startBluetoothSco();
        audioManager.setBluetoothScoOn(true);
        audioManager.setSpeakerphoneOn(false);
    }

}

