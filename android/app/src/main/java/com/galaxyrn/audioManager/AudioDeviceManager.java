package com.galaxyrn.audioManager;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothHeadset;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.galaxyrn.logger.GxyLogger;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Arrays;

public class AudioDeviceManager {
    private static final String TAG = AudioDeviceManager.class.getSimpleName();

    // Bluetooth related constants
    private static final int BLUETOOTH_SCO_TIMEOUT_MS = 1000;

    private BroadcastReceiver receiver;
    private final ReactApplicationContext reactContext;
    private final UpdateAudioDeviceCallback callback;
    private AudioDeviceCallback audioCallback;
    private AudioManager audioManager;
    private final Handler handler;

    private boolean isContextReady() {
        return reactContext != null && reactContext.hasActiveCatalystInstance();
    }

    public AudioDeviceManager(ReactApplicationContext context, UpdateAudioDeviceCallback callback) {
        this.reactContext = context;
        this.callback = callback;
        this.handler = new Handler(Looper.getMainLooper());

        if (!isContextReady()) {
            GxyLogger.w(TAG, "React context not ready, waiting for initialization");
            handler.postDelayed(() -> {
                if (isContextReady()) {
                    GxyLogger.d(TAG, "React context ready, initializing audio manager");
                    initializeAudioManager();
                } else {
                    GxyLogger.e(TAG, "React context still not ready after delay");
                }
            }, 1000);
            return;
        }

        initializeAudioManager();
    }

    private void initializeAudioManager() {
        GxyLogger.d(TAG, "Initializing AudioDeviceManager");
        try {
            // Check if already initialized
            if (audioManager != null) {
                GxyLogger.w(TAG, "AudioDeviceManager already initialized");
                return;
            }

            // Initialize audio manager
            audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) {
                GxyLogger.e(TAG, "Failed to get AudioManager service");
                return;
            }

            // Initialize audio callback
            audioCallback = createAudioDeviceCallback();
            registerAudioDeviceCallback();

            // Initialize broadcast receiver
            receiver = createBroadcastReceiver();
            registerBroadcastReceiver();

            GxyLogger.d(TAG, "AudioDeviceManager initialized successfully");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to initialize AudioDeviceManager", e);
            // Cleanup in case of partial initialization
            stop();
        }
    }

    private AudioDeviceCallback createAudioDeviceCallback() {
        return new AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(AudioDeviceInfo[] addedDevices) {
                GxyLogger.d(TAG, "onAudioDevicesAdded() addedDevices: " + Arrays.toString(addedDevices));
                notifyDeviceStateChanged();
            }

            @Override
            public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                GxyLogger.d(TAG, "onAudioDevicesRemoved() removedDevices: " + Arrays.toString(removedDevices));
                notifyDeviceStateChanged();
            }
        };
    }

    private void registerAudioDeviceCallback() {
        try {
            if (audioManager != null && audioCallback != null) {
                audioManager.registerAudioDeviceCallback(audioCallback, handler);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to register audio device callback", e);
        }
    }

    private BroadcastReceiver createBroadcastReceiver() {
        return new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                try {
                    String action = intent.getAction();
                    GxyLogger.d(TAG, "onReceive() action: " + action);

                    if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
                        handleBluetoothStateChange(intent);
                    } else if (BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                        handleBluetoothConnectionStateChange(intent);
                    }

                    notifyDeviceStateChanged();
                } catch (Exception e) {
                    GxyLogger.e(TAG, "Exception in onReceive", e);
                }
            }
        };
    }

    private void notifyDeviceStateChanged() {
        GxyLogger.d(TAG, "notifyDeviceStateChanged()");

        if (callback != null && reactContext != null && reactContext.hasActiveCatalystInstance()) {
            callback.onUpdateAudioDeviceState();
            GxyLogger.d(TAG, "Callback executed successfully");
        } else {
            GxyLogger.w(TAG, "Cannot notify device state change. Conditions: callback=" +
                    callback + ", reactContext=" + reactContext +
                    ", hasActiveCatalystInstance="
                    + (reactContext != null ? reactContext.hasActiveCatalystInstance() : "null"));
        }
    }

    private void handleBluetoothStateChange(Intent intent) {
        int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
        if (state == BluetoothAdapter.STATE_ON) {
            enableBluetoothSco();
        } else if (state == BluetoothAdapter.STATE_OFF) {
            disableBluetoothSco();
        }
    }

    private void handleBluetoothConnectionStateChange(Intent intent) {
        int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
        if (state == BluetoothAdapter.STATE_CONNECTED) {
            enableBluetoothSco();
        } else if (state == BluetoothAdapter.STATE_DISCONNECTED) {
            disableBluetoothSco();
        }
    }

    private void enableBluetoothSco() {
        try {
            if (audioManager != null) {
                audioManager.startBluetoothSco();
                audioManager.setBluetoothScoOn(true);

                // Add a delayed check to ensure SCO is started
                handler.postDelayed(() -> {
                    try {
                        if (audioManager != null && !audioManager.isBluetoothScoOn()) {
                            audioManager.startBluetoothSco();
                        }
                    } catch (Exception e) {
                        GxyLogger.e(TAG, "Failed in delayed SCO check", e);
                    }
                }, BLUETOOTH_SCO_TIMEOUT_MS);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to start Bluetooth SCO", e);
        }
    }

    private void disableBluetoothSco() {
        try {
            if (audioManager != null) {
                audioManager.stopBluetoothSco();
                audioManager.setBluetoothScoOn(false);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to stop Bluetooth SCO", e);
        }
    }

    private void registerBroadcastReceiver() {
        if (reactContext == null || receiver == null) {
            GxyLogger.d(TAG, "Cannot register receiver - context or receiver is null");
            return;
        }

        try {
            IntentFilter filter = createIntentFilter();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                reactContext.registerReceiver(receiver, filter);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to register receiver", e);
        }
    }

    private IntentFilter createIntentFilter() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        filter.addAction(AudioManager.ACTION_HEADSET_PLUG);
        filter.addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED);
        filter.addAction(BluetoothHeadset.ACTION_AUDIO_STATE_CHANGED);
        filter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);
        filter.addAction(BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED);
        return filter;
    }

    public void stop() {
        GxyLogger.d(TAG, "Stopping AudioDeviceManager");
        try {
            // First disable Bluetooth SCO to prevent audio routing issues
            disableBluetoothSco();

            // Then unregister callbacks to prevent unwanted events
            unregisterAudioDeviceCallback();
            unregisterBroadcastReceiver();

            // Reset audio mode to normal
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_NORMAL);
            }

            // Clear references
            audioCallback = null;
            receiver = null;
            audioManager = null;

            GxyLogger.d(TAG, "AudioDeviceManager stopped successfully");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during AudioDeviceManager stop", e);
        }
    }

    private void unregisterBroadcastReceiver() {
        try {
            if (receiver != null && reactContext != null) {
                reactContext.unregisterReceiver(receiver);
                GxyLogger.d(TAG, "Broadcast receiver unregistered");
            }
        } catch (IllegalArgumentException e) {
            // Receiver not registered, this is fine
            GxyLogger.d(TAG, "Broadcast receiver was not registered");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to unregister receiver", e);
        }
    }

    private void unregisterAudioDeviceCallback() {
        try {
            if (audioCallback != null && audioManager != null) {
                audioManager.unregisterAudioDeviceCallback(audioCallback);
                GxyLogger.d(TAG, "Audio device callback unregistered");
            }
        } catch (IllegalArgumentException e) {
            // Callback not registered, this is fine
            GxyLogger.d(TAG, "Audio device callback was not registered");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to unregister audio device callback", e);
        }
    }
}
