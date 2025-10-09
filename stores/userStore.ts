"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import { UserProfileSchema, UserSchema, type UserProfile, type User } from "@/lib/schemas";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserState {
  // State
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  clearUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUserProfile: (profile: UserProfile | null) => void;
  updateUser: (userData: User | null) => void;

  // Internal actions for hydration
  hydrate: (data: { user: User | null; userProfile: UserProfile | null }) => void;
}

const createUserFromSupabase = (supabaseUser: SupabaseUser): User => {
  return UserSchema.parse({
    id: supabaseUser.id,
    email: supabaseUser.email,
    phone: supabaseUser.phone,
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at,
    user_metadata: supabaseUser.user_metadata,
  });
};

const createUserProfileFromSupabase = (supabaseUser: SupabaseUser): UserProfile => {
  const avatarUrl = supabaseUser.user_metadata?.avatar_url;

  return UserProfileSchema.parse({
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || "",
    avatar_url: avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : undefined,
    phone: supabaseUser.phone || "",
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at,
  });
};

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      userProfile: null,
      isLoading: true,
      isInitialized: false,

      // Actions
      setUser: (user) => {
        set({ user }, false, "setUser");
        if (user) {
          // Convert User to SupabaseUser-like object for profile creation
          const supabaseUserLike = {
            ...user,
            email: user.email || "",
            user_metadata: user.user_metadata || {},
          } as SupabaseUser;
          const profile = createUserProfileFromSupabase(supabaseUserLike);
          get().updateUserProfile(profile);
        }
      },

      setUserProfile: (profile) => {
        set({ userProfile: profile }, false, "setUserProfile");
        // Persist to localStorage
        if (typeof window !== "undefined") {
          if (profile) {
            localStorage.setItem("userProfile", JSON.stringify(profile));
          } else {
            localStorage.removeItem("userProfile");
          }
        }
      },

      clearUser: async () => {
        set(
          {
            user: null,
            userProfile: null,
            isLoading: false,
          },
          false,
          "clearUser"
        );

        if (typeof window !== "undefined") {
          localStorage.removeItem("userProfile");
        }
      },

      updateUserProfile: (profile) => {
        get().setUserProfile(profile);
      },

      updateUser: (userData) => {
        set({ user: userData }, false, "updateUser");
        if (userData) {
          // Convert User to SupabaseUser-like object for profile creation
          const supabaseUserLike = {
            ...userData,
            email: userData.email || "",
            user_metadata: userData.user_metadata || {},
          } as SupabaseUser;
          const profile = createUserProfileFromSupabase(supabaseUserLike);
          get().updateUserProfile(profile);
        }
      },

      initializeAuth: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true }, false, "initializeAuth:start");

        try {
          const supabase = createClient();

          // Get initial session
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.error("Error getting session:", error);
          } else if (session?.user) {
            const user = createUserFromSupabase(session.user);
            const profile = createUserProfileFromSupabase(session.user);

            set(
              {
                user,
                userProfile: profile,
                isLoading: false,
                isInitialized: true,
              },
              false,
              "initializeAuth:session"
            );
           
          } else {
            set(
              {
                user: null,
                userProfile: null,
                isLoading: false,
                isInitialized: true,
              },
              false,
              "initializeAuth:noSession"
            );
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
              const user = createUserFromSupabase(session.user);
              const profile = createUserProfileFromSupabase(session.user);

              set(
                {
                  user,
                  userProfile: profile,
                  isLoading: false,
                },
                false,
                "authStateChange:signedIn"
              );

            } else if (event === "SIGNED_OUT") {
              await get().clearUser();
              // clearUser now handles tenant data clearing
            } else if (event === "TOKEN_REFRESHED" && session?.user) {
              const user = createUserFromSupabase(session.user);
              set({ user }, false, "authStateChange:tokenRefreshed");
            }
          });
        } catch (error) {
          console.error("Error in initializeAuth:", error);
          set(
            {
              isLoading: false,
              isInitialized: true,
            },
            false,
            "initializeAuth:error"
          );
        }
      },

      hydrate: (data) => {
        set(
          {
            user: data.user,
            userProfile: data.userProfile,
            isLoading: false,
            isInitialized: true,
          },
          false,
          "hydrate"
        );
      },
    }),
    {
      name: "user-store",
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useUserStore((state) => state.user);
export const useUserProfile = () => useUserStore((state) => state.userProfile);
export const useUserLoading = () => useUserStore((state) => state.isLoading);
export const useUserInitialized = () => useUserStore((state) => state.isInitialized);

// Actions hooks - individual hooks to prevent re-render issues
export const useSetUser = () => useUserStore((state) => state.setUser);
export const useSetUserProfile = () => useUserStore((state) => state.setUserProfile);
export const useClearUser = () => useUserStore((state) => state.clearUser);
export const useInitializeAuth = () => useUserStore((state) => state.initializeAuth);
export const useUpdateUserProfile = () => useUserStore((state) => state.updateUserProfile);
export const useUpdateUser = () => useUserStore((state) => state.updateUser);

// Legacy actions hook - kept for backward compatibility but avoid using in components
// that re-render frequently as it creates a new object on each render
export const useUserActions = () =>
  useUserStore((state) => ({
    setUser: state.setUser,
    setUserProfile: state.setUserProfile,
    clearUser: state.clearUser,
    initializeAuth: state.initializeAuth,
    updateUserProfile: state.updateUserProfile,
    updateUser: state.updateUser,
  }));
