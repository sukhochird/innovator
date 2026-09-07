import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "./types";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("carq_access");
          localStorage.removeItem("carq_refresh");
        }
        set({ user: null });
      },
    }),
    { name: "carq-auth" },
  ),
);
