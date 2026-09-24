package com.galaxy_mobile;

import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.SystemClock;

import androidx.annotation.NonNull;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.galaxy_mobile.logger.GxyLogger;
import com.galaxy_mobile.logger.GxyLoggerUtils;
import com.galaxy_mobile.permissions.PermissionHelper;
import com.oney.WebRTCModule.WebRTCModuleOptions;
import com.galaxy_mobile.uiState.GxyUIStateModule;


import org.webrtc.audio.JavaAudioDeviceModule;

public class MainActivity extends ReactActivity {
    private static final String TAG = "MainActivity";
    // A suppression request older than this is stale (the launch it was meant for never
    // triggered onUserLeaveHint) and must not swallow a later real Home press.
    private static final long SUPPRESS_PIP_WINDOW_MS = 3000;
    private PermissionHelper permissionHelper;
    // onUserLeaveHint fires not only when the user presses Home, but also when the app
    // starts another Activity (e.g. Crisp's support-chat ChatActivity) that comes to the
    // foreground. Crisp launches it via the Application context, so it can't be caught by
    // overriding startActivity here — JS requests suppression right before opening it.
    private static volatile long suppressPipRequestedAt = 0;

    public static void suppressNextPip() {
        suppressPipRequestedAt = SystemClock.elapsedRealtime();
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "GalaxyRN";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(this, getMainComponentName(),
                DefaultNewArchitectureEntryPoint.getFabricEnabled());
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);

        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
        options.audioDeviceModule = JavaAudioDeviceModule.builder(this)
                .setAudioAttributes(audioAttributes)
                .createAudioDeviceModule();

        permissionHelper = new PermissionHelper(this);

        // Using custom logger instead of Log.d
        GxyLogger.i(TAG, "onCreate");
        GxyLoggerUtils.logDeviceInfo(TAG);

        ReactApplication reactApplication = (ReactApplication) getApplication();
        ReactHost reactHost = reactApplication.getReactHost();
        if (reactHost != null) {
            reactHost.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                @Override
                public void onReactContextInitialized(ReactContext context) {
                    GxyLogger.i("ReactContext",
                            "Updating PermissionHelper with ReactApplicationContext. Permissions ready: "
                                    + permissionHelper.permissionsReady);
                    if (!permissionHelper.permissionsReady) {
                        permissionHelper.initModules((ReactApplicationContext) context);
                    } else {
                        permissionHelper.sendPermissions();
                    }
                }
            });
        } else {
            GxyLogger.w(TAG, "ReactHost is null, cannot register permission listener");
        }
    }

    @Override
    public void onUserLeaveHint() {
        GxyLogger.d(TAG, "onUserLeaveHint");
        long requestedAt = suppressPipRequestedAt;
        suppressPipRequestedAt = 0;
        if (requestedAt != 0
                && SystemClock.elapsedRealtime() - requestedAt < SUPPRESS_PIP_WINDOW_MS) {
            GxyLogger.d(TAG, "onUserLeaveHint: suppressing PIP entry (triggered by our own activity launch)");
            super.onUserLeaveHint();
            return;
        }
        if (GxyUIStateModule.isInRoom) {
            // onPictureInPictureModeChanged only fires once the shrink animation has
            // finished, so JS would keep the full room UI (bars included) mounted for
            // the whole transition. Switch JS to the PIP-only layout up front instead.
            WritableMap data = Arguments.createMap();
            data.putString("action", "is_pip_mode");
            data.putBoolean("active", true);
            GxyUIStateModule.dispatchSystemEvent(data);
            enterPictureInPictureMode();
        }
        super.onUserLeaveHint();
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
        GxyLogger.d(TAG, "onPictureInPictureModeChanged: " + isInPictureInPictureMode);
        super.onPictureInPictureModeChanged(isInPictureInPictureMode);
        WritableMap data = Arguments.createMap();
        data.putString("action", "is_pip_mode");
        data.putBoolean("active", isInPictureInPictureMode);
        GxyUIStateModule.dispatchSystemEvent(data);
    }

    @Override
    protected void onDestroy() {
        GxyLogger.d(TAG, "onDestroy - ensuring all services are stopped");
        super.onDestroy();

        try {
            setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);
            GxyLogger.i(TAG, "Activity cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during activity cleanup", e);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // New-arch permission recovery: re-check on return (e.g. from system settings opened by
        // the JS gate via Linking.openSettings()). Replaces the removed onActivityResult path.
        if (permissionHelper != null) {
            permissionHelper.recheckPermissions();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        permissionHelper.handlePermissionResult(requestCode, permissions, grantResults);
    }
}