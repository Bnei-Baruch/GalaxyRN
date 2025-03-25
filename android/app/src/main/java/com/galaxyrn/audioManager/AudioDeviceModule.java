package com.galaxyrn.audioManager;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

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

@RequiresApi(api = Build.VERSION_CODES.O)
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
        Log.d(TAG, "initialize");
        try {
            SendEventToClient.init(this.context);
            UpdateAudioDeviceCallback callback = () -> updateAudioDevices(null);
            UiThreadUtil.runOnUiThread(() -> {
                try {
                    audioDeviceManager = new AudioDeviceManager(this.context, callback);
                    // getCurrentActivity().setVolumeControlStream(AudioManager.STREAM_MUSIC);
                } catch (Exception e) {
                    Log.e(TAG, "Error initializing AudioDeviceManager: " + e.getMessage(), e);
                }
            });
            audioFocusManager = new AudioFocusManager(this.context);
        } catch (Exception e) {
            Log.e(TAG, "Error in initialize(): " + e.getMessage(), e);
        }
    }

    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume()");
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause()");
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy()");
        try {
            audioFocusManager.abandonAudioFocus();
            UiThreadUtil.runOnUiThread(() -> {
                try {
                    if (audioDeviceManager != null) {
                        audioDeviceManager.stop();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error stopping AudioDeviceManager: " + e.getMessage(), e);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error in onHostDestroy(): " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void requestAudioFocus() {
        Log.d(TAG, "onEnterRoom()");
        try {
            audioFocusManager.requestAudioFocus();
        } catch (Exception e) {
            Log.e(TAG, "Error requesting audio focus: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void abandonAudioFocus() {
        Log.d(TAG, "onLeaveRoom()");
        try {
            audioFocusManager.abandonAudioFocus();
        } catch (Exception e) {
            Log.e(TAG, "Error abandoning audio focus: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void initAudioDevices() {
        updateAudioDevices(null);
    }

    @ReactMethod
    public void updateAudioDevices(Integer deviceId) {
        Log.d(TAG, "updateAudioDevices() deviceId: " + deviceId);
        UiThreadUtil.runOnUiThread(() -> {

            Log.d(TAG, "updateAudioDevices() UiThreadUtil.runOnUiThread deviceId: " + deviceId);
            try {
                AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));
                if (audioManager == null) {
                    Log.e(TAG, "Could not get AudioManager service");
                    return;
                }

                AudioDeviceInfo[] devices;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    devices = audioManager.getAvailableCommunicationDevices().toArray(new AudioDeviceInfo[0]);
                } else {
                    devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                }

                if (devices.length == 0) {
                    Log.w(TAG, "No audio devices found");
                    return;
                }

                WritableMap data = Arguments.createMap();
                AudioDeviceInfo selected = null;

                for (AudioDeviceInfo d : devices) {
                    data.putMap(String.valueOf(d.getId()), deviceInfoToResponse(d));

                    if (deviceId != null && deviceId == d.getId()) {
                        selected = d;
                    }

                    Log.d(TAG, "updateAudioDeviceState() devices d.getType() " + d.getType());
                }
                Log.d(TAG, "updateAudioDeviceState() selected by id: " + selected);
                if (selected == null) {
                    selected = selectDefaultDevice(devices);
                    Log.d(TAG, "updateAudioDeviceState() selectDefaultDevice: " + selected);
                }
                setAudioDevice(selected);

                WritableMap selectedResponse = deviceInfoToResponse(selected);
                selectedResponse.putBoolean("active", true);
                data.putMap(String.valueOf(selected.getId()), selectedResponse);

                Log.d(TAG, "updateAudioDeviceState() result " + data);
                try {
                    SendEventToClient.sendEvent("updateAudioDevice", data);
                } catch (Exception e) {
                    Log.e(TAG, "Error sending event to client: " + e.getMessage(), e);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error updating audio devices: " + e.getMessage(), e);
            }
        });
    }

    private WritableMap deviceInfoToResponse(AudioDeviceInfo deviceInfo) {
        try {
            WritableMap map = Arguments.createMap();
            int type = deviceInfo.getType();
            map.putInt("type", type);
            map.putInt("id", deviceInfo.getId());
            return map;
        } catch (Exception e) {
            Log.e(TAG, "Error creating device info response: " + e.getMessage(), e);
            return Arguments.createMap();
        }
    }

    public AudioDeviceInfo selectDefaultDevice(AudioDeviceInfo[] devices) {
        try {
            Arrays.sort(devices, new Comparator<AudioDeviceInfo>() {
                @Override
                public int compare(AudioDeviceInfo d1, AudioDeviceInfo d2) {
                    return Integer.compare(AudioHelper.devicePriorityOrder.indexOf(d1.getType()),
                            AudioHelper.devicePriorityOrder.indexOf(d2.getType()));
                }
            });
            return devices[0];
        } catch (Exception e) {
            Log.e(TAG, "Error selecting default device: " + e.getMessage(), e);
            return devices.length > 0 ? devices[0] : null;
        }
    }

    private void setAudioDevice(AudioDeviceInfo device) {
        try {
            Log.d(TAG, "setAudioDevice() device: " + device);
            if (device == null) {
                Log.e(TAG, "Cannot set null audio device");
                return;
            }

            AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));
            if (audioManager == null) {
                Log.e(TAG, "Could not get AudioManager service");
                return;
            }
            Log.d(TAG, "Build.VERSION.SDK_INT, Build.VERSION_CODES.S " + Build.VERSION.SDK_INT + " "
                    + Build.VERSION_CODES.S);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                audioManager.setCommunicationDevice(device);
            } else {
                setAudioDeviceOld();
            }
            Log.d(TAG, "setAudioDevice() after setCommunicationDevice()");
        } catch (Exception e) {
            Log.e(TAG, "Error setting audio device: " + e.getMessage(), e);
        }
    }

    private void setAudioDeviceOld() {
        try {
            AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));
            if (audioManager == null) {
                Log.e(TAG, "Could not get AudioManager service");
                return;
            }

            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

            audioManager.startBluetoothSco();
            audioManager.setBluetoothScoOn(true);
            audioManager.setSpeakerphoneOn(false);
        } catch (Exception e) {
            Log.e(TAG, "Error setting audio device (old method): " + e.getMessage(), e);
        }
    }
}
