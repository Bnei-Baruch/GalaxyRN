package com.galaxyrn.audioManager;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;
import com.galaxyrn.logger.GxyLogger;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxyrn.SendEventToClient;

import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.Comparator;
import android.os.Handler;
import android.os.Looper;
import android.content.res.Configuration;
import android.app.UiModeManager;

import static com.galaxyrn.audioManager.AudioHelper.BUILTIN_EARPIECE_GROUP;
import static com.galaxyrn.audioManager.AudioHelper.BUILTIN_SPEAKER_GROUP;
import static com.galaxyrn.audioManager.AudioHelper.BLUETOOTH_GROUP;

@RequiresApi(api = Build.VERSION_CODES.O)
@ReactModule(name = AudioDeviceModule.NAME)
public class AudioDeviceModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    public static final String NAME = "AudioDeviceModule";
    private static final String REACT_NATIVE_MODULE_NAME = "AudioDeviceModule";
    private static final String TAG = REACT_NATIVE_MODULE_NAME;
    private static final String EVENT_UPDATE_AUDIO_DEVICE = "updateAudioDevice";
    private static final float DEFAULT_VOLUME_LEVEL = 0.8f;

    private final ReactApplicationContext context;
    private AudioDeviceManager audioDeviceManager = null;
    private AudioFocusManager audioFocusManager = null;
    private boolean isInitialized = false;
    private boolean autoInitializeDisabled = true;
    private String prevGroupType = "";

    public AudioDeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        reactContext.addLifecycleEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public void initialize() {
        super.initialize();
        GxyLogger.d(TAG, "initialize");

        if (autoInitializeDisabled) {
            GxyLogger.d(TAG, "Auto-initialization disabled - waiting for permissions");
            return;
        }

        initializeAudioManagersInternal();
    }

    /**
     * Public method to initialize the module after permissions are granted
     * This is called from the ModuleInitializer
     */
    public void initializeAfterPermissions() {
        GxyLogger.d(TAG, "initializeAfterPermissions() called");
        autoInitializeDisabled = false;
        initializeAudioManagersInternal();
    }

    private void initializeAudioManagersInternal() {
        try {
            initializeAudioManagers();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in initializeAudioManagersInternal(): " + e.getMessage(), e);
        }
    }

    private void initializeAudioManagers() {
        UpdateAudioDeviceCallback callback = () -> handleDevicesChange(null);
        UiThreadUtil.runOnUiThread(() -> {
            try {
                audioDeviceManager = new AudioDeviceManager(this.context, callback);
                isInitialized = true;
                autoInitializeDisabled = false; // Enable for future lifecycle events
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error initializing AudioDeviceManager: " + e.getMessage(), e);
            }
        });

        audioFocusManager = new AudioFocusManager(this.context);
    }

    @Override
    public void onHostResume() {
        GxyLogger.d(TAG, "onHostResume()");
    }

    @Override
    public void onHostPause() {
        GxyLogger.d(TAG, "onHostPause()");
    }

    @Override
    public void onHostDestroy() {
        GxyLogger.d(TAG, "onHostDestroy()");
        cleanupResources();
    }

    private void cleanupResources() {
        GxyLogger.d(TAG, "Starting cleanup of audio resources");
        if (!isInitialized) {
            GxyLogger.d(TAG, "Audio managers already initialized");
            return;
        }

        try {
            // First abandon audio focus
            if (audioFocusManager != null) {
                boolean focusAbandoned = audioFocusManager.abandonAudioFocus();
                GxyLogger.d(TAG, "Audio focus abandoned: " + focusAbandoned);
            }

            // Then stop the device manager on UI thread
            UiThreadUtil.runOnUiThread(() -> {
                try {
                    if (audioDeviceManager != null) {
                        audioDeviceManager.stop();
                        audioDeviceManager = null;
                        GxyLogger.d(TAG, "AudioDeviceManager stopped and nullified");
                    }
                } catch (Exception e) {
                    GxyLogger.e(TAG, "Error stopping AudioDeviceManager: " + e.getMessage(), e);
                }
            });

            isInitialized = false;
            GxyLogger.d(TAG, "Audio resources cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in cleanupResources(): " + e.getMessage(), e);
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
        AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));
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
