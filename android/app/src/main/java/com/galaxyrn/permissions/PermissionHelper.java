package com.galaxyrn.permissions;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.galaxyrn.SendEventToClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class PermissionHelper {

    private static final int PERMISSIONS_REQUEST_CODE = 101;
    private static final int SETTINGS_REQUEST_CODE = 102;
    public static final String TAG = "PermissionHelper";
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
        checkPermissions();
    }

    private String[] getUngrantedPermissions() {
        List<String> request = new ArrayList<>();
        Log.d(TAG, "Checking for ungranted permissions...");
        for (String permission : permissionsByVersion()) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                request.add(permission);
                Log.d(TAG, "Permission not granted: " + permission);
            } else {
                Log.d(TAG, "Permission already granted: " + permission);
            }
        }
        Log.d(TAG, "Total ungranted permissions: " + request.size());
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
            requestPermission(permission);
        } else {
            Log.d(TAG, "All permissions already granted.");
            notifyClientAllPermissionsGranted();
        }
    }

    private void notifyClientAllPermissionsGranted() {
        try {
            WritableMap params = Arguments.createMap();
            params.putBoolean("allGranted", true);
            SendEventToClient.sendEvent("permissionsStatus", params);
            Log.d(TAG, "Sent 'permissionsStatus' event to client with allGranted=true");
        } catch (Exception e) {
            Log.e(TAG, "Error sending permissions granted event to client: " + e.getMessage(), e);
        }
    }

    private void requestPermission(String permission) {
        Log.d(TAG, "Requesting permission via ActivityCompat: " + permission);

        ActivityCompat.requestPermissions(activity, new String[] { permission }, PERMISSIONS_REQUEST_CODE);
        Log.d(TAG, "Permission request sent for: " + permission);

    }

    private void showPermissionPermanentlyDeniedDialog(String permission) {
        Log.d(TAG, "Showing permanently denied dialog for: " + permission);
        String title = getLocalizedString("permissions_required", permission);
        String message = getLocalizedString("permissions_permanently_denied", permission);
        String settingsButton = getLocalizedString("go_to_settings", permission);

        AlertDialog dialog = new AlertDialog.Builder(activity)
                .setTitle(title)
                .setMessage(message)
                .setCancelable(false)
                .setPositiveButton(settingsButton, (dialogInterface, which) -> {
                    openAppSettings();
                    dialogInterface.dismiss();
                })
                .create();

        dialog.setCanceledOnTouchOutside(false);
        Log.d(TAG, "Showing permanently denied dialog for: " + permission);
        dialog.show();
    }

    private void openAppSettings() {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", activity.getPackageName(), null);
        intent.setData(uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
        intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
        activity.startActivityForResult(intent, SETTINGS_REQUEST_CODE);
        Log.d(TAG, "Opened app settings with SETTINGS_REQUEST_CODE");
    }

    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "Returned from settings, checking permissions requestCode=" + requestCode + " resultCode=" + resultCode + " data=" + data);
        if (requestCode == SETTINGS_REQUEST_CODE) {
            Log.d(TAG, "Returned from settings, checking permissions");
            checkPermissions();
        }
    }

    public void handlePermissionResult(int requestCode, String[] permissions, int[] grantResults) {
        Log.d(TAG, "handlePermissionResult: requestCode=" + requestCode + ", permissions="
                + java.util.Arrays.toString(permissions) + ", grantResults=" + java.util.Arrays.toString(grantResults));

        String currentPermission = permissions[0];
        if (grantResults[0] == PackageManager.PERMISSION_DENIED) {
            Log.d(TAG, "Permission denied: " + currentPermission);
            Log.d(TAG, "Will show permission denied dialog for: " + currentPermission);
            boolean shouldShow = ActivityCompat.shouldShowRequestPermissionRationale(activity, currentPermission);
            if (!shouldShow) {
                showPermissionPermanentlyDeniedDialog(currentPermission);
            } else {
                showPermissionDeniedDialog(currentPermission);
            }

        } else {
            Log.d(TAG, "Permission granted: " + currentPermission);
            Log.d(TAG, "Continuing to check next permissions");
            // Continue checking the next permissions from scratch
            checkPermissions();
        }
    }

    private void showPermissionDeniedDialog(String permission) {
        Log.d(TAG, "Showing permission denied dialog for: " + permission);
        String title = getLocalizedString("permissions_required", permission);
        String message = getLocalizedString("permissions_denied_explanation", permission);
        String requestAgainButton = getLocalizedString("request_again", permission);

        final String permissionToRequest = permission;

        AlertDialog dialog = new AlertDialog.Builder(activity)
                .setTitle(title)
                .setMessage(message)
                .setCancelable(false)
                .setPositiveButton(requestAgainButton, (dialogInterface, which) -> {
                    Log.d(TAG, "User clicked request again for permission: " + permissionToRequest);
                    requestPermission(permissionToRequest);
                    dialogInterface.dismiss();
                })
                .create();

        dialog.setCanceledOnTouchOutside(false);
        Log.d(TAG, "Showing permission dialog for: " + permission);
        dialog.show();
    }

    private String getLocalizedString(String key, String permission) {
        String language = Locale.getDefault().getLanguage();

        // Return text based on device language
        switch (language) {
            case "ru":
                if ("permissions_required".equals(key))
                    return "Требуются разрешения: " + permission;
                if ("permissions_denied_explanation".equals(key))
                    return "Без этих разрешений некоторые функции приложения могут работать некорректно.";
                if ("request_again".equals(key))
                    return "Запросить снова";
                if ("permissions_permanently_denied".equals(key))
                    return "Разрешение было отклонено навсегда. Пожалуйста, откройте настройки приложения, чтобы предоставить необходимые разрешения.";
                if ("go_to_settings".equals(key))
                    return "Открыть настройки";
                if ("cancel".equals(key))
                    return "Отмена";
                break;
            case "es":
                if ("permissions_required".equals(key))
                    return "Se requieren permisos";
                if ("permissions_denied_explanation".equals(key))
                    return "Sin estos permisos, algunas funciones de la aplicación pueden no funcionar correctamente.";
                if ("request_again".equals(key))
                    return "Solicitar de nuevo";
                if ("permissions_permanently_denied".equals(key))
                    return "El permiso ha sido denegado permanentemente. Por favor, abra la configuración de la aplicación para conceder los permisos necesarios.";
                if ("go_to_settings".equals(key))
                    return "Ir a configuración";
                break;
            case "he":
                if ("permissions_required".equals(key))
                    return "נדרשות הרשאות";
                if ("permissions_denied_explanation".equals(key))
                    return "ללא הרשאות אלה, חלק מהתכונות של האפליקציה עלולות שלא לעבוד כראוי.";
                if ("request_again".equals(key))
                    return "בקש שוב";
                if ("permissions_permanently_denied".equals(key))
                    return "ההרשאה נדחתה לצמיתות. אנא פתח את הגדרות האפליקציה כדי להעניק את ההרשאות הנדרשות.";
                if ("go_to_settings".equals(key))
                    return "פתח הגדרות";
                break;
            default: // English
                if ("permissions_required".equals(key))
                    return "Permissions Required";
                if ("permissions_denied_explanation".equals(key))
                    return "Without these permissions, some app features may not work correctly.";
                if ("request_again".equals(key))
                    return "Request Again";
                if ("permissions_permanently_denied".equals(key))
                    return "Permission has been permanently denied. Please open app settings to grant the required permissions.";
                if ("go_to_settings".equals(key))
                    return "Go to Settings";
                break;
        }
        return "";
    }
}