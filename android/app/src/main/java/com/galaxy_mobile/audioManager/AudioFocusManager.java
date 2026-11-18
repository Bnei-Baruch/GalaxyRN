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

    private final Context context;
    private final AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean hasAudioFocus = false;

    public AudioFocusManager(@NonNull ReactContext context) {
        this.context = context.getApplicationContext();
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
            AudioModeKeeper.enterCommunication(audioManager);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(CONTENT_TYPE)
                    .setUsage(USAGE_TYPE)
                    .build();

            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(audioAttributes)
                    .setAcceptsDelayedFocusGain(false)
                    .setWillPauseWhenDucked(false)
                    .setOnAudioFocusChangeListener(this::onAudioFocusChange)
                    .build();

            int result = audioManager.requestAudioFocus(audioFocusRequest);
            String resultStr = getAudioFocusResultString(result);
            GxyLogger.i(TAG, "requestAudioFocus(): result = " + resultStr);

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
            return;
        }

        try {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            AudioModeKeeper.restore(context, audioManager);
            GxyLogger.d(TAG, "abandonAudioFocus() completed");

            hasAudioFocus = false;
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error abandoning audio focus", e);
        }
    }

    // Diagnostics only: we don't react to focus changes yet, but losing focus
    // (e.g. another app/system grabbing it while the screen is locked) is a
    // suspect for "no sound after lock", so make it visible in the log file.
    private void onAudioFocusChange(int focusChange) {
        GxyLogger.i(TAG, "onAudioFocusChange: " + getFocusChangeString(focusChange)
                + ", mode: " + (audioManager != null ? audioManager.getMode() : -1));
        hasAudioFocus = focusChange == AudioManager.AUDIOFOCUS_GAIN;
    }

    private String getFocusChangeString(int focusChange) {
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_GAIN:
                return "AUDIOFOCUS_GAIN";
            case AudioManager.AUDIOFOCUS_LOSS:
                return "AUDIOFOCUS_LOSS";
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                return "AUDIOFOCUS_LOSS_TRANSIENT";
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                return "AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK";
            default:
                return "UNKNOWN(" + focusChange + ")";
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
