"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  userProfile: UserProfile | null;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  isLoading: boolean;
  clearUser: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        } else if (session?.user) {
          setUser(session.user);
          // Create user profile from session data
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "",
            avatar_url: session.user.user_metadata?.avatar_url || "",
            phone: session.user.phone || "",
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
          };
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        // Create user profile from session data
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "",
          avatar_url: session.user.user_metadata?.avatar_url || "",
          phone: session.user.phone || "",
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        };
        setUserProfile(profile);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserProfile(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const clearUser = () => {
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = (profile: UserProfile | null) => {
    setUserProfile(profile);
    // Optionally store in localStorage for persistence
    if (profile) {
      localStorage.setItem("userProfile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("userProfile");
    }
  };

  const updateUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      // Create profile from user data when user is set
      const profile: UserProfile = {
        id: userData.id,
        email: userData.email || "",
        name: userData.user_metadata?.name || userData.user_metadata?.full_name || "",
        avatar_url: userData.user_metadata?.avatar_url || "",
        phone: userData.phone || "",
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
      updateUserProfile(profile);
    }
  };

  const value: UserContextType = {
    user,
    userProfile,
    setUser: updateUser,
    setUserProfile: updateUserProfile,
    isLoading,
    clearUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export type { UserProfile, UserContextType };
