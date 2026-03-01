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
import com.galaxy_mobile.uiState.UIApdateReceiver;
import com.galaxy_mobile.MainActivity;
import com.galaxy_mobile.R;
import com.galaxy_mobile.uiState.GxyUIStateModule;

public class PlayerNotificationBuilder {
    public static final String CHANNEL_ID = "PlayerNotificationChannel";
    public static final int NOTIFICATION_ID = 9999;

    private static final String TAG = "PlayerNotificationBuilder";
    private final Context context;
    private Notification notification;

    public PlayerNotificationBuilder(Context context) {
        GxyLogger.i(TAG, "PlayerNotificationBuilder constructor called");
        this.context = context;
        initChannel();
    }

    private void initChannel() {
        GxyLogger.i(TAG, "initChannel called");
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            GxyLogger.i(TAG, "initChannel manager is null");
            return;
        }

        NotificationChannel existingChannel = manager.getNotificationChannel(CHANNEL_ID);
        if (existingChannel != null) {
            GxyLogger.i(TAG, "initChannel existingChannel is not null");
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Arvut System Notification",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setShowBadge(false);
        channel.setSound(null, null);
        channel.enableVibration(false);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }

    public Notification build() {
        GxyLogger.i(TAG, "buildNotification called");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.arvut)
                .setContentTitle(GxyUIStateModule.room)
                .setOngoing(true)
                .setAutoCancel(false)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setContentIntent(buildContentIntent())
                .setShowWhen(false)
                .setDefaults(0)                
                .setSound(null)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        MediaStyle style = new MediaStyle();
        if (GxyUIStateModule.isInRoom) {
            style.setShowActionsInCompactView(0, 1);
            builder.addAction(buildLeaveRoomAction());
            builder.setStyle(style);
            if (GxyUIStateModule.isMicOn) {
                builder.addAction(buildMuteAction());
            } else {
                builder.addAction(buildUnmuteAction());
            }
        } else {
            style.setShowActionsInCompactView(0);
            builder.setStyle(style);
            builder.addAction(buildJoinRoomAction());
        }

        GxyLogger.i(TAG, "buildNotification completed");
        return builder.build();
    }

    private PendingIntent buildContentIntent() {
        Intent notificationIntent = new Intent(context, MainActivity.class);
        notificationIntent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(
                context,
                0,
                notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private NotificationCompat.Action buildMuteAction() {
        GxyLogger.i(TAG, "buildMuteAction called");
        int requestCode = 1;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent intent = new Intent(context, UIApdateReceiver.class).setAction(UIApdateReceiver.ACTION_MUTE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new NotificationCompat.Action.Builder(
                R.drawable.mic_24px,
                "Mute",
                pendingIntent).build();
    }

    private NotificationCompat.Action buildUnmuteAction() {
        GxyLogger.i(TAG, "buildUnmuteAction called");
        int requestCode = 2;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent intent = new Intent(context, UIApdateReceiver.class).setAction(UIApdateReceiver.ACTION_UNMUTE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new NotificationCompat.Action.Builder(
                R.drawable.mic_off_24px,
                "Unmute",
                pendingIntent).build();
    }

    private NotificationCompat.Action buildJoinRoomAction() {
        GxyLogger.i(TAG, "buildJoinRoomAction called");
        int requestCode = 3;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent intent = new Intent(context, UIApdateReceiver.class)
                .setAction(UIApdateReceiver.ACTION_JOIN_ROOM);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new NotificationCompat.Action.Builder(
                R.drawable.play_arrow_24px,
                "Join Room",
                pendingIntent).build();
    }

    private NotificationCompat.Action buildLeaveRoomAction() {
        GxyLogger.i(TAG, "buildLeaveRoomAction called");
        int requestCode = 4;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent intent = new Intent(context, UIApdateReceiver.class)
                .setAction(UIApdateReceiver.ACTION_LEAVE_ROOM);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new NotificationCompat.Action.Builder(
                R.drawable.stop_24px,
                "Leave Room",
                pendingIntent).build();
    }
}
