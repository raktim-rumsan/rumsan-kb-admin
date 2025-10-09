"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTenantQuery } from "@/queries/tenantQuery";
import { getAuthToken } from "@/lib/utils";

interface TenantContextType {
  tenantId: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  clearTenant: () => void;
  setTenantId: (id: string) => void;
  workspaceData: {
    personal: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      isActive: boolean;
      isPersonal: boolean;
      ownerId: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    teams: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      isActive: boolean;
      isPersonal: boolean;
      ownerId: string;
      createdAt: string;
      updatedAt: string;
    }[];
  } | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Initialize tenantId from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTenantId = localStorage.getItem("tenantId");
      if (storedTenantId) {
        setTenantId(storedTenantId);
      }
      setHasLoadedFromStorage(true);
    }
  }, []);

  const { data, isLoading, error, refetch } = useTenantQuery();

  // Update tenantId when data is fetched
  useEffect(() => {
    if (data?.data?.personal?.slug) {
      const slug = data.data.personal.slug;
      setTenantId(slug);

      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("tenantId", slug);
      }
    }
  }, [data]);

  // Force refetch if we don't have tenantId but have auth token
  useEffect(() => {
    if (hasLoadedFromStorage && !tenantId && !isLoading && typeof window !== "undefined") {
      const authToken = getAuthToken();
      if (authToken) {
        refetch();
      }
    }
  }, [hasLoadedFromStorage, tenantId, isLoading, refetch]);

  // Additional effect to try refetching when auth token becomes available
  useEffect(() => {
    const interval = setInterval(() => {
      if (!tenantId && !isLoading && typeof window !== "undefined") {
        const authToken = getAuthToken();
        if (authToken) {
          refetch();
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [tenantId, isLoading, refetch]);

  const clearTenant = () => {
    setTenantId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("tenantId");
    }
  };

  const contextValue: TenantContextType = {
    tenantId,
    isLoading,
    error: error as Error | null,
    refetch,
    clearTenant,
    setTenantId: (id: string) => {
      setTenantId(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("tenantId", id);
      }
    },
    workspaceData: data?.data || null,
  };

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
}

// Hook to use the tenant context
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

// Hook to get just the tenantId (for convenience)
export function useTenantId() {
  const { tenantId } = useTenant();
  return tenantId;
}

// Hook to ensure tenant is loaded
export function useEnsureTenant() {
  const { tenantId, isLoading, refetch } = useTenant();

  useEffect(() => {
    // If we don't have a tenantId and we're not currently loading, try to fetch it
    if (!tenantId && !isLoading && typeof window !== "undefined") {
      const authToken = getAuthToken();
      if (authToken) {
        refetch();
      }
    }
  }, [tenantId, isLoading, refetch]);

  return { tenantId, isLoading };
}
