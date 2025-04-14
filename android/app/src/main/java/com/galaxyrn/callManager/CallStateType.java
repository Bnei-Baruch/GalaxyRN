package com.galaxyrn.callManager;

/**
 * Enum representing different call states that can be tracked by the application.
 */
public enum CallStateType {
    ON_START_CALL,    // When a call is initiated or received
    ON_END_CALL,      // When a call ends
    ON_RINGING,       // When the phone is ringing (incoming call)
    ON_OFFHOOK,       // When a call is active
    UNKNOWN           // Unknown or unhandled state
}