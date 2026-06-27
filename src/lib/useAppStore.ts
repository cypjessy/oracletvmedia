"use client";

import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";
import type { ChurchConfig } from "@/lib/churchConfig";

export interface UserDoc {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  church_id: string;
  role: "admin" | "member";
  phone?: string;
  is_verified?: boolean;
  fcm_token?: string;
  notification_preferences?: {
    live_radio: boolean;
    youtube_live: boolean;
    new_sermons: boolean;
    new_photos: boolean;
    event_reminders: boolean;
  };
  created_at: number;
  last_seen?: number;
  onboarding_done?: boolean;
}

interface AppState {
  // Auth
  user: FirebaseUser | null;
  userDoc: UserDoc | null;
  churchConfig: ChurchConfig | null;
  role: "admin" | "member" | null;
  isLoading: boolean;

  // Actions
  setUser: (user: FirebaseUser | null) => void;
  setUserDoc: (doc: UserDoc | null) => void;
  setChurchConfig: (config: ChurchConfig) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  userDoc: null,
  churchConfig: null,
  role: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setUserDoc: (doc) =>
    set({ userDoc: doc, role: doc?.role ?? null }),
  setChurchConfig: (config) => set({ churchConfig: config }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () =>
    set({
      user: null,
      userDoc: null,
      churchConfig: null,
      role: null,
      isLoading: false,
    }),
}));
