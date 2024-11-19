package com.galaxyrn;

import android.util.Log;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class GxyRNPackage implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        Log.i("GalaxyRN custom: GxyRNPackage", "createNativeModules");
        modules.add(new KeepAwakeModule(reactContext));
        //modules.add(new SwitchAudioDeviceModule(reactContext));
        //modules.add(new AudioOutputModule(reactContext));

        return modules;
    }

}