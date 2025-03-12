

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
        if (receiver != null) {
            return;
        }

        audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);

        audioCallback = new AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(AudioDeviceInfo[] addedDevices) {
                callback.onUpdateAudioDeviceState();
            }

            @Override
            public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                callback.onUpdateAudioDeviceState();
            }
        };

        audioManager.registerAudioDeviceCallback(audioCallback, new Handler(Looper.getMainLooper()));

        IntentFilter filter = new IntentFilter();
        filter.addAction(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        filter.addAction(AudioManager.ACTION_HEADSET_PLUG);
        filter.addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED);
        filter.addAction(BluetoothHeadset.ACTION_AUDIO_STATE_CHANGED);
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
                    int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                    if (state == BluetoothAdapter.STATE_ON) {
                        audioManager.startBluetoothSco();
                        audioManager.setBluetoothScoOn(true);
                    } else if (state == BluetoothAdapter.STATE_OFF) {
                        audioManager.stopBluetoothSco();
                        audioManager.setBluetoothScoOn(false);
                    }
                }
                if (BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                    int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                    if (state == BluetoothAdapter.STATE_CONNECTED) {
                        audioManager.startBluetoothSco();
                        audioManager.setBluetoothScoOn(true);
                    } else if (state == BluetoothAdapter.STATE_DISCONNECTED) {
                        audioManager.stopBluetoothSco();
                        audioManager.setBluetoothScoOn(false);
                    }
                }
                callback.onUpdateAudioDeviceState();
            }
        };
        registerReceiver(receiver, filter);
    }

    public void stop() {
        if (receiver != null) {
            this.unregisterReceiver(receiver);
            receiver = null;
        }

        if (audioCallback != null) {
            audioManager.unregisterAudioDeviceCallback(audioCallback);
            audioCallback = null;
        }

        audioManager.stopBluetoothSco();
        audioManager.setBluetoothScoOn(false);
    }


    private void registerReceiver(BroadcastReceiver receiver, IntentFilter filter) {
        if (reactContext == null) {
            Log.d(TAG, "registerReceiver() reactContext is null");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            reactContext.registerReceiver(receiver, filter);
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
            Log.d(TAG, "unregisterReceiver() failed");
        }
    }
}

