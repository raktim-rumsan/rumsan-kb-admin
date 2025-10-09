"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, FolderOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserProfile, useUserLoading } from "@/stores/userStore";
import { useTenantId, useWorkspaceData } from "@/stores/tenantStore";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    title: "My Resources",
    icon: FolderOpen,
    href: "/dashboard/documents",
  },

];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const userProfile = useUserProfile();
  const isLoading = useUserLoading();

  // Get workspace data to determine if this is a personal/demo workspace
  const tenantId = useTenantId();
  const workspaceData = useWorkspaceData();

  // Check if current workspace is personal (demo workspace)
  const isPersonalWorkspace = workspaceData?.personal?.slug === tenantId;

  // Filter navigation items based on workspace type
  const filteredNavigationItems = navigationItems.filter((item) => {
    // Hide "Organization Management" for personal/demo workspaces
    if (item.title === "Organization Management" && isPersonalWorkspace) {
      return false;
    }
    return true;
  });

  // Extract user data with fallbacks
  const getUserDisplayData = () => {
    if (isLoading) {
      return {
        name: "Loading...",
        email: "",
        initials: "...",
      };
    }

    if (!userProfile) {
      return {
        name: "Guest User",
        email: "guest@example.com",
        initials: "GU",
      };
    }

    const name = userProfile.name || userProfile.email?.split("@")[0] || "User";
    const email = userProfile.email || "";
    const initials =
      name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return { name, email, initials };
  };

  const { name, email, initials } = getUserDisplayData();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0", // Always visible on desktop
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0" // Mobile: show when open, Desktop: always show
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Rumsan AI</h1>
                <p className="text-xs text-gray-500">v1.0.0</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavigationItems.map((item) =>
           
                  <Link
                    key={item.title}
                    href={item.href!}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === item.href
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.title}
                  </Link>
              )}
            </nav>
          </ScrollArea>

          {/* User profile */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
