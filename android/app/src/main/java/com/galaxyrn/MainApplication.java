package com.galaxyrn;

import android.app.Application;
import android.media.AudioAttributes;
import android.media.AudioManager;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import com.facebook.react.bridge.ReactContext;
import com.oney.WebRTCModule.WebRTCModuleOptions;
import org.webrtc.audio.JavaAudioDeviceModule;

import java.util.List;

import io.sentry.android.core.SentryAndroid;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost reactNativeHost = new DefaultReactNativeHost(this) {
        @Override
        protected List<ReactPackage> getPackages() {
            List<ReactPackage> packages = new PackageList(this).getPackages();
            packages.add(new GxyPackage());
            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }

        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected boolean isNewArchEnabled() {
            return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
            return BuildConfig.IS_HERMES_ENABLED;
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return reactNativeHost;
    }

    @Override
    public ReactHost getReactHost() {
        return DefaultReactHost.getDefaultReactHost(getApplicationContext(), reactNativeHost);
    }

    @Override
    public void onCreate() {
        super.onCreate();

        ReactContext reactContext = new ReactContext(this);
        /*
         * WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
         * AudioAttributes audioAttributes = new AudioAttributes.Builder()
         * .setUsage(AudioAttributes.USAGE_MEDIA)
         * .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
         * .setLegacyStreamType(AudioManager.STREAM_MUSIC)
         * .build();
         * 
         * options.audioDeviceModule = JavaAudioDeviceModule.builder(reactContext)
         * .setEnableVolumeLogger(false)
         * .setAudioAttributes(audioAttributes)
         * .createAudioDeviceModule();
         */
        SentryAndroid.init(this, sentryOpts -> {
            sentryOpts.setDsn(BuildConfig.SENTRY_DSN);
            sentryOpts.setDebug(true);
            sentryOpts.setTracesSampleRate(1.0);
        });
        SoLoader.init(this, false);

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }
    }
}