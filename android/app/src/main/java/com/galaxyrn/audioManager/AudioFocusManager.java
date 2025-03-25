
package com.galaxyrn.audioManager;

import android.content.Context;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.galaxyrn.callManager.CallStateType;
import com.galaxyrn.callManager.PhoneCallListener;

@RequiresApi(api = Build.VERSION_CODES.O)
public class AudioFocusManager {
    private static final String TAG = "AudioFocusManager";
    private final AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    public AudioFocusManager(ReactContext context) {
        audioManager = ((AudioManager) context.getSystemService(Context.AUDIO_SERVICE));
    }

    public void requestAudioFocus() {
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                // .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(false)
                .build();

        int requestAudioFocusRes = audioManager.requestAudioFocus(audioFocusRequest);
        String requestAudioFocusResStr;
        switch (requestAudioFocusRes) {
            case AudioManager.AUDIOFOCUS_REQUEST_FAILED:
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_FAILED";
                break;
            case AudioManager.AUDIOFOCUS_REQUEST_GRANTED:
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED";
                break;
            case AudioManager.AUDIOFOCUS_REQUEST_DELAYED:
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_DELAYED";
                break;
            default:
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN";
                break;
        }

        Log.d(TAG, "requestAudioFocus(): res = " + requestAudioFocusResStr);
    }

    public void abandonAudioFocus() {
        int abandonAudioFocusRes = audioManager.abandonAudioFocusRequest(audioFocusRequest);

        String abandonAudioFocusResStr = switch (abandonAudioFocusRes) {
            case AudioManager.AUDIOFOCUS_REQUEST_FAILED -> "AUDIOFOCUS_REQUEST_FAILED";
            case AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> "AUDIOFOCUS_REQUEST_GRANTED";
            default -> "AUDIOFOCUS_REQUEST_UNKNOWN";
        };

        audioManager.setMode(AudioManager.MODE_NORMAL);
        Log.d(TAG, "abandonAudioFocus(): res = " + abandonAudioFocusResStr);
    }
}
