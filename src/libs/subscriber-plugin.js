import { randomString } from "../shared/tools";
import { EventEmitter } from "events";
import log from "loglevel";
import mqtt from "../shared/mqtt";
import { STUN_SRV_GXY } from "@env";
import { RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import BackgroundTimer from "react-native-background-timer";

export class SubscriberPlugin extends EventEmitter {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    super();
    this.id = randomString(12);
    this.janus = undefined;
    this.janusHandleId = undefined;
    this.pluginName = "janus.plugin.videoroom";
    this.roomId = null;
    this.onTrack = null;
    this.onUpdate = null;
    this.iceState = null;
    this.iceFailed = null;
    this.pc = new RTCPeerConnection({
      iceServers: list,
    });
    this.configure = this.configure.bind(this);
  }

  getPluginName() {
    return this.pluginName;
  }

  transaction(message, additionalFields, replyType) {
    const payload = Object.assign({}, additionalFields, {
      handle_id: this.janusHandleId,
    });

    if (!this.janus) {
      return Promise.reject(new Error("JanusPlugin is not connected"));
    }
    return this.janus.transaction(message, payload, replyType);
  }

  sub(subscription) {
    const body = { request: "subscribe", streams: subscription };
    return new Promise((resolve, reject) => {
      this.transaction("message", { body }, "event")
        .then((param) => {
          log.info("[subscriber] Subscribe to: ", param);
          const { data, json } = param;

          if (data?.videoroom === "updated") {
            log.info("[subscriber] Streams updated: ", data.streams);
            this.onUpdate(data.streams);
          }

          if (json?.jsep) {
            log.debug("[subscriber] Got jsep: ", json.jsep);
            this.handleJsep(json.jsep);
          }

          if (data) resolve(data);
        })
        .catch((err) => {
          log.error("[subscriber] Subscribe to: ", err);
          reject(err);
        });
    });
  }

  unsub(streams) {
    log.info("Unsubscribe from streams: ", streams);
    const body = { request: "unsubscribe", streams };
    return new Promise((resolve, reject) => {
      this.transaction("message", { body }, "event")
        .then((param) => {
          log.info("[subscriber] Unsubscribe from: ", param);
          const { data, json } = param;

          if (data?.videoroom === "updated") {
            log.info("[subscriber] Streams updated: ", data.streams);
            this.onUpdate(data.streams);
          }

          if (json?.jsep) {
            log.debug("[subscriber] Got jsep: ", json.jsep);
            this.handleJsep(json.jsep);
          }

          if (data) resolve(data);
        })
        .catch((err) => {
          log.error("[subscriber] Unsubscribe from: ", err);
          reject(err);
        });
    });
  }

  join(subscription, roomId) {
    this.roomId = roomId;
    const body = {
      request: "join",
      use_msid: true,
      room: roomId,
      ptype: "subscriber",
      streams: subscription,
    };
    return new Promise((resolve, reject) => {
      this.transaction("message", { body }, "event")
        .then((param) => {
          log.debug("[subscriber] join: ", param);
          const { data, json } = param;

          if (data) {
            resolve(data);
            this.initPcEvents();
          }

          if (json?.jsep) {
            log.debug("[subscriber] Got jsep: ", json.jsep);
            this.handleJsep(json.jsep);
          }
        })
        .catch((err) => {
          log.error("[subscriber] join: ", err);
          reject(err);
        });
    });
  }

  configure() {
    console.log("Subscriber plugin configure");
    const body = { request: "configure", restart: true };
    return this.transaction("message", { body }, "event")
      .then((param) => {
        log.info("[subscriber] iceRestart: ", param);
        const { json } = param || {};
        if (json?.jsep) {
          log.debug("[subscriber] Got jsep: ", json.jsep);
          this.handleJsep(json.jsep);
        }
      })
      .catch((err) => {
        console.error("Subscriber plugin configure", err);
      });
  }

  handleJsep(jsep) {
    const sessionDescription = new RTCSessionDescription(jsep);
    this.pc
      .setRemoteDescription(sessionDescription)
      .then(() => {
        return this.pc.createAnswer();
      })
      .then((answer) => {
        log.debug("[subscriber] Answer created", answer);
        this.pc
          .setLocalDescription(answer)
          .then((data) => {
            log.debug("[subscriber] setLocalDescription", data);
          })
          .catch((error) => log.error(error, answer));
        this.start(answer);
      });
  }

  start(answer) {
    const body = { request: "start", room: this.roomId };
    return new Promise((resolve, reject) => {
      const jsep = answer;
      this.transaction("message", { body, jsep }, "event")
        .then((param) => {
          const { data, json } = param || {};
          log.info("[subscriber] start: ", param);
          resolve();
        })
        .catch((err) => {
          log.error("[subscriber] start", err, jsep);
          reject(err);
        });
    });
  }

  initPcEvents() {
    if (this.pc) {
      this.pc.addEventListener("connectionstatechange", (e) => {
        log.debug("[subscriber] ICE State: ", e.target.connectionState);
        this.iceState = e.target.connectionState;
        if (this.iceState === "disconnected") {
          this.iceRestart();
        }
        // ICE restart does not help here, peer connection will be down
        if (this.iceState === "failed") {
          if (typeof this.iceFailed === "function") {
            this.iceFailed();
          }
        }
      });
      this.pc.addEventListener("icecandidate", (e) => {
        log.debug("[subscriber] onicecandidate set", e.candidate);
        let candidate = { completed: true };
        if (
          !e.candidate ||
          e.candidate.candidate.indexOf("endOfCandidates") > 0
        ) {
          log.debug("[subscriber] End of candidates");
        } else {
          // JSON.stringify doesn't work on some WebRTC objects anymore
          // See https://code.google.com/p/chromium/issues/detail?id=467366
          candidate = {
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
          };
        }
        if (candidate) {
          return this.transaction("trickle", { candidate });
        }
      });
      this.pc.addEventListener("track", (e) => {
        log.debug("[subscriber] Got track: ", e);
        this.onTrack(e.track, e.streams[0], true);

        e.track.onmute = (ev) => {
          log.debug("[subscriber] onmute event: ", ev);
        };

        e.track.onunmute = (ev) => {
          log.debug("[subscriber] onunmute event: ", ev);
        };

        e.track.onended = (ev) => {
          log.debug("[subscriber] onended event: ", ev);
        };
      });
    }
  }

  async iceRestart(attempt = 0) {
    try {
      BackgroundTimer.setTimeout(() => {
        if (
          (attempt < 10 && this.iceState !== "disconnected") ||
          !this.janus?.isConnected
        ) {
          return;
        } else if (mqtt.mq.connected) {
          log.debug("[streaming] - Trigger ICE Restart - ");
          this.configure();
        } else if (attempt >= 10) {
          log.error("Ice restart bug: [subscriber] - ICE Restart failed - ");
          if (typeof this.iceFailed === "function") {
            this.iceFailed();
          }
          return;
        }
        log.debug("[streaming] ICE Restart try: " + attempt);
        return this.iceRestart(attempt + 1);
      }, 1000);
    } catch (e) {
      console.error("Subscriber plugin iceRestart", e);
    }
  }

  success(janus, janusHandleId) {
    this.janus = janus;
    this.janusHandleId = janusHandleId;

    return this;
  }

  error(cause) {
    // Couldn't attach to the plugin
  }

  onmessage(data, json) {
    log.info("[subscriber] onmessage: ", data, json);
    if (data?.videoroom === "updated") {
      log.info("[subscriber] Streams updated: ", data.streams);
      this.onUpdate(data.streams);
    }

    if (json?.jsep) {
      log.debug("[subscriber] Handle jsep: ", json.jsep);
      this.handleJsep(json.jsep);
    }
  }

  oncleanup() {
    log.info("[subscriber] - oncleanup - ");
    // PeerConnection with the plugin closed, clean the UI
    // The plugin handle is still valid so we can create a new one
  }

  detached() {
    log.info("[subscriber] - detached - ");
    // Connection with the plugin closed, get rid of its features
    // The plugin handle is not valid anymore
  }

  hangup() {
    log.info("[subscriber] - hangup - ", this.janus);
    this.detach();
  }

  slowLink(uplink, lost, mid) {
    const direction = uplink ? "sending" : "receiving";
    log.info(
      "[subscriber] slowLink on " +
        direction +
        " packets on mid " +
        mid +
        " (" +
        lost +
        " lost packets)"
    );
    //this.emit('slowlink')
  }

  mediaState(media, on) {
    log.info(
      "[subscriber] mediaState: Janus " +
        (on ? "start" : "stop") +
        " receiving our " +
        media
    );
    //this.emit('mediaState', medium, on)
  }

  webrtcState(isReady) {
    log.info(
      "[subscriber] webrtcState: RTCPeerConnection is: " +
        (isReady ? "up" : "down")
    );
    if (!isReady && typeof this.iceFailed === "function") {
      this.iceFailed();
    }
  }

  detach() {
    if (this.pc) {
      this.pc.getTransceivers().forEach((transceiver) => {
        if (transceiver) {
          if (transceiver.receiver && transceiver.receiver.track)
            transceiver.receiver.track.stop();
          transceiver.stop();
        }
      });
      this.removeAllListeners();
      this.pc.close();
      this.pc = null;
      this.janus = null;
    }
  }
}
