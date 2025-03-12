
package com.galaxyrn.audioManager;

import android.media.AudioDeviceInfo;

import java.util.Arrays;
import java.util.List;


public class AudioHelper {
    public static final List<Integer> devicePriorityOrder = Arrays.asList(
// Wired headset, typically a 3.5mm headset with a microphone and/or speakers
            AudioDeviceInfo.TYPE_WIRED_HEADSET,

// USB headset, such as a USB-connected headset with a microphone and/or speakers
            AudioDeviceInfo.TYPE_USB_HEADSET,

// Bluetooth SCO (Synchronous Connection-Oriented) device, commonly used for Bluetooth headsets
            AudioDeviceInfo.TYPE_BLUETOOTH_SCO,

// Analog line-level audio device, such as a 3.5mm jack or other analog input/output devices
            AudioDeviceInfo.TYPE_LINE_ANALOG,

// Digital line-level audio device, used for devices like digital audio interfaces or digital microphones
            AudioDeviceInfo.TYPE_LINE_DIGITAL,

// Telephony audio device, typically used for voice communication during phone calls (e.g., phone speaker, microphone)
            AudioDeviceInfo.TYPE_TELEPHONY,

// USB audio device, refers to any USB-connected audio device, such as external microphones or speakers
            AudioDeviceInfo.TYPE_USB_DEVICE,

// USB accessory device, specific to audio accessories like USB audio interfaces or headsets operating in accessory mode
            AudioDeviceInfo.TYPE_USB_ACCESSORY,

// Wired headphones, typically 3.5mm or other wired headsets without a microphone
            AudioDeviceInfo.TYPE_WIRED_HEADPHONES,

// Bluetooth A2DP (Advanced Audio Distribution Profile) device, used for high-quality stereo audio playback, typically with Bluetooth speakers or headphones
            AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,

// HDMI (High Definition Multimedia Interface) audio device, typically used for audio transmitted through HDMI (e.g., TVs, home theater systems)
            AudioDeviceInfo.TYPE_HDMI,

// HDMI ARC (Audio Return Channel) device, a special HDMI connection for audio to be sent back from the TV to a soundbar or receiver
            AudioDeviceInfo.TYPE_HDMI_ARC,

// Docking station audio device, typically refers to audio systems that connect via a dock, often used for speakers
            AudioDeviceInfo.TYPE_DOCK,

// FM radio device, used for audio reception through FM radio, such as built-in or external FM receivers
            AudioDeviceInfo.TYPE_FM,

// Hearing aid device, typically Bluetooth-enabled or connected via other wireless methods to assist with hearing
            AudioDeviceInfo.TYPE_HEARING_AID,

// Built-in earpiece, referring to the phone's internal earpiece used for voice calls
            AudioDeviceInfo.TYPE_BUILTIN_EARPIECE,

// Built-in speaker, typically refers to the phone or device's internal speaker used for audio output
            AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
    );

}
