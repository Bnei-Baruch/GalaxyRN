package com.galaxy_mobile.callManager;

import com.facebook.react.bridge.ReactApplicationContext;

/**
 * Interface for call listeners in the application.
 * Implementations will handle phone call state changes.
 */
public interface ICallListener {
    
    /**
     * Initialize the call listener with a context
     * @param context ReactApplicationContext to listen for calls
     * @return true if initialization was successful, false otherwise
     */
    boolean initialize(ReactApplicationContext context);
    
    /**
     * Stop listening for call events and clean up resources
     */
    void cleanup();
    
    /**
     * Check if the listener is currently initialized
     * @return true if the listener is initialized, false otherwise
     */
    boolean isInitialized();
} 