package com.galaxyrn.audioManager;

import android.media.AudioDeviceInfo;

import androidx.annotation.NonNull;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Helper class for audio-related constants and utility methods
 */
public class AudioHelper {
    /**
     * List of audio device types ordered by priority
     * Higher priority devices appear earlier in the list
     */
    public static final List<Integer> devicePriorityOrder = Collections.unmodifiableList(Arrays.asList(
        // Wired headset with microphone and speakers
        AudioDeviceInfo.TYPE_WIRED_HEADSET,
        
        // USB headset with microphone and speakers
        AudioDeviceInfo.TYPE_USB_HEADSET,
        
        // Bluetooth Car (automotive)
        AudioDeviceInfo.TYPE_BUS,

        // Bluetooth SCO device (headsets and handsfree devices)
        AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
        
        // Analog audio devices
        AudioDeviceInfo.TYPE_LINE_ANALOG,
        
        // Digital audio devices
        AudioDeviceInfo.TYPE_LINE_DIGITAL,
        
        // Telephony audio
        AudioDeviceInfo.TYPE_TELEPHONY,
        
        // USB audio devices
        AudioDeviceInfo.TYPE_USB_DEVICE,
        
        // USB accessory devices
        AudioDeviceInfo.TYPE_USB_ACCESSORY,
        
        // Wired headphones (no microphone)
        AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
        
        // Bluetooth A2DP devices (stereo headphones)
        AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,

        // Bluetooth LE audio broadcast devices
        AudioDeviceInfo.TYPE_BLE_BROADCAST,
        
        // Bluetooth LE headset devices
        AudioDeviceInfo.TYPE_BLE_HEADSET,
        
        // HDMI devices
        AudioDeviceInfo.TYPE_HDMI,
        
        // HDMI ARC devices
        AudioDeviceInfo.TYPE_HDMI_ARC,
        
        // Docking stations
        AudioDeviceInfo.TYPE_DOCK,
        
        // FM receivers
        AudioDeviceInfo.TYPE_FM,
        
        // Hearing aids
        AudioDeviceInfo.TYPE_HEARING_AID,
        
        // Built-in earpiece
        AudioDeviceInfo.TYPE_BUILTIN_EARPIECE,
        
        // Built-in speaker
        AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
    ));
    
    /**
     * Get human-readable device type name
     * 
     * @param deviceType AudioDeviceInfo device type 
     * @return String describing the device type
     */
    @NonNull
    public static String getDeviceTypeName(int deviceType) {
        switch (deviceType) {
            case AudioDeviceInfo.TYPE_WIRED_HEADSET:
                return "Wired Headset";
            case AudioDeviceInfo.TYPE_USB_HEADSET:
                return "USB Headset";
            case AudioDeviceInfo.TYPE_BLUETOOTH_SCO:
                return "Bluetooth Headset";
            case AudioDeviceInfo.TYPE_LINE_ANALOG:
                return "Analog Line";
            case AudioDeviceInfo.TYPE_LINE_DIGITAL:
                return "Digital Line";
            case AudioDeviceInfo.TYPE_TELEPHONY:
                return "Telephony";
            case AudioDeviceInfo.TYPE_USB_DEVICE:
                return "USB Device";
            case AudioDeviceInfo.TYPE_USB_ACCESSORY:
                return "USB Accessory";
            case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
                return "Wired Headphones";
            case AudioDeviceInfo.TYPE_BLUETOOTH_A2DP:
                return "Bluetooth Stereo";
            case AudioDeviceInfo.TYPE_BLE_BROADCAST:
                return "Bluetooth LE Broadcast";
            case AudioDeviceInfo.TYPE_BLE_HEADSET:
                return "Bluetooth LE Headset";
            case AudioDeviceInfo.TYPE_BUS:
                return "Bluetooth Car Audio";
            case AudioDeviceInfo.TYPE_HDMI:
                return "HDMI";
            case AudioDeviceInfo.TYPE_HDMI_ARC:
                return "HDMI ARC";
            case AudioDeviceInfo.TYPE_DOCK:
                return "Dock";
            case AudioDeviceInfo.TYPE_FM:
                return "FM";
            case AudioDeviceInfo.TYPE_HEARING_AID:
                return "Hearing Aid";
            case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE:
                return "Earpiece";
            case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER:
                return "Speaker";
            default:
                return "Unknown Device Type: " + deviceType;
        }
    }
    
    /**
     * Check if the device type is a Bluetooth device
     * 
     * @param deviceType AudioDeviceInfo device type
     * @return true if device is Bluetooth
     */
    public static boolean isBluetoothDevice(int deviceType) {
        return deviceType == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || 
               deviceType == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
               deviceType == AudioDeviceInfo.TYPE_BLE_BROADCAST ||
               deviceType == AudioDeviceInfo.TYPE_BLE_HEADSET ||
               deviceType == AudioDeviceInfo.TYPE_BUS;
    }
}
