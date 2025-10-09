"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type OrgSettings } from "@/lib/schemas";

interface OrgSettingsState {
  // State
  orgSettings: OrgSettings | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;

  // Actions
  setOrgSettings: (settings: OrgSettings | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;

  // Internal actions for hydration
  hydrate: (data: { orgSettings: OrgSettings | null }) => void;
}

export const useOrgSettingsStore = create<OrgSettingsState>()(
  devtools(
    (set) => ({
      // Initial state
      orgSettings: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Actions
      setOrgSettings: (settings) => {
        set(
          {
            orgSettings: settings,
            error: null,
          },
          false,
          "setOrgSettings"
        );
      },

      setLoading: (loading) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error) => {
        set(
          {
            error,
            isLoading: false,
          },
          false,
          "setError"
        );
      },

      reset: () => {
        set(
          {
            orgSettings: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          },
          false,
          "reset"
        );
      },

      hydrate: (data) => {
        set(
          {
            orgSettings: data.orgSettings,
            isLoading: false,
            isInitialized: true,
          },
          false,
          "hydrate"
        );
      },
    }),
    {
      name: "org-settings-store",
    }
  )
);

// Selector hooks for better performance
export const useOrgSettings = () => useOrgSettingsStore((state) => state.orgSettings);
export const useOrgSettingsLoading = () => useOrgSettingsStore((state) => state.isLoading);
export const useOrgSettingsError = () => useOrgSettingsStore((state) => state.error);
export const useOrgSettingsInitialized = () => useOrgSettingsStore((state) => state.isInitialized);

// Actions hooks - individual hooks to prevent re-render issues
export const useSetOrgSettings = () => useOrgSettingsStore((state) => state.setOrgSettings);
export const useSetOrgSettingsLoading = () => useOrgSettingsStore((state) => state.setLoading);
export const useSetOrgSettingsError = () => useOrgSettingsStore((state) => state.setError);
export const useResetOrgSettings = () => useOrgSettingsStore((state) => state.reset);

// Legacy actions hook - kept for backward compatibility but avoid using in components
// that re-render frequently as it creates a new object on each render
export const useOrgSettingsActions = () =>
  useOrgSettingsStore((state) => ({
    setOrgSettings: state.setOrgSettings,
    setLoading: state.setLoading,
    setError: state.setError,
    reset: state.reset,
  }));

// Convenience hook similar to the original useOrg
// Note: Use individual hooks instead of this when possible to avoid re-render issues
export const useOrg = () => {
  const orgSettings = useOrgSettings();
  const isLoading = useOrgSettingsLoading();
  const error = useOrgSettingsError();
  const setOrgSettings = useSetOrgSettings();
  const setLoading = useSetOrgSettingsLoading();
  const setError = useSetOrgSettingsError();
  const reset = useResetOrgSettings();

  return {
    orgSettings,
    isLoading,
    error,
    setOrgSettings,
    setLoading,
    setError,
    reset,
  };
};
