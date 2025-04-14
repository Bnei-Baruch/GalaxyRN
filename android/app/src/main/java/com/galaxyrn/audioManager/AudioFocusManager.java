package com.galaxyrn.audioManager;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.ReactContext;

@RequiresApi(api = Build.VERSION_CODES.O)
public class AudioFocusManager {
    private static final String TAG = "AudioFocusManager";
    
    // Audio focus constants
    private static final int CONTENT_TYPE = AudioAttributes.CONTENT_TYPE_SPEECH;
    private static final int USAGE_TYPE = AudioAttributes.USAGE_VOICE_COMMUNICATION;
    
    private final AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean hasAudioFocus = false;

    public AudioFocusManager(@NonNull ReactContext context) {
        audioManager = ((AudioManager) context.getSystemService(Context.AUDIO_SERVICE));
        if (audioManager == null) {
            Log.e(TAG, "Failed to get AudioManager service");
        }
    }

    /**
     * Request audio focus for voice communication
     * 
     * @return true if audio focus was granted, false otherwise
     */
    public boolean requestAudioFocus() {
        if (audioManager == null) {
            Log.e(TAG, "Cannot request audio focus: AudioManager is null");
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
            Log.d(TAG, "requestAudioFocus(): result = " + resultStr);
            
            hasAudioFocus = (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED);
            return hasAudioFocus;
        } catch (Exception e) {
            Log.e(TAG, "Error requesting audio focus", e);
            return false;
        }
    }

    /**
     * Abandon previously requested audio focus
     * 
     * @return true if audio focus was abandoned successfully, false otherwise
     */
    public boolean abandonAudioFocus() {
        if (audioManager == null || audioFocusRequest == null) {
            Log.e(TAG, "Cannot abandon audio focus: AudioManager or AudioFocusRequest is null");
            return false;
        }
        
        try {
            int result = audioManager.abandonAudioFocusRequest(audioFocusRequest);
            String resultStr = getAudioFocusResultString(result);
            
            audioManager.setMode(AudioManager.MODE_NORMAL);
            Log.d(TAG, "abandonAudioFocus(): result = " + resultStr);
            
            hasAudioFocus = false;
            return (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED);
        } catch (Exception e) {
            Log.e(TAG, "Error abandoning audio focus", e);
            return false;
        }
    }
    
    /**
     * @return whether the app currently has audio focus
     */
    public boolean hasAudioFocus() {
        return hasAudioFocus;
    }
    
    /**
     * Convert audio focus result code to readable string for logging
     */
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
}
