

package com.galaxyrn.audio;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.galaxyrn.SendEventToClient;

public class AudioFocusManager implements AudioManager.OnAudioFocusChangeListener {
    private static final String TAG = AudioFocusManager.class.getSimpleName();
    private final AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;


    public AudioFocusManager(ReactContext context) {
        audioManager = ((AudioManager) context.getSystemService(Context.AUDIO_SERVICE));
        audioManager.setMode(AudioManager.MODE_NORMAL);
        //on seminar replace to MODE_IN_CALL or MODE_IN_COMMUNICATION
    }

    public void requestAudioFocus() {
        String requestAudioFocusResStr = (Build.VERSION.SDK_INT >= 26)
                ? requestAudioFocusV26()
                : requestAudioFocusOld();
        Log.d(TAG, "requestAudioFocus(): res = " + requestAudioFocusResStr);
    }

    private String requestAudioFocusV26() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return "";
        }

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                //.setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                //.setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                //.setContentType(AudioAttributes.CONTENT_TYPE_MOVE)
                //.setContentType(AudioAttributes.CONTENT_TYPE_UNKNOWN)
                .setLegacyStreamType(AudioManager.STREAM_MUSIC)

                //.setLegacyStreamType(AudioManager.STREAM_VOICE_CALL)
                .build();


        AudioFocusRequest audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(this)

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

        return requestAudioFocusResStr;
    }

    private String requestAudioFocusOld() {

        int requestAudioFocusRes = audioManager.requestAudioFocus(this, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN);

        String requestAudioFocusResStr;
        switch (requestAudioFocusRes) {
            case AudioManager.AUDIOFOCUS_REQUEST_FAILED:
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_FAILED";
                break;
            case AudioManager.AUDIOFOCUS_REQUEST_GRANTED:
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED";
                break;
            default:
                requestAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN";
                break;
        }

        return requestAudioFocusResStr;
    }

    public void abandonAudioFocus() {
        String abandonAudioFocusResStr = (Build.VERSION.SDK_INT >= 26)
                ? abandonAudioFocusV26()
                : abandonAudioFocusOld();
        Log.d(TAG, "abandonAudioFocus(): res = " + abandonAudioFocusResStr);
    }

    private String abandonAudioFocusV26() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return "";
        }

        int abandonAudioFocusRes = audioManager.abandonAudioFocusRequest(audioFocusRequest);
        String abandonAudioFocusResStr;
        switch (abandonAudioFocusRes) {
            case AudioManager.AUDIOFOCUS_REQUEST_FAILED:
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_FAILED";
                break;
            case AudioManager.AUDIOFOCUS_REQUEST_GRANTED:
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED";
                break;
            default:
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN";
                break;
        }

        return abandonAudioFocusResStr;
    }

    private String abandonAudioFocusOld() {
        int abandonAudioFocusRes = audioManager.abandonAudioFocus(this);

        String abandonAudioFocusResStr;
        switch (abandonAudioFocusRes) {
            case AudioManager.AUDIOFOCUS_REQUEST_FAILED:
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_FAILED";
                break;
            case AudioManager.AUDIOFOCUS_REQUEST_GRANTED:
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_GRANTED";
                break;
            default:
                abandonAudioFocusResStr = "AUDIOFOCUS_REQUEST_UNKNOWN";
                break;
        }

        return abandonAudioFocusResStr;
    }


    @Override
    public void onAudioFocusChange(int focusChange) {
        Log.d(TAG, "onAudioFocusChange(): " + focusChange);
        WritableMap data = Arguments.createMap();
        data.putInt("eventCode", focusChange);
        SendEventToClient.sendEvent("onAudioFocusChange", data);
    }
}

