package com.galaxyrn.permissions;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

public class PermissionHelper {

    private static final int PERMISSIONS_REQUEST_CODE = 101;
    private final Activity activity;
    private final String[] requiredPermissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.POST_NOTIFICATIONS,
            Manifest.permission.READ_PHONE_STATE
    };
    private final String[] permissions;

    private PermissionCallback callback;

    public PermissionHelper(Activity activity) {
        this.activity = activity;
        this.permissions = getUngrantedPermissions();

    }

    private String[] getUngrantedPermissions() {
        List<String> request = new ArrayList<>();
        for (String permission : permissionsByVersion()) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                request.add(permission);
            }
        }
        return request.toArray(new String[0]);
    }

    private List<String> permissionsByVersion() {
        List<String> request = new ArrayList<>();
        for (String permission : requiredPermissions) {
            if (permission.equals(Manifest.permission.BLUETOOTH_CONNECT)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    request.add(permission);
                } else {
                    request.add(Manifest.permission.BLUETOOTH);
                    request.add(Manifest.permission.BLUETOOTH_ADMIN);
                }
            }
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                    && permission.equals(Manifest.permission.POST_NOTIFICATIONS)) {
                continue;
            }
            request.add(permission);
        }
        return request;
    }

    public void checkPermissions(PermissionCallback callback) {
        this.callback = callback;

        if (areAllPermissionsGranted()) {
            callback.onAllPermissionsGranted();
        } else {
            if (shouldShowRationale()) {
                showPermissionExplanationDialog();
            } else {
                requestPermissions();
            }
        }
    }

    private boolean areAllPermissionsGranted() {
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    private boolean shouldShowRationale() {
        for (String permission : permissions) {
            if (ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)) {
                return true;
            }
        }
        return false;
    }

    private void showPermissionExplanationDialog() {
        new AlertDialog.Builder(activity)
                .setTitle("Требуются разрешения")
                .setMessage("Приложению нужны эти разрешения для корректной работы.")
                .setPositiveButton("ОК", (dialog, which) -> requestPermissions())
                .setNegativeButton("Отмена", (dialog, which) -> callback.onPermissionsDenied())
                .show();
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(activity, permissions, PERMISSIONS_REQUEST_CODE);
    }

    public void handlePermissionsResult(int requestCode, @NonNull int[] grantResults) {
        if (PERMISSIONS_REQUEST_CODE == requestCode) {
            if (areAllPermissionsGranted()) {
                callback.onAllPermissionsGranted();
            } else {
                callback.onPermissionsDenied();
            }
        }
    }

    public interface PermissionCallback {
        void onAllPermissionsGranted();

        void onPermissionsDenied();
    }
}