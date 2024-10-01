import { create } from 'zustand';
import mqtt from '../shared/mqtt';

export const useNotificationStore = create((set) => ({
  init: () => {

    const notifyMe = (title, message, tout) => {
      if (!!window.Notification) {
        if (Notification.permission !== 'granted') Notification.requestPermission();
        else {
          let notification     = new Notification(title + ':', {
            icon              : './nlogo.png',
            body              : message,
            requireInteraction: tout,
          });
          notification.onclick = function () {
            window.focus();
          };
          notification.onshow  = function () {
            var audio = new Audio('./plucky.mp3');
            audio.play();
          };
        }
      }
    };
    // Private chat
    mqtt.mq.on('MqttPrivateMessage', (data) => {
      let message = JSON.parse(data);
      if (message?.type === 'client-chat') {
        notifyMe('Arvut System', message.text, true);
      }
      //TODO: Make private dialog exchange
    });

  }
}));