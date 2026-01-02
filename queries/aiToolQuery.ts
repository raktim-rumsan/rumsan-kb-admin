import API_BASE_URL from "@/constants";
import { getAuthToken } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CreateMcpServerPayload {
  name: string;
  url: string;
  sectorName: string;
  authentication: Record<string, string>;
}

// Add MCP server types and queries/mutations
export interface McpServer {
  id: string;
  name: string;
  url: string;
  sectorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useMcpServersQuery() {
  return useQuery({
    queryKey: ["mcpServers"],
    queryFn: async (): Promise<McpServer[]> => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/mcp-servers`, {
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      return data?.data ?? [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useMcpServerBySectorQuery(sectorName?: string) {
  console.log(`${API_BASE_URL}/mcp-servers/sector/${sectorName}`,"----------------------------")
  console.log("Using MCP Server Query for sector:", sectorName);
  return useQuery({
    queryKey: ["mcpServer", sectorName],
    queryFn: async () => {
      if (!sectorName) return null;
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/mcp-servers/sector/${sectorName}`, {
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      return data?.data ?? null;
    },
    // enabled: !!sectorName, // only run if sectorName exists
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleMcpServerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serverId: string) => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/mcp-servers/${serverId}`, {
        method: "PATCH",
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
    },
  });
}

export function useCreateMcpServerMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMcpServerPayload) => {
      const access_token = getAuthToken();

      const res = await fetch(`${API_BASE_URL}/mcp-servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
          access_token: access_token || "",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage =
          data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return data; // The created MCP server
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mcpServers'] });
      onSuccess?.();
    },
  });
}

export function useUpdateMcpServerMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMcpServerPayload) => {
      const access_token = getAuthToken();

      const res = await fetch(`${API_BASE_URL}/mcp-servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
          access_token: access_token || "",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage =
          data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return data; // The created MCP server
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mcpServers'] });
      onSuccess?.();
    },
  });
}

export function useMCPDeleteMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/mcp-servers/${serverId}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Handle API error responses properly
        const errorMessage =
          errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      // Return success response (might be empty for DELETE)
      const data = await res.json().catch(() => ({ success: true }));
      return data;
    },
    onSuccess: () => {
      // Invalidate documents query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      onSuccess?.();
    },
  });
}
