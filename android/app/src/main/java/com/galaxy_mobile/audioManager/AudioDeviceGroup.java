package com.galaxy_mobile.audioManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AudioDeviceGroup {
    private final int priority;
    private final List<Integer> audioTypes;
    private final String type;

    public AudioDeviceGroup(int priority, List<Integer> audioTypes, String type) {
        this.priority = priority;
        this.audioTypes = Collections.unmodifiableList(new ArrayList<>(audioTypes));
        this.type = type;
    }

    public int getPriority() {
        return priority;
    }

    public List<Integer> getAudioTypes() {
        return audioTypes;
    }

    public String getType() {
        return type;
    }

    public boolean containsType(int deviceType) {
        return audioTypes.contains(deviceType);
    }

    @Override
    public String toString() {
        return "AudioDeviceGroup{" +
                "type='" + type + '\'' +
                ", priority=" + priority +
                ", types=" + audioTypes +
                '}';
    }
}