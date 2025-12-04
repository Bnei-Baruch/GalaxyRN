package com.galaxy_mobile.callManager;

/**
 * Interface for call listeners in the application.
 * Implementations will handle phone call state changes.
 */
public interface ICallListener {
    
    /**
     * Initialize the call listener
     */
    void initialize(CallStateCallback callback);
    
    /**
     * Stop listening for call events and clean up resources
     */
    public void cleanup();
    
    /**
     * Called when the call state changes
     * @param state The new call state
     * @param phoneNumber The phone number of the call
     */
    public void onCallStateChanged(int state, String phoneNumber);
} 