import API_BASE_URL from "@/constants";
import { getAuthToken } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toastUtils } from "@/lib/toast-utils";

export interface CreateMcpServerPayload {
  name: string;
  url: string;
  sectorName: string;
  authentication: Record<string, string>;
}
export interface UpdateMcpServerPayload  {
  id: string;
  name?: string;
  url?: string;
  sectorName?: string;
  authentication?: Record<string, string>;
};

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
    enabled: !!sectorName,
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
      toastUtils.generic.success('MCP server status changed');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to toggle MCP server';
      toastUtils.generic.error(message);
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
      // Also invalidate sector-specific cache so next edit fetches fresh data
      queryClient.invalidateQueries({ queryKey: ['mcpServer'] });
      toastUtils.generic.success('MCP server created');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to create MCP server';
      toastUtils.generic.error(message);
    },
  });
}

export function useUpdateMcpServerMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateMcpServerPayload) => {
      const access_token = getAuthToken();
      const {id} = payload;

      const res = await fetch(`${API_BASE_URL}/mcp-servers/${id}`, {
        method: 'PUT',
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
      // Ensure any cached sector-specific entries are invalidated so
      // useMcpServerBySectorQuery will refetch next time it's used.
      queryClient.invalidateQueries({ queryKey: ['mcpServer'] });
      toastUtils.generic.success('MCP server updated');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to update MCP server';
      toastUtils.generic.error(message);
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
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      queryClient.invalidateQueries({ queryKey: ["mcpServer"] });
      toastUtils.generic.success('MCP server deleted');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to delete MCP server';
      toastUtils.generic.error(message);
    },
    
  });
}
