package com.galaxy_mobile.audioManager;

import android.media.AudioDeviceInfo;
import com.galaxy_mobile.logger.GxyLogger;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import android.os.Build;
import java.lang.reflect.Field;

public class AudioHelper {
        private static final String TAG = "AudioHelper";

        public static final AudioDeviceGroup HEADPHONES_GROUP = new AudioDeviceGroup(
                        4,
                        Arrays.asList(
                                        AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
                                        AudioDeviceInfo.TYPE_WIRED_HEADSET,

                                        AudioDeviceInfo.TYPE_USB_DEVICE,
                                        AudioDeviceInfo.TYPE_USB_ACCESSORY,
                                        AudioDeviceInfo.TYPE_USB_HEADSET,

                                        AudioDeviceInfo.TYPE_LINE_ANALOG,
                                        AudioDeviceInfo.TYPE_LINE_DIGITAL),
                        "headphones");

        public static final AudioDeviceGroup BLUETOOTH_GROUP = new AudioDeviceGroup(
                        3,
                        Arrays.asList(
                                        AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
                                        AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
                                        AudioDeviceInfo.TYPE_BLE_BROADCAST,
                                        AudioDeviceInfo.TYPE_BLE_HEADSET),
                        "bluetooth");

        public static final AudioDeviceGroup BUILTIN_SPEAKER_GROUP = new AudioDeviceGroup(
                        2,
                        Arrays.asList(AudioDeviceInfo.TYPE_BUILTIN_SPEAKER),
                        "speaker");

        public static final AudioDeviceGroup BUILTIN_EARPIECE_GROUP = new AudioDeviceGroup(
                        1,
                        Arrays.asList(AudioDeviceInfo.TYPE_BUILTIN_EARPIECE),
                        "earpiece");

        public static final List<AudioDeviceGroup> ALL_DEVICE_GROUPS = Collections.unmodifiableList(Arrays.asList(
                        HEADPHONES_GROUP,
                        BLUETOOTH_GROUP,
                        BUILTIN_SPEAKER_GROUP,
                        BUILTIN_EARPIECE_GROUP));

        public static AudioDeviceGroup getGroupByDeviceType(int deviceType) {
                for (AudioDeviceGroup group : ALL_DEVICE_GROUPS) {
                        if (group.containsType(deviceType)) {
                                return group;
                        }
                }
                GxyLogger.e(TAG, "Group not found. getGroupByDeviceType: " + deviceType);
                return BUILTIN_EARPIECE_GROUP;
        }

        public static AudioDeviceInfo getDeviceByGroup(AudioDeviceInfo[] devices, AudioDeviceGroup group) {
                for (AudioDeviceInfo device : devices) {
                        if (group.containsType(device.getType())) {
                                return device;
                        }
                }
                GxyLogger.e(TAG, "Device not found. getDeviceByGroup: " + group.getType());
                return null;
        }
}
