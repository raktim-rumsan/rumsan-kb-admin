import { ROUTES } from "@/constants";
import { getAuthToken } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toastUtils } from "@/lib/toast-utils";
import type {
  McpServer,
  CreateMcpServerPayload,
  UpdateMcpServerPayload,
} from "@/types/ai";

export function useMcpServersQuery() {
  return useQuery({
    queryKey: ["mcpServers"],
    queryFn: async (): Promise<McpServer[]> => {
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.MCP_SERVERS}`, {
        headers: {
          accept: "application/json",
          access_token: access_token!,
        },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      return data.data as McpServer[];
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
      const res = await fetch(`${ROUTES.MCP_SERVER_BY_SECTOR(sectorName)}`, {
        headers: {
          accept: "application/json",
          access_token: access_token!,
        },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      return data.data;
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
      const res = await fetch(`${ROUTES.MCP_TOOGGLE_SERVER(serverId)}`, {
        method: "PATCH",
        headers: {
          accept: "application/json",
          access_token: access_token!,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      toastUtils.generic.success(data.data.message);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to toggle MCP server";
      toastUtils.generic.error(message);
    },
  });
}

export function useCreateMcpServerMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMcpServerPayload) => {
      const access_token = getAuthToken();

      const res = await fetch(`${ROUTES.MCP_CREATE_SERVER}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: access_token!,
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      queryClient.invalidateQueries({ queryKey: ["mcpServer"] });
      toastUtils.generic.success("MCP server created");
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to create MCP server";
      toastUtils.generic.error(message);
    },
  });
}

export function useUpdateMcpServerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateMcpServerPayload) => {
      const { serverId, ...body } = payload;
      const access_token = getAuthToken();

      const res = await fetch(`${ROUTES.MCP_UPDATE_SERVER(serverId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          access_token: access_token!,
          accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      queryClient.invalidateQueries({ queryKey: ["mcpServer"] });
      toastUtils.generic.success("MCP server updated");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to update MCP server";
      toastUtils.generic.error(message);
    },
  });
}

export function useMCPDeleteMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      serverId: string
    ): Promise<{ success?: boolean } | null> => {
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.MCP_DELETE_SERVER(serverId)}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          access_token: access_token!,
        },
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      queryClient.invalidateQueries({ queryKey: ["mcpServer"] });
      toastUtils.generic.success("MCP server deleted");
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to delete MCP server";
      toastUtils.generic.error(message);
    },
  });
}

export function useToggleMcpToolsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serverId,
      toolId,
      isActive,
    }: {
      serverId: string;
      toolId: string;
      isActive: boolean;
    }) => {
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.MCP_TOOGGLE_TOOL(serverId, toolId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          access_token: access_token!,
        },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      toastUtils.generic.success("MCP Tool toggled successfully");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to toggle MCP tool";
      toastUtils.generic.error(message);
    },
  });
}

export function useSyncMcpServerToolsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      const access_token = getAuthToken();

      const res = await fetch(ROUTES.MCP_SYNC_TOOLS(serverId), {
        method: "POST",
        headers: {
          accept: "application/json",
          access_token: access_token!,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      return data;
    },

    onSuccess: (data) => {
      // Refresh servers + tools list
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      toastUtils.generic.success("Tools synced successfully");
    },

    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to sync tools";
      toastUtils.generic.error(message);
    },
  });
}
