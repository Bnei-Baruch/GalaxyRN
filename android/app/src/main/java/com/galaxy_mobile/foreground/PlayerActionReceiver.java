package com.galaxy_mobile.foreground;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

import com.galaxy_mobile.SendEventToClient;


public class PlayerActionReceiver extends BroadcastReceiver {
  public static final String ACTION_JOIN_ROOM = "com.galaxy_mobile.ACTION_JOIN_ROOM";
  public static final String ACTION_LEAVE_ROOM = "com.galaxy_mobile.ACTION_LEAVE_ROOM";
  public static final String ACTION_TOGGLE_MUTE = "com.galaxy_mobile.ACTION_TOGGLE_MUTE";

  @Override public void onReceive(Context context, Intent intent) {
    String action = intent.getAction();
    if (ACTION_JOIN_ROOM.equals(action)) {
      SendEventToClient.sendEvent("joinRoom", null);      
    } else if (ACTION_LEAVE_ROOM.equals(action)) {
      SendEventToClient.sendEvent("leaveRoom", null);
    } else if (ACTION_TOGGLE_MUTE.equals(action)) {
      SendEventToClient.sendEvent("toggleMute", null);
    }
  }
}