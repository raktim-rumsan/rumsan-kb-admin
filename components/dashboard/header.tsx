"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  useTenantId,
  useSetTenantId,
  useClearTenant,
} from "@/stores/tenantStore";
import { useTenantQuery } from "@/queries/tenantQuery";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const tenantId = useTenantId();
  const setTenantId = useSetTenantId();
  const clearTenant = useClearTenant();
  const { data, isLoading } = useTenantQuery();


  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && data?.data?.personal) {
      const slug = data.data.personal.slug;
      // Only set personal workspace as default if no tenantId is currently stored
      // This prevents overriding user's team selection
      if (slug && !tenantId && !localStorage.getItem("tenantId")) {
        localStorage.setItem("tenantId", slug);
        setTenantId(slug);
      }
    }
  }, [isMounted, data, isLoading, tenantId, setTenantId]);

  const handleLogout = async () => {
    clearTenant();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (!isMounted || isLoading) return null;

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and hamburger (mobile) or workspace switcher (desktop) */}
        <div className="flex items-center space-x-4">
          {/* Logo - visible on mobile */}
          <div className="flex items-center space-x-2 lg:hidden">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Rumsan AI</h1>
          </div>

          {/* Hamburger menu - visible on mobile */}
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>          
        </div>

        {/* Right side - Admin and logout */}
        <div className="flex items-center space-x-4">
          {/* <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700 hidden sm:inline">Admin</span>
          </div> */}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>


    </header>
  );
}
