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

    private BroadcastReceiver receiver;

    private static ReactApplicationContext reactContext;
    private UpdateAudioDeviceCallback callback;
    private AudioDeviceCallback audioCallback;
    private AudioManager audioManager;

    public AudioDeviceManager(ReactApplicationContext context, UpdateAudioDeviceCallback callback) {
        reactContext = context;
        this.callback = callback;
        start();
    }

    private void start() {
        if (receiver != null || reactContext == null) {
            return;
        }

        try {
            audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) {
                Log.e(TAG, "Failed to get AudioManager service");
                return;
            }

            audioCallback = new AudioDeviceCallback() {
                @Override
                public void onAudioDevicesAdded(AudioDeviceInfo[] addedDevices) {
                    Log.d(TAG, "onAudioDevicesAdded() addedDevices: " + Arrays.toString(addedDevices));
                    try {
                        callback.onUpdateAudioDeviceState();
                    } catch (Exception e) {
                        Log.e(TAG, "Exception in onAudioDevicesAdded callback", e);
                    }
                }

                @Override
                public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                    Log.d(TAG, "onAudioDevicesRemoved() removedDevices: " + Arrays.toString(removedDevices));
                    try {
                        callback.onUpdateAudioDeviceState();
                    } catch (Exception e) {
                        Log.e(TAG, "Exception in onAudioDevicesRemoved callback", e);
                    }
                }
            };

            try {
                audioManager.registerAudioDeviceCallback(audioCallback, new Handler(Looper.getMainLooper()));
            } catch (Exception e) {
                Log.e(TAG, "Failed to register audio device callback", e);
            }

            IntentFilter filter = new IntentFilter();
            filter.addAction(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
            filter.addAction(AudioManager.ACTION_HEADSET_PLUG);
            filter.addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED);
            filter.addAction(BluetoothHeadset.ACTION_AUDIO_STATE_CHANGED);
            receiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    try {
                        String action = intent.getAction();
                        Log.d(TAG, "onReceive() action: " + action);
                        if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
                            int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                            if (state == BluetoothAdapter.STATE_ON) {
                                try {
                                    audioManager.startBluetoothSco();
                                    audioManager.setBluetoothScoOn(true);
                                } catch (Exception e) {
                                    Log.e(TAG, "Failed to start Bluetooth SCO", e);
                                }
                            } else if (state == BluetoothAdapter.STATE_OFF) {
                                try {
                                    audioManager.stopBluetoothSco();
                                    audioManager.setBluetoothScoOn(false);
                                } catch (Exception e) {
                                    Log.e(TAG, "Failed to stop Bluetooth SCO", e);
                                }
                            }
                        }
                        if (BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                            int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                            if (state == BluetoothAdapter.STATE_CONNECTED) {
                                try {
                                    audioManager.startBluetoothSco();
                                    audioManager.setBluetoothScoOn(true);
                                } catch (Exception e) {
                                    Log.e(TAG, "Failed to start Bluetooth SCO on connection", e);
                                }
                            } else if (state == BluetoothAdapter.STATE_DISCONNECTED) {
                                try {
                                    audioManager.stopBluetoothSco();
                                    audioManager.setBluetoothScoOn(false);
                                } catch (Exception e) {
                                    Log.e(TAG, "Failed to stop Bluetooth SCO on disconnection", e);
                                }
                            }
                        }
                        if (callback != null && reactContext != null && reactContext.hasActiveCatalystInstance()) {
                            callback.onUpdateAudioDeviceState();
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Exception in onReceive", e);
                    }
                }
            };
            registerReceiver(receiver, filter);
        } catch (Exception e) {
            Log.e(TAG, "Exception in start", e);
        }
    }

    public void stop() {
        try {
            if (receiver != null && reactContext != null) {
                this.unregisterReceiver(receiver);
                receiver = null;
            }

            if (audioCallback != null && audioManager != null) {
                try {
                    audioManager.unregisterAudioDeviceCallback(audioCallback);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to unregister audio device callback", e);
                }
                audioCallback = null;
            }

            if (audioManager != null) {
                try {
                    audioManager.stopBluetoothSco();
                    audioManager.setBluetoothScoOn(false);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to stop Bluetooth SCO in stop method", e);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception in stop", e);
        }
    }

    private void registerReceiver(BroadcastReceiver receiver, IntentFilter filter) {
        if (reactContext == null) {
            Log.d(TAG, "registerReceiver() reactContext is null");
            return;
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                reactContext.registerReceiver(receiver, filter);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to register receiver", e);
        }
    }

    private void unregisterReceiver(final BroadcastReceiver receiver) {
        if (reactContext == null) {
            Log.d(TAG, "unregisterReceiver() reactContext is null");
            return;
        }

        try {
            reactContext.unregisterReceiver(receiver);
        } catch (final Exception e) {
            Log.d(TAG, "unregisterReceiver() failed", e);
        }
    }
}
