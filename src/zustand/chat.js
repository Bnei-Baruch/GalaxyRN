import { create } from "zustand";
import produce from "immer";
import { getDateString } from "../shared/tools";
import { modalModes } from "./helper";
import Api from "../shared/Api";
import { isRTLString } from "../chat/helper";
import { useUserStore } from "./user";
import { debug, info, warn, error } from "../services/logger";

const NAMESPACE = 'Chat';

const buildMsg = (msg) => ({ ...msg, time: getDateString() });

export const useChatStore = create((set, get) => ({
  mode: modalModes.close,
  setChatMode: (mode) => set(() => ({ mode })),
  supportCount: 0,
  chatNewMsgs: 0,
  supportMsgs: [],
  roomMsgs: [],
  questions: [],
  resetChatNewMsgs: () => set(() => ({ chatNewMsgs: 0 })),
  addRoomMsg: (data) => {
    let json = JSON.parse(data);
    if (json?.type === "client-chat") {
      const msg = buildMsg(json);
      debug(NAMESPACE, "Adding room message:", msg);
      set(
        produce((state) => {
          state.chatNewMsgs++;
          state.roomMsgs.push(msg);
        })
      );
    }
  },
  addSupportMsg: (data) => {
    let json = JSON.parse(data);
    if (json?.type === "client-chat") {
      const msg = buildMsg(json);
      debug(NAMESPACE, "Adding support message:", msg);
      set(
        produce((state) => {
          state.supportCount++;
          state.supportMsgs.push(msg);
        })
      );
    }
  },
  cleanChat: () => {
    set(
      produce((state) => {
        state.supportCount = 0;
        state.supportMsgs = [];
        state.chatNewMsgs = 0;
        state.roomMsgs = [];
      })
    );
  },
  sendQuestion: async (data) => {
    try {
      info(NAMESPACE, "Sending question with data:", data);
      await Api.sendQuestion(data);

      try {
        const { user } = useUserStore.getState();
        if (user && user.id) {
          debug(NAMESPACE, "User ID for fetching questions:", user.id);
          get().fetchQuestions();
        } else {
          error(NAMESPACE, "User ID is undefined, cannot fetch questions");
        }
      } catch (error) {
        error(NAMESPACE, "Error getting user ID:", error);
      }
    } catch (error) {
      error(NAMESPACE, "Error sending question:", error);
    }
  },
  fetchQuestions: async () => {
    const { user } = useUserStore.getState();
    if (!user?.id) {
      error(NAMESPACE, "User ID for fetching questions:", user?.id);
      return;
    }
    const data = { serialUserId: useUserStore.getState().user.id };

    try {
      const { feed } = await Api.fetchQuestions(data);
      debug(NAMESPACE, "Fetched questions:", feed);

      if (!feed || !Array.isArray(feed)) {
        error(NAMESPACE, "Invalid feed data:", feed);
        set({ questions: [] });
        return;
      }

      const formattedQuestions = feed
        .map((q) => {
          try {
            if (!q || !q.question || !q.user) {
              error(NAMESPACE, "Invalid question object:", q);
              return null;
            }

            const {
              question: { content },
              user: { galaxyRoom: room, name },
              timestamp,
            } = q;

            // Make sure content is a string
            const textContent = content ? String(content) : "";

            return {
              text: textContent,
              user: {
                display: name || "Unknown",
                room: room || "Unknown",
              },
              time: getDateString(new Date(timestamp || Date.now())),
              direction: isRTLString(textContent) ? "rtl" : "ltr",
              textAlign: isRTLString(textContent) ? "right" : "left",
            };
          } catch (error) {
            error(NAMESPACE, "Error processing question:", q, error);
            return null;
          }
        })
        .filter(Boolean);

      set({ questions: formattedQuestions });
    } catch (error) {
      error(NAMESPACE, "Error fetching questions:", error);
      set({ questions: [] });
    }
  },
}));
