"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type RecentState = {
  ids: string[];
  track: (id: string) => void;
};

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      ids: [],
      track: (id) => {
        const ids = [id, ...get().ids.filter((x) => x !== id)].slice(0, 12);
        set({ ids });
      },
    }),
    { name: "achavite-recent" }
  )
);
