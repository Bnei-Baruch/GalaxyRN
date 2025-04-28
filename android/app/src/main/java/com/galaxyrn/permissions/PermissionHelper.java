package com.galaxyrn.permissions;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class PermissionHelper {

    private static final int PERMISSIONS_REQUEST_CODE = 101;
    private static final String TAG = "PermissionHelper";
    private final Activity activity;
    private final String[] requiredPermissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.POST_NOTIFICATIONS,
            Manifest.permission.READ_PHONE_STATE
    };

    public PermissionHelper(Activity activity) {
        this.activity = activity;
        Log.d(TAG, "PermissionHelper initialized. Ungranted permissions: "
                + java.util.Arrays.toString(getUngrantedPermissions()));
    }

    private String[] getUngrantedPermissions() {
        List<String> request = new ArrayList<>();
        for (String permission : permissionsByVersion()) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                request.add(permission);
                Log.d(TAG, "Permission not granted: " + permission);
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

    public void checkPermissions() {
        String[] ungrantedPermissions = getUngrantedPermissions();
        if (ungrantedPermissions.length > 0) {
            String permission = ungrantedPermissions[0];
            Log.d(TAG, "Checking permission: " + permission);
            checkPermission(permission);
            // Wait for result in handlePermissionResult
            return;
        }
        Log.d(TAG, "All permissions already granted.");
    }

    private void checkPermission(String permission) {
        Log.d(TAG, "Requesting permission: " + permission);
        if (ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)) {
            Log.d(TAG, "Should show rationale for permission: " + permission);
            showPermissionDeniedDialog(permission);
        } else {
            requestPermission(permission);
        }
    }

    private void requestPermission(String permission) {
        Log.d(TAG, "Requesting permission via ActivityCompat: " + permission);
        ActivityCompat.requestPermissions(activity, new String[] { permission }, PERMISSIONS_REQUEST_CODE);
    }

    public void handlePermissionResult(int requestCode, String[] permissions, int[] grantResults) {
        Log.d(TAG, "handlePermissionResult: requestCode=" + requestCode + ", permissions="
                + java.util.Arrays.toString(permissions) + ", grantResults=" + java.util.Arrays.toString(grantResults));
        if (requestCode == PERMISSIONS_REQUEST_CODE && permissions.length > 0 && grantResults.length > 0) {
            if (grantResults[0] == PackageManager.PERMISSION_DENIED) {
                Log.d(TAG, "Permission denied: " + permissions[0]);
                showPermissionDeniedDialog(permissions[0]);
                return;
            } else {
                Log.d(TAG, "Permission granted: " + permissions[0]);
            }
            // Continue checking the next permissions from scratch
            checkPermissions();
        }
    }

    private void showPermissionDeniedDialog(String permission) {
        Log.d(TAG, "Showing permission denied dialog for: " + permission);
        String title = getLocalizedString("permissions_required");
        String message = getLocalizedString("permissions_denied_explanation");
        String requestAgainButton = getLocalizedString("request_again");

        AlertDialog dialog = new AlertDialog.Builder(activity)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton(requestAgainButton, (d, which) -> {
                    Log.d(TAG, "User clicked request again for permission: " + permission);
                    requestPermission(permission);
                })
                .setCancelable(false)
                .create();
        dialog.setCanceledOnTouchOutside(false);
        dialog.show();
    }

    private String getLocalizedString(String key) {
        String language = Locale.getDefault().getLanguage();

        // Return text based on device language
        switch (language) {
            case "ru":
                if ("permissions_required".equals(key))
                    return "Требуются разрешения";
                if ("permissions_denied_explanation".equals(key))
                    return "Без этих разрешений некоторые функции приложения могут работать некорректно.";
                if ("request_again".equals(key))
                    return "Запросить снова";
                break;
            case "es":
                if ("permissions_required".equals(key))
                    return "Se requieren permisos";
                if ("permissions_denied_explanation".equals(key))
                    return "Sin estos permisos, algunas funciones de la aplicación pueden no funcionar correctamente.";
                if ("request_again".equals(key))
                    return "Solicitar de nuevo";
                break;
            case "he":
                if ("permissions_required".equals(key))
                    return "נדרשות הרשאות";
                if ("permissions_denied_explanation".equals(key))
                    return "ללא הרשאות אלה, חלק מהתכונות של האפליקציה עלולות שלא לעבוד כראוי.";
                if ("request_again".equals(key))
                    return "בקש שוב";
                break;
            default: // English
                if ("permissions_required".equals(key))
                    return "Permissions Required";
                if ("permissions_denied_explanation".equals(key))
                    return "Without these permissions, some app features may not work correctly.";
                if ("request_again".equals(key))
                    return "Request Again";
                break;
        }
        return "";
    }
}