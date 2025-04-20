import { create } from "zustand";
import produce from "immer";
import { getDateString } from "../shared/tools";
import { modalModes } from "./helper";
import Api from "../shared/Api";
import { isRTLString } from "../chat/helper";
import { useUserStore } from "./user";

const buildMsg = (msg) => ({ ...msg, time: getDateString() });

export const useChatStore = create((set, get) => ({
  mode: modalModes.close,
  setChatMode: (mode) => set(() => ({ mode })),
  supportCount: 0,
  roomCount: 0,
  supportMsgs: [],
  roomMsgs: [],
  questions: [],
  resetRoom: set(() => ({ roomCount: 0 })),
  resetSupport: set(() => ({ supportCount: 0 })),
  addRoomMsg: (data) => {
    let json = JSON.parse(data);
    if (json?.type === "client-chat") {
      const msg  = buildMsg(json);
      console.log("Adding room message:", msg);
      set(
        produce((state) => {
          state.roomCount++;
          state.roomMsgs.push(msg);
        })
      );
    }
  },
  addSupportMsg: (data) => {
    let json = JSON.parse(data);
    if (json?.type === "client-chat") {
      const msg  = buildMsg(json);
      console.log("Adding support message:", msg);
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
        state.roomCount = 0;
        state.roomMsgs = [];
      })
    );
  },
  sendQuestion: async (data) => {
    try {
      console.log("Sending question with data:", data);
      await Api.sendQuestion(data);

      try {
        const { user } = useUserStore.getState();
        if (user && user.id) {
          console.log("User ID for fetching questions:", user.id);
          get().fetchQuestions();
        } else {
          console.error("User ID is undefined, cannot fetch questions");
        }
      } catch (error) {
        console.error("Error getting user ID:", error);
      }
    } catch (error) {
      console.error("Error sending question:", error);
    }
  },
  fetchQuestions: async () => {
    const { user } = useUserStore.getState();
    if (!user?.id) {
      console.error("User ID for fetching questions:", user?.id);
      return;
    }
    const data = { serialUserId: useUserStore.getState().user.id };

    try {
      const { feed } = await Api.fetchQuestions(data);
      console.log("Fetched questions:", feed);
      
      if (!feed || !Array.isArray(feed)) {
        console.error("Invalid feed data:", feed);
        set({ questions: [] });
        return;
      }

      const formattedQuestions = feed
        .map((q) => {
          try {
            if (!q || !q.question || !q.user) {
              console.error("Invalid question object:", q);
              return null;
            }

            const {
              question: { content },
              user: { galaxyRoom: room, name },
              timestamp,
            } = q;

            // Make sure content is a string
            const textContent = content ? String(content) : '';
            
            return {
              text: textContent,
              user: {
                display: name || 'Unknown',
                room: room || 'Unknown',
              },
              time: getDateString(new Date(timestamp || Date.now())),
              direction: isRTLString(textContent) ? "rtl" : "ltr",
              textAlign: isRTLString(textContent) ? "right" : "left",
            };
          } catch (error) {
            console.error("Error processing question:", q, error);
            return null;
          }
        })
        .filter(Boolean);

      set({ questions: formattedQuestions });
    } catch (error) {
      console.error("Error fetching questions:", error);
      set({ questions: [] });
    }
  },
}));
