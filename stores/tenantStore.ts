"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { TenantResponseSchema, type TenantData, type Team } from "@/lib/schemas";
import { getAuthToken } from "@/lib/utils";

import API_BASE_URL from "@/constants";

interface TenantState {
  // State
  tenantId: string | null;
  workspaceData: TenantData | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
  isSwitching: boolean;

  // Actions
  setTenantId: (id: string | null) => void;
  setWorkspaceData: (data: TenantData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  clearTenant: () => void;
  fetchTenantData: () => Promise<void>;
  switchWorkspace: (newTenantId: string) => Promise<void>;

  // Internal actions for hydration
  hydrate: (data: { tenantId: string | null; workspaceData: TenantData | null }) => void;
}

export const useTenantStore = create<TenantState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tenantId: null,
      workspaceData: null,
      isLoading: true,
      isInitialized: false,
      error: null,
      isSwitching: false,

      // Actions
      setTenantId: (id) => {
        console.debug("[tenantStore] setTenantId called with:", id);
        set({ tenantId: id }, false, "setTenantId");
        if (typeof window !== "undefined") {
          if (id) {
            localStorage.setItem("tenantId", id);
            console.debug("[tenantStore] localStorage.setItem tenantId:", id);
          } else {
            localStorage.removeItem("tenantId");
            console.debug("[tenantStore] localStorage.removeItem tenantId");
          }
        }
      },

      setWorkspaceData: (data) => {
        set({ workspaceData: data }, false, "setWorkspaceData");
      },

      setLoading: (loading) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error) => {
        set({ error }, false, "setError");
      },

      clearTenant: () => {
        console.debug("[tenantStore] clearTenant called");
        set(
          {
            tenantId: null,
            workspaceData: null,
            error: null,
            isLoading: false,
          },
          false,
          "clearTenant"
        );

        if (typeof window !== "undefined") {
          localStorage.removeItem("tenantId");
          console.debug("[tenantStore] localStorage.removeItem tenantId (from clearTenant)");
        }
      },

      fetchTenantData: async () => {
        // Prevent concurrent calls
        if (get().isLoading) {
          return;
        }

        set({ isLoading: true, error: null }, false, "fetchTenantData:start");

        try {
          const authToken = getAuthToken();
          if (!authToken) {
            // Don't throw error if no auth token - user might not be logged in yet
            set(
              {
                isLoading: false,
                isInitialized: true,
                error: null,
              },
              false,
              "fetchTenantData:noAuth"
            );
            return;
          }

          const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/orgs/my-workspaces`, {
            method: "GET",
            headers: {
              accept: "*/*",
              access_token: authToken,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch tenant data: ${response.statusText}`);
          }

          const rawData = await response.json();
          const validatedData = TenantResponseSchema.parse(rawData);

          set(
            {
              workspaceData: validatedData.data,
              isLoading: false,
              error: null,
              isInitialized: true,
            },
            false,
            "fetchTenantData:success"
          );

          // Auto-set tenantId to personal workspace if not already set
          const currentTenantId = get().tenantId;
          if (!currentTenantId && validatedData.data.personal?.slug) {
            get().setTenantId(validatedData.data.personal.slug);
          }
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error("Unknown error");
          set(
            {
              error: errorObj,
              isLoading: false,
              isInitialized: true,
            },
            false,
            "fetchTenantData:error"
          );
          console.error("Error fetching tenant data:", errorObj);
        }
      },

      switchWorkspace: async (newTenantId: string) => {
        const currentTenantId = get().tenantId;

        // Don't switch if already on the same workspace
        if (currentTenantId === newTenantId) {
          return;
        }

        set({ isSwitching: true, error: null }, false, "switchWorkspace:start");

        try {
          // Step 1: Immediately reset dependent stores to avoid stale data flashes
          const { useOrgSettingsStore } = await import("@/stores/orgSettingsStore");
          const { useDocumentsStore } = await import("@/stores/documentsStore");

          useOrgSettingsStore.getState().reset();
          useDocumentsStore.getState().reset();

          // Step 2: Verify the new tenant exists in our workspace data
          const workspaceData = get().workspaceData;
          let targetWorkspace: Team | null = null;

          if (workspaceData?.personal?.slug === newTenantId) {
            targetWorkspace = workspaceData.personal;
          } else {
            targetWorkspace =
              workspaceData?.teams?.find((team) => team.slug === newTenantId) || null;
          }

          if (!targetWorkspace) {
            throw new Error(`Workspace with ID "${newTenantId}" not found`);
          }
          get().setTenantId(newTenantId);
          set({ isSwitching: false }, false, "switchWorkspace:success");
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error("Failed to switch workspace");
          set(
            {
              tenantId: currentTenantId,
              error: errorObj,
              isSwitching: false,
            },
            false,
            "switchWorkspace:error"
          );

          // Restore tenantId in localStorage
          if (typeof window !== "undefined") {
            if (currentTenantId) {
              localStorage.setItem("tenantId", currentTenantId);
            } else {
              localStorage.removeItem("tenantId");
            }
          }

          console.error("Error switching workspace:", errorObj);
          throw errorObj; // Re-throw for component error handling
        }
      },

      hydrate: (data) => {
        set(
          {
            tenantId: data.tenantId,
            workspaceData: data.workspaceData,
            isLoading: false,
            isInitialized: true,
          },
          false,
          "hydrate"
        );
      },
    }),
    {
      name: "tenant-store",
    }
  )
);

// Enhanced switchWorkspace function that can accept queryClient
// Note: Using unknown type for queryClient to avoid circular dependencies
export const createSwitchWorkspaceWithQuery = (queryClient: unknown) => {
  return async (newTenantId: string) => {
    const store = useTenantStore.getState();

    try {
      await store.switchWorkspace(newTenantId);

      // Cast queryClient to any for method access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = queryClient as any;

      // Invalidate tenant-scoped queries
      await client.invalidateQueries({
        predicate: (query: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q = query as any;
          const queryKey = q.queryKey;
          // Invalidate queries that depend on tenantId
          return (
            queryKey.includes("orgSettings") ||
            queryKey.includes("documents") ||
            queryKey.includes("members") ||
            queryKey.includes("tenant")
          );
        },
      });

      // Optionally refetch critical queries immediately
      await Promise.all([
        client.refetchQueries({ queryKey: ["orgSettings"] }),
        client.refetchQueries({ queryKey: ["documents", newTenantId] }),
      ]);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
      throw error;
    }
  };
};

// Selector hooks for better performance
export const useTenantId = () => useTenantStore((state) => state.tenantId);
export const useWorkspaceData = () => useTenantStore((state) => state.workspaceData);
export const useTenantLoading = () => useTenantStore((state) => state.isLoading);
export const useTenantError = () => useTenantStore((state) => state.error);
export const useIsSwitchingWorkspace = () => useTenantStore((state) => state.isSwitching);

// Actions hooks - individual hooks to prevent re-render issues
export const useSetTenantId = () => useTenantStore((state) => state.setTenantId);
export const useSetWorkspaceData = () => useTenantStore((state) => state.setWorkspaceData);
export const useSetTenantLoading = () => useTenantStore((state) => state.setLoading);
export const useSetTenantError = () => useTenantStore((state) => state.setError);
export const useClearTenant = () => useTenantStore((state) => state.clearTenant);
export const useFetchTenantData = () => useTenantStore((state) => state.fetchTenantData);
export const useSwitchWorkspace = () => useTenantStore((state) => state.switchWorkspace);

// Legacy actions hook - kept for backward compatibility but avoid using in components
// that re-render frequently as it creates a new object on each render
export const useTenantActions = () =>
  useTenantStore((state) => ({
    setTenantId: state.setTenantId,
    setWorkspaceData: state.setWorkspaceData,
    setLoading: state.setLoading,
    setError: state.setError,
    clearTenant: state.clearTenant,
    fetchTenantData: state.fetchTenantData,
    switchWorkspace: state.switchWorkspace,
  }));

// Convenience hook similar to the original useTenant
// Note: Use individual hooks instead of this when possible to avoid re-render issues
export const useTenant = () => {
  const tenantId = useTenantId();
  const workspaceData = useWorkspaceData();
  const isLoading = useTenantLoading();
  const error = useTenantError();
  const setTenantId = useSetTenantId();
  const setWorkspaceData = useSetWorkspaceData();
  const setLoading = useSetTenantLoading();
  const setError = useSetTenantError();
  const clearTenant = useClearTenant();
  const fetchTenantData = useFetchTenantData();
  const switchWorkspace = useSwitchWorkspace();

  return {
    tenantId,
    workspaceData,
    isLoading,
    error,
    setTenantId,
    setWorkspaceData,
    setLoading,
    setError,
    clearTenant,
    fetchTenantData,
    switchWorkspace,
  };
};
