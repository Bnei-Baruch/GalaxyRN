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
import android.bluetooth.BluetoothProfile;

import com.galaxyrn.logger.SentrySpanHelper;
import io.sentry.SpanStatus;

import java.util.Arrays;

public class AudioDeviceManager {
    private static final String TAG = AudioDeviceManager.class.getSimpleName();

    private static final int NOTIFICATION_DEBOUNCE_MS = 1500;

    private BroadcastReceiver receiver;
    private final ReactApplicationContext reactContext;
    private final UpdateAudioDeviceCallback callback;
    private AudioDeviceCallback audioCallback;
    private AudioManager audioManager;
    private final Handler handler;
    private final Runnable notificationRunnable;

    public AudioDeviceManager(ReactApplicationContext context, UpdateAudioDeviceCallback callback) {
        this.reactContext = context;
        this.callback = callback;
        this.handler = new Handler(Looper.getMainLooper());
        this.notificationRunnable = this::notifyDeviceStateChangedInternal;

        initializeAudioManager();
    }

    private void initializeAudioManager() {
        SentrySpanHelper span = SentrySpanHelper.start("audio.manager.init")
                .setDescription("Initialize AudioDeviceManager");

        try {
            GxyLogger.d(TAG, "Initializing AudioDeviceManager");

            // Check if already initialized
            if (audioManager != null) {
                GxyLogger.w(TAG, "AudioDeviceManager already initialized");
                span.finish(SpanStatus.ALREADY_EXISTS);
                return;
            }

            // Initialize audio manager
            audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) {
                GxyLogger.e(TAG, "Failed to get AudioManager service");
                span.finish(SpanStatus.INTERNAL_ERROR);
                return;
            }

            // Initialize audio callback
            audioCallback = createAudioDeviceCallback();
            registerAudioDeviceCallback();

            // Initialize broadcast receiver
            receiver = createBroadcastReceiver();
            registerBroadcastReceiver();

            GxyLogger.d(TAG, "AudioDeviceManager initialized successfully");
            span.finishOk();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to initialize AudioDeviceManager", e);
            span.finishWithError(e);
            // Cleanup in case of partial initialization
            stop();
        }
    }

    private AudioDeviceCallback createAudioDeviceCallback() {
        return new AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(AudioDeviceInfo[] addedDevices) {
                boolean changed = false;
                for (AudioDeviceInfo device : addedDevices) {
                    try {
                        GxyLogger.d(TAG, "onAudioDevicesAdded() device: " + device.getType());
                        AudioDeviceGroup group = AudioHelper.getGroupByDeviceType(device.getType());
                        GxyLogger.d(TAG, "onAudioDevicesAdded() group: " + group.getType());
                        if (AudioHelper.HEADPHONES_GROUP.containsType(device.getType())
                                || AudioHelper.BLUETOOTH_GROUP.containsType(device.getType())) {
                            changed = true;
                        }
                    } catch (Exception e) {
                        GxyLogger.e(TAG, "onAudioDevicesAdded() error", e);
                    }
                }
                if (changed) {
                    notifyDeviceStateChanged();
                }
            }

            @Override
            public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                boolean changed = false;
                for (AudioDeviceInfo device : removedDevices) {
                    try {
                        GxyLogger.d(TAG, "onAudioDevicesRemoved() device: " + device.getType());
                        AudioDeviceGroup group = AudioHelper.getGroupByDeviceType(device.getType());
                        GxyLogger.d(TAG, "onAudioDevicesRemoved() group: " + group.getType());
                        if (AudioHelper.HEADPHONES_GROUP.containsType(device.getType())
                                || AudioHelper.BLUETOOTH_GROUP.containsType(device.getType())) {
                            changed = true;
                        }
                    } catch (Exception e) {
                        GxyLogger.e(TAG, "onAudioDevicesRemoved() error", e);
                    }

                }
                if (changed) {
                    notifyDeviceStateChanged();
                }
            }
        };
    }

    private void registerAudioDeviceCallback() {
        SentrySpanHelper span = SentrySpanHelper.start("audio.callback.register")
                .setDescription("Register audio device callback");

        try {
            if (audioManager != null && audioCallback != null) {
                audioManager.registerAudioDeviceCallback(audioCallback, handler);
            }
            span.finishOk();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to register audio device callback", e);
            span.finishWithError(e);
        }
    }

    private BroadcastReceiver createBroadcastReceiver() {
        return new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                try {
                    String action = intent.getAction();
                    GxyLogger.d(TAG, "onReceive() action: " + action);

                    boolean isBluetoothAction = false;
                    if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
                        handleBluetoothStateChange(intent);
                        isBluetoothAction = true;
                    } else if (BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                        handleBluetoothHeadsetConnectionStateChange(intent);
                        isBluetoothAction = true;
                    } else if (BluetoothHeadset.ACTION_AUDIO_STATE_CHANGED.equals(action)) {
                        handleBluetoothAudioStateChange(intent);
                        isBluetoothAction = true;
                    }

                    if (!isBluetoothAction) {
                        notifyDeviceStateChanged();
                    }
                } catch (Exception e) {
                    GxyLogger.e(TAG, "Exception in onReceive", e);
                }
            }
        };
    }

    private void notifyDeviceStateChanged() {
        handler.removeCallbacks(notificationRunnable);
        handler.postDelayed(notificationRunnable, NOTIFICATION_DEBOUNCE_MS);
    }

    private void notifyDeviceStateChangedInternal() {
        GxyLogger.d(TAG, "notifyDeviceStateChangedInternal()");

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

    private void handleBluetoothAudioStateChange(Intent intent) {
        int state = intent.getIntExtra(BluetoothProfile.EXTRA_STATE, BluetoothProfile.STATE_DISCONNECTED);

        if (state == BluetoothHeadset.STATE_AUDIO_CONNECTED) {
            GxyLogger.d(TAG, "Bluetooth audio SCO connected");
            if (audioManager != null) {
                audioManager.setBluetoothScoOn(true);
            }
            notifyDeviceStateChanged();
        } else if (state == BluetoothHeadset.STATE_AUDIO_DISCONNECTED) {
            GxyLogger.d(TAG, "Bluetooth audio SCO disconnected");
            if (audioManager != null && audioManager.isBluetoothScoOn()) {
                audioManager.setBluetoothScoOn(false);
            }
            notifyDeviceStateChanged();
        }
    }

    private void handleBluetoothHeadsetConnectionStateChange(Intent intent) {
        int state = intent.getIntExtra(BluetoothProfile.EXTRA_STATE, BluetoothProfile.STATE_DISCONNECTED);
        if (state == BluetoothProfile.STATE_CONNECTED) {
            enableBluetoothSco();
        } else if (state == BluetoothProfile.STATE_DISCONNECTED) {
            disableBluetoothSco();
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

    private void enableBluetoothSco() {
        SentrySpanHelper span = SentrySpanHelper.start("audio.bluetooth.enable_sco")
                .setDescription("Enable Bluetooth SCO");

        try {
            if (audioManager != null) {
                audioManager.startBluetoothSco();
            }
            span.finishOk();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to start Bluetooth SCO", e);
            span.finishWithError(e);
        }
    }

    private void disableBluetoothSco() {
        SentrySpanHelper span = SentrySpanHelper.start("audio.bluetooth.disable_sco")
                .setDescription("Disable Bluetooth SCO");

        try {
            if (audioManager != null) {
                if (audioManager.isBluetoothScoOn()) {
                    audioManager.stopBluetoothSco();
                }
            }
            span.finishOk();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to stop Bluetooth SCO", e);
            span.finishWithError(e);
        }
    }

    private void registerBroadcastReceiver() {
        SentrySpanHelper span = SentrySpanHelper.start("audio.receiver.register")
                .setDescription("Register broadcast receiver");

        if (reactContext == null || receiver == null) {
            GxyLogger.d(TAG, "Cannot register receiver - context or receiver is null");
            span.finish(SpanStatus.FAILED_PRECONDITION);
            return;
        }

        try {
            IntentFilter filter = createIntentFilter();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                reactContext.registerReceiver(receiver, filter);
            }
            span.finishOk();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Failed to register receiver", e);
            span.finishWithError(e);
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
            handler.removeCallbacks(notificationRunnable);
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
