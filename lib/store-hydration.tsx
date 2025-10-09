"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { useTenantStore } from "@/stores/tenantStore";
import { useOrgSettingsStore } from "@/stores/orgSettingsStore";
import { useDocumentsStore } from "@/stores/documentsStore";
import type { UserProfile, User, TenantData, OrgSettings, Document } from "@/lib/schemas";

interface HydrationData {
  user?: {
    user: User | null;
    userProfile: UserProfile | null;
  };
  tenant?: {
    tenantId: string | null;
    workspaceData: TenantData | null;
  };
  orgSettings?: {
    orgSettings: OrgSettings | null;
  };
  documents?: {
    documents: Document[];
  };
}

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/sign-up",
  "/auth/verify-otp",
  "/auth/sign-up-success",
];

// Check if the current route is a public route
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/widget");
};

/**
 * Hook to hydrate Zustand stores from server-side data in Next.js 15 app router
 * Should be called once in the root layout or main app component
 */
export function useStoreHydration(data?: HydrationData, shouldInitializeAuth = true) {
  const pathname = usePathname();
  const userStore = useUserStore();
  const tenantStore = useTenantStore();
  const orgSettingsStore = useOrgSettingsStore();
  const documentsStore = useDocumentsStore();

  // Use refs to track initialization to prevent infinite loops
  const initializationRef = useRef({
    userHydrated: false,
    tenantHydrated: false,
    orgSettingsHydrated: false,
    documentsHydrated: false,
    authInitialized: false,
  });

  useEffect(() => {
    const init = initializationRef.current;

    // Only hydrate if we have data and stores haven't been initialized
    if (data?.user && !userStore.isInitialized && !init.userHydrated) {
      userStore.hydrate(data.user);
      init.userHydrated = true;
    }

    if (data?.tenant && !tenantStore.isInitialized && !init.tenantHydrated) {
      tenantStore.hydrate(data.tenant);
      init.tenantHydrated = true;
    }

    if (data?.orgSettings && !orgSettingsStore.isInitialized && !init.orgSettingsHydrated) {
      orgSettingsStore.hydrate(data.orgSettings);
      init.orgSettingsHydrated = true;
    }

    if (data?.documents && !documentsStore.isInitialized && !init.documentsHydrated) {
      documentsStore.hydrate(data.documents);
      init.documentsHydrated = true;
    }

    // Only initialize auth if not on a public route and shouldInitializeAuth is true
    const isOnPublicRoute = isPublicRoute(pathname);

    if (
      !data?.user &&
      !userStore.isInitialized &&
      shouldInitializeAuth &&
      !isOnPublicRoute &&
      !init.authInitialized
    ) {
      userStore.initializeAuth();
      init.authInitialized = true;
    }

    // If no server data provided for tenant, prepare it for initialization
    // but let the userStore handle the actual fetching after auth is complete
    if (!data?.tenant && !tenantStore.isInitialized && !init.tenantHydrated) {
      // Load tenantId from localStorage first
      let storedTenantId = null;
      if (typeof window !== "undefined") {
        storedTenantId = localStorage.getItem("tenantId");
        if (storedTenantId) {
          tenantStore.setTenantId(storedTenantId);
        }
      }

      // Don't mark as initialized yet - just set the loading state to false
      // This allows fetchTenantData to run when user is authenticated
      tenantStore.setLoading(false);
      init.tenantHydrated = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, shouldInitializeAuth, pathname]);
}

/**
 * Client component that handles store initialization
 * Use this in your layout.tsx after QueryProvider
 */
export function StoreInitializer({
  children,
  hydrationData,
  shouldInitializeAuth = true,
}: {
  children: React.ReactNode;
  hydrationData?: HydrationData;
  shouldInitializeAuth?: boolean;
}) {
  useStoreHydration(hydrationData, shouldInitializeAuth);

  return <>{children}</>;
}

/**
 * Utility to prepare hydration data on the server side
 * Call this in your server components to prepare initial state
 */
export async function prepareHydrationData(): Promise<HydrationData> {
  // In a real implementation, you would fetch initial data here
  // For now, we'll return empty data and let client-side initialization handle it
  return {};
}

/**
 * Hook to get current workspace orchestrator with query client integration
 * Use this in components that need to switch workspaces
 */
export function useWorkspaceSwitcher() {
  const { switchWorkspace } = useTenantStore();

  return {
    switchWorkspace,
    // You can add more workspace-related utilities here
  };
}

/**
 * Function to manually initialize authentication after successful login
 * Call this after user verification/login is complete
 */
export function initializeAuthAfterLogin() {
  // Import stores dynamically to avoid hydration issues
  import("@/stores/userStore").then(({ useUserStore }) => {
    const userStore = useUserStore.getState();

    // Initialize auth if not already done
    if (!userStore.isInitialized) {
      userStore.initializeAuth();
    }
  });

  import("@/stores/tenantStore").then(({ useTenantStore }) => {
    const tenantStore = useTenantStore.getState();

    // Only initialize if not already initialized
    if (!tenantStore.isInitialized) {
      // Load tenantId from localStorage if available
      if (typeof window !== "undefined") {
        const storedTenantId = localStorage.getItem("tenantId");
        if (storedTenantId) {
          tenantStore.setTenantId(storedTenantId);
        }
      }
      // Don't mark as initialized yet - let fetchTenantData handle that
      // This allows the auth flow to properly fetch tenant data and set the tenant ID
    }
  });
}
