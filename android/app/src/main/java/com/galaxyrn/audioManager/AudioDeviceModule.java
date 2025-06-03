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
import com.facebook.react.module.annotations.ReactModule;
import com.galaxyrn.SendEventToClient;

import java.util.Arrays;
import java.util.Comparator;

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
    private boolean autoInitializeDisabled = true; // Disable auto-initialization

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
        Log.d(TAG, "initialize");
        
        if (autoInitializeDisabled) {
            Log.d(TAG, "Auto-initialization disabled - waiting for permissions");
            return;
        }
        
        initializeAudioManagersInternal();
    }
    
    /**
     * Public method to initialize the module after permissions are granted
     * This is called from the ModuleInitializer
     */
    public void initializeAfterPermissions() {
        Log.d(TAG, "initializeAfterPermissions() called");
        autoInitializeDisabled = false;
        initializeAudioManagersInternal();
    }
    
    private void initializeAudioManagersInternal() {
        try {
            initializeAudioManagers();
        } catch (Exception e) {
            Log.e(TAG, "Error in initializeAudioManagersInternal(): " + e.getMessage(), e);
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
                Log.e(TAG, "Error initializing AudioDeviceManager: " + e.getMessage(), e);
            }
        });
        
        audioFocusManager = new AudioFocusManager(this.context);
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
        cleanupResources();
    }
    
    private void cleanupResources() {
        try {
            if (audioFocusManager != null) {
                audioFocusManager.abandonAudioFocus();
            }
            
            UiThreadUtil.runOnUiThread(() -> {
                try {
                    if (audioDeviceManager != null) {
                        audioDeviceManager.stop();
                        audioDeviceManager = null;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error stopping AudioDeviceManager: " + e.getMessage(), e);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error in cleanupResources(): " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void requestAudioFocus() {
        Log.d(TAG, "requestAudioFocus()");
        try {
            if (audioFocusManager != null) {
                audioFocusManager.requestAudioFocus();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error requesting audio focus: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void abandonAudioFocus() {
        Log.d(TAG, "abandonAudioFocus()");
        try {
            if (audioFocusManager != null) {
                audioFocusManager.abandonAudioFocus();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error abandoning audio focus: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void initAudioDevices() {
        Log.d(TAG, "initAudioDevices()");
        UiThreadUtil.runOnUiThread(() -> processAudioDevicesOnUiThread(null, true));
    }

    @ReactMethod
    public void handleDevicesChange(Integer deviceId) {
        Log.d(TAG, "handleDevicesChange() deviceId: " + deviceId);
        UiThreadUtil.runOnUiThread(() -> processAudioDevicesOnUiThread(deviceId, false));
    }
    
    private void processAudioDevicesOnUiThread(Integer deviceId, boolean isInitialized) {
        Log.d(TAG, "processAudioDevicesOnUiThread() deviceId: " + deviceId);
        try {
            AudioManager audioManager = getAudioManager();
            if (audioManager == null) return;

            AudioDeviceInfo[] devices = getAvailableAudioDevices(audioManager);
            if (devices == null || devices.length == 0) {
                Log.w(TAG, "No audio devices found");
                return;
            }

        
            
            AudioDeviceInfo selectedDevice = findDeviceById(devices, deviceId);

            // If no device found by ID, select default
            if (selectedDevice == null) {
                selectedDevice = selectDefaultDevice(devices);
                // If the default device is a built-in earpiece and the module is initialized, select the speaker
                if (selectedDevice.getType() == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE && isInitialized) {
                    AudioDeviceInfo speaker = findDeviceByType(devices, AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);
                    if (speaker != null) {
                        selectedDevice = speaker;
                    }
                }
                Log.d(TAG, "Selected default device: " + selectedDevice);
            } else {
                Log.d(TAG, "Selected device by id: " + selectedDevice); 
            }
            
            // Map all devices to the response
            WritableMap data = Arguments.createMap();
            for (AudioDeviceInfo device : devices) {
                data.putMap(String.valueOf(device.getId()), deviceInfoToResponse(device));
                Log.d(TAG, "Device type: " + device.getType());
            }
            
            if (selectedDevice != null) {
                setAudioDevice(selectedDevice);
                
                WritableMap selectedResponse = deviceInfoToResponse(selectedDevice);
                selectedResponse.putBoolean("active", true);
                data.putMap(String.valueOf(selectedDevice.getId()), selectedResponse);
                
                sendDeviceUpdateToClient(data);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing audio devices: " + e.getMessage(), e);
        }
    }
    
    private AudioManager getAudioManager() {
        AudioManager audioManager = ((AudioManager) this.context.getSystemService(Context.AUDIO_SERVICE));
        if (audioManager == null) {
            Log.e(TAG, "Could not get AudioManager service");
        }
        return audioManager;
    }
    
    private AudioDeviceInfo[] getAvailableAudioDevices(AudioManager audioManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return audioManager.getAvailableCommunicationDevices().toArray(new AudioDeviceInfo[0]);
        } else {
            return audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
        }
    }
    
    
    private void sendDeviceUpdateToClient(WritableMap data) {
        Log.d(TAG, "sendDeviceUpdateToClient() result: " + data);
        try {
            SendEventToClient.sendEvent(EVENT_UPDATE_AUDIO_DEVICE, data);
        } catch (Exception e) {
            Log.e(TAG, "Error sending event to client: " + e.getMessage(), e);
        }
    }

    private WritableMap deviceInfoToResponse(AudioDeviceInfo deviceInfo) {
        try {
            WritableMap map = Arguments.createMap();
            map.putInt("type", deviceInfo.getType());
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

    private AudioDeviceInfo findDeviceById(AudioDeviceInfo[] devices, Integer deviceId) {
        // Find device by ID if specified
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
            Log.d(TAG, "setAudioDevice() device: " + device);
            if (device == null) {
                Log.e(TAG, "Cannot set null audio device");
                return;
            }

            AudioManager audioManager = getAudioManager();
            if (audioManager == null) return;

            configureAudioManager(audioManager);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                audioManager.setCommunicationDevice(device);
            } else {
                setAudioDeviceOld(audioManager);
            }
            Log.d(TAG, "setAudioDevice() after setCommunicationDevice()");
        } catch (Exception e) {
            Log.e(TAG, "Error setting audio device: " + e.getMessage(), e);
        }
    }
    
    private void configureAudioManager(AudioManager audioManager) {
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        adjustVolumeIfNeeded(audioManager);
    }
    
    private void adjustVolumeIfNeeded(AudioManager audioManager) {
        int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL);
        int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_VOICE_CALL);
        
        if (currentVolume < maxVolume * DEFAULT_VOLUME_LEVEL) {
            audioManager.setStreamVolume(
                AudioManager.STREAM_VOICE_CALL, 
                (int) (maxVolume * DEFAULT_VOLUME_LEVEL), 
                0
            );
        }
    }

    private void setAudioDeviceOld(AudioManager audioManager) {
        try {
            audioManager.startBluetoothSco();
            audioManager.setBluetoothScoOn(true);
            audioManager.setSpeakerphoneOn(false);
        } catch (Exception e) {
            Log.e(TAG, "Error in setAudioDeviceOld: " + e.getMessage(), e);
        }
    }
}
