package com.galaxyrn.audioManager;

/**
 * Callback interface to notify when audio device state changes
 */
public interface UpdateAudioDeviceCallback {
    /**
     * Called when audio devices are added, removed, or their state changes
     */
    void onUpdateAudioDeviceState();
}
