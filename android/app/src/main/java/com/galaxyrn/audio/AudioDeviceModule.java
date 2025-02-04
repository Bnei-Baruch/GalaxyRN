

package com.galaxyrn.audio;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.Uri;
import android.os.PowerManager;
import android.os.Build;
import android.os.Handler;
import android.provider.Settings;

import androidx.annotation.Nullable;

import android.util.Log;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.lang.Runnable;
import java.util.Collections;
import java.util.Map;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

public class AudioDeviceModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String REACT_NATIVE_MODULE_NAME = "AudioDeviceModule";
    private static final String TAG = REACT_NATIVE_MODULE_NAME;


    // --- AudioRouteManager
    private static final String ACTION_HEADSET_PLUG = (android.os.Build.VERSION.SDK_INT >= 21) ? AudioManager.ACTION_HEADSET_PLUG : Intent.ACTION_HEADSET_PLUG;
    private BroadcastReceiver wiredHeadsetReceiver;
    private BroadcastReceiver noisyAudioReceiver;

    /**
     * AudioDevice is the names of possible audio devices that we currently
     * support.
     */
    public enum AudioDevice {SPEAKER_PHONE, WIRED_HEADSET, EARPIECE, BLUETOOTH, NONE}


    private boolean hasWiredHeadset = false;

    private AudioDevice defaultAudioDevice = AudioDevice.NONE;

    // Contains the currently selected audio device.
    // This device is changed automatically using a certain scheme where e.g.
    // a wired headset "wins" over speaker phone. It is also possible for a
    // user to explicitly select a device (and overrid any predefined scheme).
    // See |userSelectedAudioDevice| for details.
    private AudioDevice selectedAudioDevice;

    private AudioDevice userSelectedAudioDevice;

    private BluetoothManager bluetoothManager = null;
    AudioFocusManager audioFocusManager = null;


    // Contains a list of available audio devices. A Set collection is used to
    // avoid duplicate elements.
    private Set<AudioDevice> audioDevices = new HashSet<>();

    @Override
    public String getName() {
        return REACT_NATIVE_MODULE_NAME;
    }

    public AudioDeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);

        UiThreadUtil.runOnUiThread(() -> {
            bluetoothManager = BluetoothManager.create(reactContext, this);
        });

        Log.d(TAG, "AudioDeviceModule initialized");
    }


    private void startWiredHeadsetEvent() {
        if (wiredHeadsetReceiver == null) {
            Log.d(TAG, "startWiredHeadsetEvent()");
            IntentFilter filter = new IntentFilter(ACTION_HEADSET_PLUG);
            wiredHeadsetReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (ACTION_HEADSET_PLUG.equals(intent.getAction())) {
                        hasWiredHeadset = intent.getIntExtra("state", 0) == 1;
                        updateAudioDeviceState();
                    }
                }
            };
            this.registerReceiver(wiredHeadsetReceiver, filter);
        }
    }

    private void stopWiredHeadsetEvent() {
        if (wiredHeadsetReceiver != null) {
            Log.d(TAG, "stopWiredHeadsetEvent()");
            this.unregisterReceiver(this.wiredHeadsetReceiver);
            wiredHeadsetReceiver = null;
        }
    }

    private void startNoisyAudioEvent() {
        if (noisyAudioReceiver == null) {
            Log.d(TAG, "startNoisyAudioEvent()");
            IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
            noisyAudioReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                        updateAudioDeviceState();
                    }
                }
            };
            this.registerReceiver(noisyAudioReceiver, filter);
        }
    }

    private void stopNoisyAudioEvent() {
        if (noisyAudioReceiver != null) {
            Log.d(TAG, "stopNoisyAudioEvent()");
            this.unregisterReceiver(this.noisyAudioReceiver);
            noisyAudioReceiver = null;
        }
    }


    @Override
    public void initialize() {
        super.initialize();

        ReactContext context = getReactApplicationContext();
        SendEventToClient.init(context);
        audioFocusManager = new AudioFocusManager(context);
        audioFocusManager.requestAudioFocus();

        startEvents();
        UiThreadUtil.runOnUiThread(() -> {
            bluetoothManager.start();
        });


        audioDevices.clear();
        updateAudioDeviceState();
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

        stopEvents();
        UiThreadUtil.runOnUiThread(() -> {
            bluetoothManager.stop();
        });
        audioFocusManager.abandonAudioFocus();
    }


    private void startEvents() {
        setKeepScreenOn(true);
        startWiredHeadsetEvent();
        startNoisyAudioEvent();
    }

    private void stopEvents() {
        setKeepScreenOn(false);
        stopWiredHeadsetEvent();
        stopNoisyAudioEvent();
    }

    public void setKeepScreenOn(final boolean enable) {
        Log.d(TAG, "setKeepScreenOn() " + enable);

        Activity mCurrentActivity = getCurrentActivity();

        if (mCurrentActivity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.");
            return;
        }

        UiThreadUtil.runOnUiThread(new Runnable() {
            public void run() {
                Window window = mCurrentActivity.getWindow();

                if (enable) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            }
        });
    }

    /**
     * Helper method for receiver registration.
     */
    private void registerReceiver(BroadcastReceiver receiver, IntentFilter filter) {
        final ReactContext reactContext = getReactApplicationContext();
        if (reactContext != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                reactContext.registerReceiver(receiver, filter);
            }
        } else {
            Log.d(TAG, "registerReceiver() reactContext is null");
        }
    }

    /**
     * Helper method for unregistration of an existing receiver.
     */
    private void unregisterReceiver(final BroadcastReceiver receiver) {
        final ReactContext reactContext = this.getReactApplicationContext();
        if (reactContext != null) {
            try {
                reactContext.unregisterReceiver(receiver);
            } catch (final Exception e) {
                Log.d(TAG, "unregisterReceiver() failed");
            }
        } else {
            Log.d(TAG, "unregisterReceiver() reactContext is null");
        }
    }

    /**
     * Gets the current earpiece state.
     */
    private boolean hasEarpiece() {
        return getReactApplicationContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY);
    }

    /**
     * Updates list of possible audio devices and make new device selection.
     */
    public void updateAudioDeviceState() {
        UiThreadUtil.runOnUiThread(() -> {
            // Check if any Bluetooth headset is connected. The internal BT state will
            // change accordingly.
            if (bluetoothManager.getState() == BluetoothManager.State.HEADSET_AVAILABLE
                    || bluetoothManager.getState() == BluetoothManager.State.HEADSET_UNAVAILABLE
                    || bluetoothManager.getState() == BluetoothManager.State.SCO_DISCONNECTING) {
                bluetoothManager.updateDevice();
            }

            // Update the set of available audio devices.
            Set<AudioDevice> newAudioDevices = new HashSet<>();

            // always assume device has speaker phone
            newAudioDevices.add(AudioDevice.SPEAKER_PHONE);

            if (bluetoothManager.getState() == BluetoothManager.State.SCO_CONNECTED
                    || bluetoothManager.getState() == BluetoothManager.State.SCO_CONNECTING
                    || bluetoothManager.getState() == BluetoothManager.State.HEADSET_AVAILABLE) {
                newAudioDevices.add(AudioDevice.BLUETOOTH);
            }

            if (hasWiredHeadset) {
                newAudioDevices.add(AudioDevice.WIRED_HEADSET);
            }

            if (hasEarpiece()) {
                newAudioDevices.add(AudioDevice.EARPIECE);
            }

            // Update the existing audio device set.
            audioDevices = newAudioDevices;

            AudioDevice newAudioDevice = getPreferredAudioDevice();

            // --- stop bluetooth if needed
            if (selectedAudioDevice == AudioDevice.BLUETOOTH
                    && newAudioDevice != AudioDevice.BLUETOOTH
                    && (bluetoothManager.getState() == BluetoothManager.State.SCO_CONNECTED
                    || bluetoothManager.getState() == BluetoothManager.State.SCO_CONNECTING)
            ) {
                bluetoothManager.stopScoAudio();
                bluetoothManager.updateDevice();
            }

            // --- start bluetooth if needed
            if (selectedAudioDevice != AudioDevice.BLUETOOTH
                    && newAudioDevice == AudioDevice.BLUETOOTH
                    && bluetoothManager.getState() == BluetoothManager.State.HEADSET_AVAILABLE) {
                // Attempt to start Bluetooth SCO audio (takes a few second to start).
                if (!bluetoothManager.startScoAudio()) {
                    // Remove BLUETOOTH from list of available devices since SCO failed.
                    audioDevices.remove(AudioDevice.BLUETOOTH);
                    if (userSelectedAudioDevice == AudioDevice.BLUETOOTH) {
                        userSelectedAudioDevice = AudioDevice.NONE;
                    }
                    newAudioDevice = getPreferredAudioDevice();
                }
            }

            if (newAudioDevice == AudioDevice.BLUETOOTH
                    && bluetoothManager.getState() != BluetoothManager.State.SCO_CONNECTED) {
                newAudioDevice = getPreferredAudioDevice(true); // --- skip bluetooth
            }


            WritableMap data = Arguments.createMap();
            data.putString("name", newAudioDevice.name());
            data.putInt("name", newAudioDevice.ordinal());
            SendEventToClient.sendEvent("onAudioDeviceChanged", data);

            Log.d(TAG, "--- updateAudioDeviceState done");
        });
    }

    private AudioDevice getPreferredAudioDevice() {
        return getPreferredAudioDevice(false);
    }

    private AudioDevice getPreferredAudioDevice(boolean skipBluetooth) {
        final AudioDevice newAudioDevice;

        if (userSelectedAudioDevice != null && userSelectedAudioDevice != AudioDevice.NONE) {
            newAudioDevice = userSelectedAudioDevice;
        } else if (!skipBluetooth && audioDevices.contains(AudioDevice.BLUETOOTH)) {
            // If a Bluetooth is connected, then it should be used as output audio
            // device. Note that it is not sufficient that a headset is available;
            // an active SCO channel must also be up and running.
            newAudioDevice = AudioDevice.BLUETOOTH;
        } else if (audioDevices.contains(AudioDevice.WIRED_HEADSET)) {
            // If a wired headset is connected, but Bluetooth is not, then wired headset is used as
            // audio device.
            newAudioDevice = AudioDevice.WIRED_HEADSET;
        } else if (audioDevices.contains(defaultAudioDevice)) {
            newAudioDevice = defaultAudioDevice;
        } else {
            newAudioDevice = AudioDevice.SPEAKER_PHONE;
        }

        return newAudioDevice;
    }
}

