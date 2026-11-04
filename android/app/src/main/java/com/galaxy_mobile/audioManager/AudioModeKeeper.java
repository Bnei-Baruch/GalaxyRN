package com.galaxy_mobile.audioManager;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.os.Build;
import android.telecom.TelecomManager;

import com.galaxy_mobile.logger.GxyLogger;

/**
 * Remembers the system audio mode (media/NORMAL vs phone/IN_CALL/IN_COMMUNICATION)
 * that was in effect before we switched to MODE_IN_COMMUNICATION, and puts it back
 * when we release audio, instead of always forcing MODE_NORMAL.
 *
 * A call-type previous mode is only restored while a call is still ongoing; if that
 * call has ended meanwhile, we fall back to MODE_NORMAL.
 *
 * Android 12+ (S) keeps audio mode per requesting process: our setMode(NORMAL)
 * just drops our own request and the system goes back to whatever another app
 * still holds. Re-setting that app's mode ourselves would make us its owner, so on
 * S+ releasing (NORMAL) *is* the restore. On older versions the mode is global and
 * must be restored explicitly.
 */
public final class AudioModeKeeper {
    private static final String TAG = "AudioModeKeeper";

    private static boolean owned = false;
    private static int savedMode = AudioManager.MODE_NORMAL;

    private AudioModeKeeper() {
    }

    /** Switch to MODE_IN_COMMUNICATION, remembering the previous mode the first time. */
    public static synchronized void enterCommunication(AudioManager audioManager) {
        if (audioManager == null) return;
        if (!owned) {
            savedMode = audioManager.getMode();
            owned = true;
            GxyLogger.d(TAG, "saved previous audio mode: " + modeName(savedMode));
        }
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
    }

    /** Release our communication mode and restore the mode that was there before us. */
    public static synchronized void restore(Context context, AudioManager audioManager) {
        if (audioManager == null) return;
        int target = AudioManager.MODE_NORMAL;
        if (owned && savedMode != AudioManager.MODE_NORMAL
                && Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            if (isCallOngoing(context)) {
                target = savedMode;
            } else {
                GxyLogger.d(TAG, "previous mode " + modeName(savedMode)
                        + " belonged to a call that has ended, using NORMAL");
            }
        }
        owned = false;
        savedMode = AudioManager.MODE_NORMAL;
        try {
            audioManager.setMode(target);
        } catch (Exception e) {
            // e.g. MODE_IN_CALL needs MODIFY_PHONE_STATE on some builds
            GxyLogger.w(TAG, "setMode(" + modeName(target) + ") failed, using NORMAL", e);
            audioManager.setMode(AudioManager.MODE_NORMAL);
            target = AudioManager.MODE_NORMAL;
        }
        GxyLogger.d(TAG, "restored audio mode: " + modeName(target));
    }

    private static boolean isCallOngoing(Context context) {
        if (context == null) return false;
        if (context.checkSelfPermission(Manifest.permission.READ_PHONE_STATE)
                != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        try {
            TelecomManager telecom =
                    (TelecomManager) context.getSystemService(Context.TELECOM_SERVICE);
            return telecom != null && telecom.isInCall();
        } catch (Exception e) {
            GxyLogger.w(TAG, "isInCall check failed", e);
            return false;
        }
    }

    private static String modeName(int mode) {
        switch (mode) {
            case AudioManager.MODE_NORMAL:
                return "NORMAL";
            case AudioManager.MODE_RINGTONE:
                return "RINGTONE";
            case AudioManager.MODE_IN_CALL:
                return "IN_CALL";
            case AudioManager.MODE_IN_COMMUNICATION:
                return "IN_COMMUNICATION";
            default:
                return String.valueOf(mode);
        }
    }
}
