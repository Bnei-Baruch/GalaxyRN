package com.galaxy_mobile.permissions;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import com.galaxy_mobile.logger.GxyLogger;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.galaxy_mobile.audioManager.AudioDeviceModule;
import com.galaxy_mobile.callManager.CallListenerModule;
import com.galaxy_mobile.foreground.ForegroundModule;

import java.util.ArrayList;
import java.util.List;

public class PermissionHelper {

    public boolean permissionsReady = false;

    private static final int PERMISSIONS_REQUEST_CODE = 101;
    public static final String TAG = "PermissionHelper";

    // Native modules whose initialization is deferred until all permissions are granted.
    private static final Class<?>[] PERMISSION_AWARE_MODULES = {
            AudioDeviceModule.class,
            ForegroundModule.class,
            CallListenerModule.class
    };

    private final Activity activity;
    private ReactApplicationContext reactContext;

    private final String[] requiredPermissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.POST_NOTIFICATIONS,
            Manifest.permission.READ_PHONE_STATE
    };

    public PermissionHelper(Activity activity) {
        GxyLogger.d(TAG, "Creating PermissionHelper");
        this.activity = activity;
    }

    public void initModules(ReactApplicationContext reactContext) {
        GxyLogger.d(TAG, "Initializing modules with reactContext");
        this.reactContext = reactContext;
        checkPermissions();
    }

    private String[] getUngrantedPermissions() {
        List<String> request = new ArrayList<>();
        GxyLogger.d(TAG, "Checking for ungranted permissions...");
        for (String permission : permissionsByVersion()) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                request.add(permission);
                GxyLogger.d(TAG, "Permission not granted: " + permission);
            } else {
                GxyLogger.d(TAG, "Permission already granted: " + permission);
            }
        }
        GxyLogger.d(TAG, "Total ungranted permissions: " + request.size());
        return request.toArray(new String[0]);
    }

    private List<String> permissionsByVersion() {
        List<String> request = new ArrayList<>();
        for (String permission : requiredPermissions) {
            // Handle Bluetooth permissions based on Android version
            if (permission.equals(Manifest.permission.BLUETOOTH_CONNECT)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    request.add(permission);
                } else {
                    request.add(Manifest.permission.BLUETOOTH);
                    request.add(Manifest.permission.BLUETOOTH_ADMIN);
                }
                continue;
            }

            // Handle Notification permissions (Android 13+)
            if (permission.equals(Manifest.permission.POST_NOTIFICATIONS)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    request.add(permission);
                }
                continue;
            }

            request.add(permission);
        }
        return request;
    }

    public void checkPermissions() {
        String[] ungrantedPermissions = getUngrantedPermissions();
        if (ungrantedPermissions.length > 0) {
            String permission = ungrantedPermissions[0];
            GxyLogger.d(TAG, "Checking permission: " + permission);
            requestPermission(permission);
        } else {
            GxyLogger.d(TAG, "All permissions already granted.");
            permissionsReady = true;
            initPermissionAwareModules();
        }
    }

    public void sendPermissions() {
        if (permissionsReady) {
            initPermissionAwareModules();
        }
    }

    /**
     * Re-evaluates permissions without re-prompting. Called from the Activity's onResume so that
     * permissions granted in the system settings (opened by the JS gate via Linking.openSettings())
     * still trigger native module initialization. Idempotent: modules are initialized only on the
     * first transition to "all granted".
     */
    public void recheckPermissions() {
        if (permissionsReady) {
            return;
        }
        if (reactContext == null) {
            // Context not ready yet — the onReactContextInitialized listener will call
            // initModules(), which sets reactContext and initializes the modules itself.
            GxyLogger.d(TAG, "recheckPermissions: reactContext not ready, deferring to initModules");
            return;
        }
        if (getUngrantedPermissions().length == 0) {
            GxyLogger.d(TAG, "recheckPermissions: all permissions now granted");
            permissionsReady = true;
            initPermissionAwareModules();
        }
    }

    private void initPermissionAwareModules() {
        if (reactContext == null) {
            GxyLogger.w(TAG, "ReactApplicationContext is null, cannot initialize permission-aware modules");
            return;
        }

        for (Class<?> moduleClass : PERMISSION_AWARE_MODULES) {
            try {
                Object module = reactContext.getNativeModule(moduleClass.asSubclass(NativeModule.class));
                if (module instanceof PermissionAware) {
                    ((PermissionAware) module).onPermissionsGranted();
                    GxyLogger.d(TAG, moduleClass.getSimpleName() + ".onPermissionsGranted() called successfully");
                } else {
                    GxyLogger.w(TAG, moduleClass.getSimpleName() + " not found in React Native module registry");
                }
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error initializing " + moduleClass.getSimpleName() + " after permissions: " + e.getMessage(), e);
            }
        }
    }

    private void requestPermission(String permission) {
        GxyLogger.d(TAG, "Requesting permission via ActivityCompat: " + permission);

        ActivityCompat.requestPermissions(activity, new String[] { permission }, PERMISSIONS_REQUEST_CODE);
        GxyLogger.d(TAG, "Permission request sent for: " + permission);

    }

    public void handlePermissionResult(int requestCode, String[] permissions, int[] grantResults) {
        GxyLogger.d(TAG, "handlePermissionResult: requestCode=" + requestCode + ", permissions="
                + java.util.Arrays.toString(permissions) + ", grantResults=" + java.util.Arrays.toString(grantResults));

        // Only react to our own native sequential requests. Requests initiated from JS
        // (PermissionsAndroid.request) arrive with a different request code and are owned by the
        // JS gate — driving checkPermissions() for them would pop an unexpected native dialog.
        if (requestCode != PERMISSIONS_REQUEST_CODE) {
            GxyLogger.d(TAG, "Ignoring permission result for non-native request code");
            return;
        }

        if (permissions.length == 0 || grantResults.length == 0) {
            return;
        }

        String currentPermission = permissions[0];
        if (grantResults[0] == PackageManager.PERMISSION_DENIED) {
            // No native dialog: the JS gate (PermissionsGate) shows the pending status and an
            // "Open Settings" button. The sequential request flow stops here; recovery happens
            // via the JS gate -> system settings -> Activity.onResume -> recheckPermissions().
            GxyLogger.d(TAG, "Permission denied: " + currentPermission + " (handled by JS gate)");
        } else {
            GxyLogger.d(TAG, "Permission granted: " + currentPermission);
            GxyLogger.d(TAG, "Continuing to check next permissions");
            // Continue checking the next permissions from scratch
            checkPermissions();
        }
    }
}