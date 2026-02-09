package com.galaxy_mobile.foreground;

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.app.PendingIntent;
import android.app.NotificationChannel;
import android.app.NotificationManager;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import com.facebook.react.bridge.ReactApplicationContext;
import com.galaxy_mobile.SendEventToClient;
import com.galaxy_mobile.logger.GxyLogger;
import com.galaxy_mobile.foreground.PlayerActionReceiver;

import com.galaxy_mobile.R;

public class PlayerNotification {
    public static final String CHANNEL_ID = "PlayerNotificationChannel";
    public static final int NOTIFICATION_ID = 9999;
    
    private static final String TAG = "PlayerNotification";
    private final Context context;
    private Notification notification;
    private boolean isInRoom;

    public PlayerNotification(Context context) {
        this.context = context;
        this.notification = buildNotification();
        this.isInRoom = true;
    }


    public static void initChannel(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            return;
        }

        NotificationChannel existingChannel = manager.getNotificationChannel(CHANNEL_ID);
        if (existingChannel != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Arvut System Notification",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        MediaStyle style = new MediaStyle()
                .setShowActionsInCompactView(0, 1, 2);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.arvut)
                .setContentTitle("Call")
                .setContentText("In progress")
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(buildMuteAction())
                .setOnlyAlertOnce(true)
                .setStyle(style);
        if (isInRoom) {
            builder.addAction(buildJoinRoomAction());
            isInRoom = false;
        } else {
            builder.addAction(buildLeaveRoomAction());
            isInRoom = true;
        }
        return builder.build();
    }

    public Notification updateNotification(String title, String text) {
        notification = buildNotification();
        return notification;
    }

    public Notification getNotification() {
        return notification;
    }

    private NotificationCompat.Action buildJoinRoomAction() {
        int requestCode = 1;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent intent = new Intent(PlayerActionReceiver.ACTION_JOIN_ROOM);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new NotificationCompat.Action.Builder(
                android.R.drawable.ic_media_play,
                "Join Room",
                pendingIntent).build();
    }

    private NotificationCompat.Action buildMuteAction() {
        int requestCode = 2;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent intent = new Intent(PlayerActionReceiver.ACTION_TOGGLE_MUTE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new NotificationCompat.Action.Builder(
                android.R.drawable.ic_lock_silent_mode,
                "Mute",
                pendingIntent).build();
    }

    private NotificationCompat.Action buildLeaveRoomAction() {
        int requestCode = 3;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent intent = new Intent(PlayerActionReceiver.ACTION_LEAVE_ROOM);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new NotificationCompat.Action.Builder(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Leave Room",
                pendingIntent).build();
    }
}
