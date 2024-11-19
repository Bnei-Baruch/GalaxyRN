package com.galaxyrn;


import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public class AudioOutputModule extends ReactContextBaseJavaModule implements AudioManager.OnAudioFocusChangeListener {
    private final String TAG = "GalaxyRN custom: AudioOutputModule";
    private final AudioManager audioManager;


    public AudioOutputModule(ReactApplicationContext reactContext) {
        super(reactContext);
        audioManager = ((AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE));

        Log.d(TAG, "constructor audioManager");
        requestAudioFocus();
    }


    private void requestAudioFocus() {
        Log.d(TAG, "requestAudioFocus default mode = " + audioManager.getMode());
        audioManager.setMode(AudioManager.MODE_NORMAL);
        int res;
        Log.d(TAG, "requestAudioFocus for android.os.Build.VERSION.SDK_INT " + android.os.Build.VERSION.SDK_INT);
        if (android.os.Build.VERSION.SDK_INT < 26) {
            res = audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        } else {
            AudioAttributes mAudioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();

            AudioFocusRequest mAudioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(mAudioAttributes)
                    .setAcceptsDelayedFocusGain(false)
                    .setWillPauseWhenDucked(false)
                    .setOnAudioFocusChangeListener(this)
                    .build();

            res = audioManager.requestAudioFocus(mAudioFocusRequest);
        }
        Log.d(TAG, "requestAudioFocus: res = " + res);

        Log.d(TAG, "requestAudioFocus default mode after change " + audioManager.getMode());
    }

    @NonNull
    @Override
    public String getName() {
        return "AudioOutputModule";
    }

    @Override
    public void onAudioFocusChange(int focusChange) {
        Log.d(TAG, "onAudioFocusChange: focusChange = " + focusChange);
    }
}