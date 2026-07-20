package com.galaxy_mobile.audioManager;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import com.galaxy_mobile.logger.GxyLogger;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactContext;

public class AudioFocusManager {
    private static final String TAG = "AudioFocusManager";

    private static final int CONTENT_TYPE = AudioAttributes.CONTENT_TYPE_SPEECH;
    private static final int USAGE_TYPE = AudioAttributes.USAGE_VOICE_COMMUNICATION;

    private final AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean hasAudioFocus = false;

    public AudioFocusManager(@NonNull ReactContext context) {
        audioManager = ((AudioManager) context.getSystemService(Context.AUDIO_SERVICE));
        if (audioManager == null) {
            GxyLogger.e(TAG, "Failed to get AudioManager service");
        }
    }

    public boolean requestAudioFocus() {
        if (audioManager == null) {
            GxyLogger.e(TAG, "Cannot request audio focus: AudioManager is null");
            return false;
        }

        try {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(CONTENT_TYPE)
                    .setUsage(USAGE_TYPE)
                    .build();

            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(audioAttributes)
                    .setAcceptsDelayedFocusGain(false)
                    .setWillPauseWhenDucked(false)
                    .build();

            int result = audioManager.requestAudioFocus(audioFocusRequest);
            String resultStr = getAudioFocusResultString(result);
            GxyLogger.d(TAG, "requestAudioFocus(): result = " + resultStr);

            hasAudioFocus = (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED);
            return hasAudioFocus;
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error requesting audio focus", e);
            return false;
        }
    }

    public void abandonAudioFocus() {   
        if (audioManager == null || audioFocusRequest == null) {
            GxyLogger.d(TAG, "Cannot abandon: AudioManager or AudioFocusRequest is null");
        }

        try {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioManager.setMode(AudioManager.MODE_NORMAL);
            GxyLogger.d(TAG, "abandonAudioFocus() completed");

            hasAudioFocus = false;
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error abandoning audio focus", e);
        }
    }

    public boolean hasAudioFocus() {
        return hasAudioFocus;
    }

    private String getAudioFocusResultString(int result) {
        switch (result) {
            case AudioManager.AUDIOFOCUS_REQUEST_FAILED:
                return "AUDIOFOCUS_REQUEST_FAILED";
            case AudioManager.AUDIOFOCUS_REQUEST_GRANTED:
                return "AUDIOFOCUS_REQUEST_GRANTED";
            case AudioManager.AUDIOFOCUS_REQUEST_DELAYED:
                return "AUDIOFOCUS_REQUEST_DELAYED";
            default:
                return "AUDIOFOCUS_REQUEST_UNKNOWN";
        }
    }

    public void cleanup() {
        try {
            abandonAudioFocus();
            GxyLogger.d(TAG, "Audio focus abandoned and mode set to normal");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during cleanup", e);
        }
    }
}
