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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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
    private String[] permissions;
    private final Map<String, Boolean> permissionDeniedMap = new HashMap<>();
    private int currentPermissionIndex = 0;

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

    public void checkPermissions() {
        this.permissions = getUngrantedPermissions();
        currentPermissionIndex = 0;
        checkNextPermission();
    }

    private void checkNextPermission() {
        if (permissions.length == 0 || currentPermissionIndex >= permissions.length) {
            return;
        }
        
        String permission = permissions[currentPermissionIndex];
        // Check if we already have the permission
        if (ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED) {
            currentPermissionIndex++;
            checkNextPermission();
            return;
        }
        requestPermission(permission);
    }

    private void checkPermission(String permission) {
        if (permission == null || permission.isEmpty()) {
            return;
        }
        
        // Check if we already have the permission
        if (ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED) {
            return;
        }
        requestPermission(permission);
       /*  if (ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)) {
            showPermissionExplanationDialog(permission);
        } else {
            requestPermission(permission);
        } */
    }

    private void requestPermission(String permission) {
        if (permission == null || permission.isEmpty()) {
            return;
        }
        ActivityCompat.requestPermissions(activity, new String[]{permission}, PERMISSIONS_REQUEST_CODE);
    }

    /**
     * Handle permission request results
     * @param requestCode The request code passed in requestPermissions
     * @param permissions The requested permissions
     * @param grantResults The grant results for the corresponding permissions
     */
    public void handlePermissionResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == PERMISSIONS_REQUEST_CODE && permissions.length > 0 && grantResults.length > 0) {
            if (grantResults[0] == PackageManager.PERMISSION_DENIED) {
                // Mark this permission as denied
                permissionDeniedMap.put(permissions[0], true);
                // Show denied dialog
                showPermissionDeniedDialog(permissions[0]);
            }
            // Move to next permission regardless of result
            currentPermissionIndex++;
            checkNextPermission();
        }
    }

    private void showPermissionExplanationDialog(String permission) {
        String title = getLocalizedString("permissions_required", "Требуются разрешения");
        String message = getLocalizedString("permissions_explanation", "Приложению нужны эти разрешения для корректной работы.");
        String okButton = getLocalizedString("ok", "ОК");
        String cancelButton = getLocalizedString("cancel", "Отмена");

        new AlertDialog.Builder(activity)
                .setTitle(title + " " + permission)
                .setMessage(message)
                .setPositiveButton(okButton, (dialog, which) -> requestPermission(permission))
                .setNegativeButton(cancelButton, (dialog, which) -> {
                    permissionDeniedMap.put(permission, true);
                })
                .show();
    }

    private void showPermissionDeniedDialog(String permission) {
        String title = getLocalizedString("permissions_denied", "Разрешения отклонены");
        String message = getLocalizedString("permissions_denied_explanation", 
                "Без этих разрешений некоторые функции приложения могут работать некорректно.");
        String requestAgainButton = getLocalizedString("request_again", "Запросить снова");
        String cancelButton = getLocalizedString("cancel", "Отмена");

        new AlertDialog.Builder(activity)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton(requestAgainButton, (dialog, which) -> requestPermission(permission))
                .setNegativeButton(cancelButton, (dialog, which) -> { /* Do nothing */ })
                .show();
    }

    /**
     * Allows manually requesting permissions again for previously denied permissions
     */
    public void requestDeniedPermissions() {
        for (Map.Entry<String, Boolean> entry : permissionDeniedMap.entrySet()) {
            if (entry.getValue() && 
                ContextCompat.checkSelfPermission(activity, entry.getKey()) != PackageManager.PERMISSION_GRANTED) {
                requestPermission(entry.getKey());
            }
        }
    }

    private String getLocalizedString(String key, String defaultValue) {
        String language = Locale.getDefault().getLanguage();

        // Return text based on device language
        switch (language) {
            case "ru":
                if ("permissions_required".equals(key)) return "Требуются разрешения";
                if ("permissions_explanation".equals(key)) return "Приложению нужны эти разрешения для корректной работы.";
                if ("permissions_denied".equals(key)) return "Разрешения отклонены";
                if ("permissions_denied_explanation".equals(key)) return "Без этих разрешений некоторые функции приложения могут работать некорректно.";
                if ("request_again".equals(key)) return "Запросить снова";
                if ("ok".equals(key)) return "ОК";
                if ("cancel".equals(key)) return "Отмена";
                break;
            case "es": 
                if ("permissions_required".equals(key)) return "Se requieren permisos";
                if ("permissions_explanation".equals(key)) return "La aplicación necesita estos permisos para funcionar correctamente.";
                if ("permissions_denied".equals(key)) return "Permisos denegados";
                if ("permissions_denied_explanation".equals(key)) return "Sin estos permisos, algunas funciones de la aplicación pueden no funcionar correctamente.";
                if ("request_again".equals(key)) return "Solicitar de nuevo";
                if ("ok".equals(key)) return "Aceptar";
                if ("cancel".equals(key)) return "Cancelar";
                break;
            case "he":
                if ("permissions_required".equals(key)) return "נדרשות הרשאות";
                if ("permissions_explanation".equals(key)) return "האפליקציה צריכה הרשאות אלה כדי לפעול כראוי.";
                if ("permissions_denied".equals(key)) return "הרשאות נדחו";
                if ("permissions_denied_explanation".equals(key)) return "ללא הרשאות אלה, חלק מהתכונות של האפליקציה עלולות שלא לעבוד כראוי.";
                if ("request_again".equals(key)) return "בקש שוב";
                if ("ok".equals(key)) return "אישור";
                if ("cancel".equals(key)) return "ביטול";
                break;
            default: // English
                if ("permissions_required".equals(key)) return "Permissions Required";
                if ("permissions_explanation".equals(key)) return "The app needs these permissions to function properly.";
                if ("permissions_denied".equals(key)) return "Permissions Denied";
                if ("permissions_denied_explanation".equals(key)) return "Without these permissions, some app features may not work correctly.";
                if ("request_again".equals(key)) return "Request Again";
                if ("ok".equals(key)) return "OK";
                if ("cancel".equals(key)) return "Cancel";
                break;
        }
        
        return defaultValue;
    }
}