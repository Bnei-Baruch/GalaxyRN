package com.galaxyrn;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class NotificationListener extends NotificationListenerService {
    private static final String TAG = "CallListener";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();

        if (packageName.contains("whatsapp") || packageName.contains("telegram") || packageName.contains("viber")) {
            WritableMap data = Arguments.createMap();
            data.putString("packageName", packageName);
            Log.d(TAG, "звонок: " + packageName);
            SendEventToClient.sendEvent(TAG, data);
        }
    }
}