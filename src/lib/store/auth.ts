"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Customer } from "../types";

type AuthState = {
  customers: Customer[];
  currentPhone?: string;
  register: (c: Customer) => { ok: boolean; error?: string };
  login: (phone: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  currentCustomer: () => Customer | undefined;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      customers: [],
      currentPhone: undefined,
      register: (c) => {
        if (get().customers.some((x) => x.phone === c.phone)) {
          return { ok: false, error: "Un compte existe déjà avec ce numéro." };
        }
        set((s) => ({ customers: [...s.customers, c], currentPhone: c.phone }));
        return { ok: true };
      },
      login: (phone, password) => {
        const found = get().customers.find((c) => c.phone === phone);
        if (!found) return { ok: false, error: "Aucun compte trouvé pour ce numéro." };
        if (found.password !== password) return { ok: false, error: "Mot de passe incorrect." };
        set({ currentPhone: phone });
        return { ok: true };
      },
      logout: () => set({ currentPhone: undefined }),
      currentCustomer: () => get().customers.find((c) => c.phone === get().currentPhone),
    }),
    { name: "achavite-auth" }
  )
);

type AdminAuthState = {
  isAuthed: boolean;
  login: (password: string) => boolean;
  logout: () => void;
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthed: false,
      login: (password) => {
        const ok = password === "achavite2026";
        if (ok) set({ isAuthed: true });
        return ok;
      },
      logout: () => set({ isAuthed: false }),
    }),
    { name: "achavite-admin-auth" }
  )
);
