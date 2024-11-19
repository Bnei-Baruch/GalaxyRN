package com.galaxyrn;

import android.content.Context;
import android.media.AudioManager;

public class AudioOutputManager {

    private AudioManager audioManager;

    public AudioOutputManager(Context context) {
        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
    }

    public void switchToSpeaker() {
        audioManager.setSpeakerphoneOn(true);
    }

    public void switchToHeadset() {
        audioManager.setSpeakerphoneOn(false);
    }

    public void switchToBluetooth() {
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioManager.startBluetoothSco();
    }

}