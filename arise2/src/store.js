import { create } from "zustand";

export const useStore = create((set) => ({
  token: null,
  user: null,
  showQuestNotifQueued: false,
  setAuth: (token, user) => set({ token, user }),
  setShowQuestNotifQueued: (v) => set({ showQuestNotifQueued: v }),
}));
