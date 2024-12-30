package com.galaxyrn;

import android.app.Notification;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;


import java.util.Random;


/**
 * This class implements an Android {@link Service}, a foreground one specifically, and it's
 * responsible for presenting an ongoing notification when a conference is in progress.
 * The service will help keep the app running while in the background.
 * <p>
 * See: https://developer.android.com/guide/components/services
 */
public class ForegroundService extends Service {
    private static final String TAG = ForegroundService.class.getSimpleName();
    private static Intent intent = null;

    static final int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;

    public static void start(Context context) {
        ForegroundNotification.createNotificationChannel(context);
        ForegroundService.intent = new Intent(context, ForegroundService.class);
        ComponentName componentName;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                componentName = context.startForegroundService(ForegroundService.intent);
            } else {
                componentName = context.startService(ForegroundService.intent);
            }
        } catch (RuntimeException e) {
            // Avoid crashing due to ForegroundServiceStartNotAllowedException (API level 31).
            // See: https://developer.android.com/guide/components/foreground-services#background-start-restrictions
            Log.w(TAG, "Media projection service not started", e);
            return;
        }

        if (componentName == null) {
            Log.w(TAG, "Media projection service not started");
        } else {
            Log.i(TAG, "Media projection service started");
        }
    }

    public static void abort(Context context) {
        if (ForegroundService.intent != null) {
            context.stopService(ForegroundService.intent);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        Notification notification = ForegroundNotification.buildMediaProjectionNotification(this);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        return START_STICKY;
    }

}
