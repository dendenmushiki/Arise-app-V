import { create } from "zustand";

export const useStore = create((set) => ({
  token: null,
  user: null,
  showQuestNotifQueued: false,
  setAuth: (token, user) => set({ token, user }),
  updateUser: (userUpdates) => set((state) => ({ user: { ...state.user, ...userUpdates } })),
  setShowQuestNotifQueued: (v) => set({ showQuestNotifQueued: v }),
}));
