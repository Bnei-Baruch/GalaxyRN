package com.galaxy_mobile.foreground;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.galaxy_mobile.SendEventToClient;
import com.galaxy_mobile.logger.GxyLogger;

public class PlayerActionReceiver extends BroadcastReceiver {
  private static final String TAG = "PlayerActionReceiver";

  public static final String ACTION_JOIN_ROOM = "com.galaxy_mobile.ACTION_JOIN_ROOM";
  public static final String ACTION_LEAVE_ROOM = "com.galaxy_mobile.ACTION_LEAVE_ROOM";
  public static final String ACTION_MUTE = "com.galaxy_mobile.ACTION_MUTE";
  public static final String ACTION_UNMUTE = "com.galaxy_mobile.ACTION_UNMUTE";
  public static final String PLAYER_ACTION = "nativePlayerAction";

  @Override
  public void onReceive(Context context, Intent intent) {
    String action = intent.getAction();
    GxyLogger.i(TAG, "onReceive called with action: " + action);
    WritableMap params = Arguments.createMap();
    if (ACTION_JOIN_ROOM.equals(action)) {
      params.putString("action", "joinRoom");
      SendEventToClient.sendEvent(PLAYER_ACTION, params);
    } else if (ACTION_LEAVE_ROOM.equals(action)) {
      params.putString("action", "leaveRoom");
      SendEventToClient.sendEvent(PLAYER_ACTION, params);
    } else if (ACTION_MUTE.equals(action)) {
      params.putString("action", "mute");
      SendEventToClient.sendEvent(PLAYER_ACTION, params);
    } else if (ACTION_UNMUTE.equals(action)) {
      params.putString("action", "unmute");
      SendEventToClient.sendEvent(PLAYER_ACTION, params);
    }
  }
}