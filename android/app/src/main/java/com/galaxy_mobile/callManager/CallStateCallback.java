package com.galaxy_mobile.callManager;

@FunctionalInterface
public interface CallStateCallback {
    /**
     * Called when the call state changes
     * @param state The new call state
     */
    void onCallStateChanged(int state);
}
