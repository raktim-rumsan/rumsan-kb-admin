"use client";

import { StoreInitializer } from "@/lib/store-hydration";

/**
 * Protected route store initializer that enables auth initialization
 * Use this in protected routes like dashboard
 */
export function ProtectedStoreInitializer({ children }: { children: React.ReactNode }) {
  return <StoreInitializer shouldInitializeAuth={true}>{children}</StoreInitializer>;
}
