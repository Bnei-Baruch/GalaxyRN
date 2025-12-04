package com.galaxy_mobile.audioManager;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import com.galaxy_mobile.logger.GxyLogger;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.SendEventToClient;

import java.util.Arrays;

import static com.galaxy_mobile.audioManager.AudioHelper.BUILTIN_EARPIECE_GROUP;
import static com.galaxy_mobile.audioManager.AudioHelper.BUILTIN_SPEAKER_GROUP;
import static com.galaxy_mobile.audioManager.AudioHelper.BLUETOOTH_GROUP;

@ReactModule(name = AudioDeviceModule.NAME)
public class AudioDeviceModule extends ReactContextBaseJavaModule {
    public static final String NAME = "AudioDeviceModule";
    private static final String REACT_NATIVE_MODULE_NAME = "AudioDeviceModule";
    private static final String TAG = REACT_NATIVE_MODULE_NAME;
    private static final String EVENT_UPDATE_AUDIO_DEVICE = "updateAudioDevice";

    private final ReactApplicationContext reactContext;
    private AudioDeviceManager audioDeviceManager = null;
    private AudioFocusManager audioFocusManager = null;
    private String prevGroupType = "";


    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
    public AudioDeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "initializeAfterPermissions() called");

        UpdateAudioDeviceCallback callback = () -> handleDevicesChange(null);
        UiThreadUtil.runOnUiThread(() -> {
            try {
                audioDeviceManager = new AudioDeviceManager(this.reactContext, callback);
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error initializing AudioDeviceManager: " + e.getMessage(), e);
            }
        });

        audioFocusManager = new AudioFocusManager(this.reactContext);
    }

    public void cleanup() {
        try {
            audioDeviceManager.cleanup();
            audioFocusManager.cleanup();
            GxyLogger.d(TAG, "Audio cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in cleanup(): " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void requestAudioFocus() {
        GxyLogger.d(TAG, "requestAudioFocus()");
        try {
            if (audioFocusManager != null) {
                audioFocusManager.requestAudioFocus();
            }
            processAudioDevices(null, false);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error requesting audio focus: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void abandonAudioFocus() {
        GxyLogger.d(TAG, "abandonAudioFocus()");
        try {
            if (audioFocusManager != null) {
                audioFocusManager.abandonAudioFocus();
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error abandoning audio focus: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void initAudioDevices() {
        GxyLogger.d(TAG, "initAudioDevices() on thread: " + Thread.currentThread().getName());
        processAudioDevices(null, true);
    }

    @ReactMethod
    public void handleDevicesChange(Integer deviceId) {
        GxyLogger.d(TAG,
                "handleDevicesChange() deviceId: " + deviceId + " on thread: " + Thread.currentThread().getName());
        processAudioDevices(deviceId, false);
    }

    private void processAudioDevices(Integer deviceId, boolean isInitialize) {
        GxyLogger.d(TAG, "processAudioDevices() deviceId: " + deviceId);
        try {
            AudioManager audioManager = getAudioManager();
            if (audioManager == null)
                return;

            AudioDeviceInfo[] devices = getAvailableAudioDevices(audioManager);
            if (devices == null || devices.length == 0) {
                GxyLogger.w(TAG, "No audio devices found");
                return;
            }

            AudioDeviceInfo selectedDevice = null;
            if (deviceId != null) {
                selectedDevice = findDeviceById(devices, deviceId);
            }

            AudioDeviceGroup selectedGroup;

            // If no device found by ID, select default
            if (selectedDevice == null) {
                selectedGroup = selectDefaultGroup(devices);
                // If the previous group type is Bluetooth, select the built-in earpiece group
                if (prevGroupType.equals(BLUETOOTH_GROUP.getType())
                        && selectedGroup.getType().equals(BUILTIN_SPEAKER_GROUP.getType())) {
                    selectedGroup = BUILTIN_EARPIECE_GROUP;
                } else if (selectedGroup.getType().equals(BUILTIN_EARPIECE_GROUP.getType())
                        && isInitialize) {
                    // If the default device is a built-in earpiece and the module is initialized,
                    // select the speaker
                    selectedGroup = BUILTIN_SPEAKER_GROUP;
                }
                GxyLogger.d(TAG, "Selected default group: " + selectedGroup.getType());

                selectedDevice = AudioHelper.getDeviceByGroup(devices, selectedGroup);

                GxyLogger.d(TAG, "Selected default device: " + selectedDevice);
            } else {
                GxyLogger.d(TAG, "Selected device by id: " + selectedDevice);
                selectedGroup = AudioHelper.getGroupByDeviceType(selectedDevice.getType());
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AudioDeviceInfo currentDevice = getAudioManager().getCommunicationDevice();
                if (currentDevice == null || selectedDevice.getId() != currentDevice.getId()) {
                    setAudioDevice(selectedDevice);
                }
            } else {
                setAudioDevice(selectedDevice);
            }

            WritableMap data = Arguments.createMap();
            for (AudioDeviceInfo device : devices) {
                AudioDeviceGroup group = AudioHelper.getGroupByDeviceType(device.getType());
                WritableMap deviceMap = Arguments.createMap();
                deviceMap.putString("type", group.getType());
                deviceMap.putString("priority", String.valueOf(group.getPriority()));
                deviceMap.putInt("id", device.getId());
                deviceMap.putBoolean("active", device.getId() == selectedDevice.getId());
                data.putMap(group.getType(), deviceMap);
                GxyLogger.d(TAG, "Device type: " + device.getType());
            }

            GxyLogger.d(TAG, "sendDeviceUpdateToClient() result: " + data);
            prevGroupType = selectedGroup.getType();
            GxyLogger.d(TAG, "prevGroupType updated: " + prevGroupType);

            try {
                SendEventToClient.sendEvent(EVENT_UPDATE_AUDIO_DEVICE, data);
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error sending event to client: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error processing audio devices: " + e.getMessage(), e);
        }
    }

    private AudioManager getAudioManager() {
        AudioManager audioManager = ((AudioManager) this.reactContext.getSystemService(Context.AUDIO_SERVICE));
        if (audioManager == null) {
            GxyLogger.e(TAG, "Could not get AudioManager service");
        }
        return audioManager;
    }

    private AudioDeviceInfo[] getAvailableAudioDevices(AudioManager audioManager) {
        AudioDeviceInfo[] result = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            result = audioManager.getAvailableCommunicationDevices().toArray(new AudioDeviceInfo[0]);
        } else {
            result = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
        }
        return Arrays.stream(result)
                .filter(device -> device.getType() != AudioDeviceInfo.TYPE_TELEPHONY)
                .toArray(AudioDeviceInfo[]::new);
    }

    private AudioDeviceGroup selectDefaultGroup(AudioDeviceInfo[] devices) {
        AudioDeviceGroup result = BUILTIN_EARPIECE_GROUP;
        try {
            for (AudioDeviceInfo device : devices) {
                AudioDeviceGroup group = AudioHelper.getGroupByDeviceType(device.getType());
                if (group.getPriority() > result.getPriority()) {
                    result = group;
                }
            }
            if (!result.getType().equals(BLUETOOTH_GROUP.getType())) {
                return result;
            }

            return result;
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error selecting default group: " + e.getMessage(), e);
            return BUILTIN_EARPIECE_GROUP;
        }
    }

    private AudioDeviceInfo findDeviceById(AudioDeviceInfo[] devices, Integer deviceId) {
        AudioDeviceInfo selected = null;
        if (deviceId != null) {
            for (AudioDeviceInfo device : devices) {
                if (deviceId == device.getId()) {
                    selected = device;
                    break;
                }
            }
        }

        return selected;
    }

    private AudioDeviceInfo findDeviceByType(AudioDeviceInfo[] devices, int deviceType) {
        for (AudioDeviceInfo device : devices) {
            if (device.getType() == deviceType) {
                return device;
            }
        }
        return null;
    }

    private void setAudioDevice(AudioDeviceInfo device) {
        try {
            GxyLogger.d(TAG, "setAudioDevice() device: " + device);
            if (device == null) {
                GxyLogger.e(TAG, "Cannot set null audio device");
                return;
            }

            AudioManager audioManager = getAudioManager();
            if (audioManager == null)
                return;

            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                audioManager.setCommunicationDevice(device);
            } else {
                setAudioDeviceOld(audioManager, device);
            }
            GxyLogger.d(TAG, "setAudioDevice() after setCommunicationDevice()");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error setting audio device: " + e.getMessage(), e);
        }
    }

    private void setAudioDeviceOld(AudioManager audioManager, AudioDeviceInfo device) {
        try {
            AudioDeviceGroup group = AudioHelper.getGroupByDeviceType(device.getType());
            GxyLogger.d(TAG, "setAudioDeviceOld() device group: " + group.getType());

            if (group.getType().equals(BLUETOOTH_GROUP.getType())) {
                GxyLogger.d(TAG, "Setting audio to Bluetooth");
                audioManager.startBluetoothSco();
                audioManager.setBluetoothScoOn(true);
                audioManager.setSpeakerphoneOn(false);
            } else if (group.getType().equals(BUILTIN_SPEAKER_GROUP.getType())) {
                GxyLogger.d(TAG, "Setting audio to Speaker");
                audioManager.stopBluetoothSco();
                audioManager.setBluetoothScoOn(false);
                audioManager.setSpeakerphoneOn(true);
            } else { // Earpiece, wired headset etc.
                GxyLogger.d(TAG, "Setting audio to Earpiece/other");
                audioManager.stopBluetoothSco();
                audioManager.setBluetoothScoOn(false);
                audioManager.setSpeakerphoneOn(false);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in setAudioDeviceOld: " + e.getMessage(), e);
        }
    }
}
