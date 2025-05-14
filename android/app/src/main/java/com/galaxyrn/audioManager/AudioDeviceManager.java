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

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Arrays;

public class AudioDeviceManager {
    private static final String TAG = AudioDeviceManager.class.getSimpleName();

    // Bluetooth related constants
    private static final int BLUETOOTH_SCO_TIMEOUT_MS = 1000;

    private final BroadcastReceiver receiver;
    private final ReactApplicationContext reactContext;
    private final UpdateAudioDeviceCallback callback;
    private final AudioDeviceCallback audioCallback;
    private final AudioManager audioManager;
    private final Handler handler;

    public AudioDeviceManager(ReactApplicationContext context, UpdateAudioDeviceCallback callback) {
        this.reactContext = context;
        this.callback = callback;
        this.handler = new Handler(Looper.getMainLooper());

        // Initialize audio manager
        this.audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        if (this.audioManager == null) {
            Log.e(TAG, "Failed to get AudioManager service");
            this.receiver = null;
            this.audioCallback = null;
            return;
        }

        // Initialize audio callback
        this.audioCallback = createAudioDeviceCallback();
        registerAudioDeviceCallback();

        // Initialize broadcast receiver
        this.receiver = createBroadcastReceiver();
        registerBroadcastReceiver();
    }

    private AudioDeviceCallback createAudioDeviceCallback() {
        return new AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(AudioDeviceInfo[] addedDevices) {
                Log.d(TAG, "onAudioDevicesAdded() addedDevices: " + Arrays.toString(addedDevices));
                notifyDeviceStateChanged();
            }

            @Override
            public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                Log.d(TAG, "onAudioDevicesRemoved() removedDevices: " + Arrays.toString(removedDevices));
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
            Log.e(TAG, "Failed to register audio device callback", e);
        }
    }

    private BroadcastReceiver createBroadcastReceiver() {
        return new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                try {
                    String action = intent.getAction();
                    Log.d(TAG, "onReceive() action: " + action);

                    if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
                        handleBluetoothStateChange(intent);
                    } else if (BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                        handleBluetoothConnectionStateChange(intent);
                    }

                    notifyDeviceStateChanged();
                } catch (Exception e) {
                    Log.e(TAG, "Exception in onReceive", e);
                }
            }
        };
    }

    private void notifyDeviceStateChanged() {
        if (callback != null && reactContext != null && reactContext.hasActiveCatalystInstance()) {
            callback.onUpdateAudioDeviceState();
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
                        Log.e(TAG, "Failed in delayed SCO check", e);
                    }
                }, BLUETOOTH_SCO_TIMEOUT_MS);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start Bluetooth SCO", e);
        }
    }

    private void disableBluetoothSco() {
        try {
            if (audioManager != null) {
                audioManager.stopBluetoothSco();
                audioManager.setBluetoothScoOn(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop Bluetooth SCO", e);
        }
    }

    private void registerBroadcastReceiver() {
        if (reactContext == null || receiver == null) {
            Log.d(TAG, "Cannot register receiver - context or receiver is null");
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
            Log.e(TAG, "Failed to register receiver", e);
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
        unregisterBroadcastReceiver();
        unregisterAudioDeviceCallback();
        disableBluetoothSco();
    }

    private void unregisterBroadcastReceiver() {
        try {
            if (receiver != null && reactContext != null) {
                reactContext.unregisterReceiver(receiver);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to unregister receiver", e);
        }
    }

    private void unregisterAudioDeviceCallback() {
        try {
            if (audioCallback != null && audioManager != null) {
                audioManager.unregisterAudioDeviceCallback(audioCallback);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to unregister audio device callback", e);
        }
    }
}
