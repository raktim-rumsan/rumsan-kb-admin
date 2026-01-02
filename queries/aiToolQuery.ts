import { ROUTES } from "@/constants";
import { getAuthToken } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toastUtils } from "@/lib/toast-utils";
import type {
  McpServer,
  CreateMcpServerPayload,
  UpdateMcpServerPayload,
  ApiResponse,
} from "@/types/ai";

export function useMcpServersQuery() {
  return useQuery({
    queryKey: ["mcpServers"],
    queryFn: async (): Promise<McpServer[]> => {
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.MCP_SERVERS}`, {
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });
      const parsed = (await res
        .json()
        .catch(() => ({} as ApiResponse<McpServer[]>))) as ApiResponse<
        McpServer[]
      >;
      if (!res.ok) {
        throw new Error(parsed?.message || `HTTP ${res.status}`);
      }
      return (parsed.data ?? []) as McpServer[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useMcpServerBySectorQuery(sectorName?: string) {
  return useQuery({
    queryKey: ["mcpServer", sectorName],
    queryFn: async (): Promise<McpServer | null> => {
      if (!sectorName) return null;
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.MCP_SERVER_BY_SECTOR(sectorName)}`, {
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });
      const parsed = (await res
        .json()
        .catch(() => ({} as ApiResponse<McpServer>))) as ApiResponse<McpServer>;
      if (!res.ok) {
        throw new Error(parsed?.message || `HTTP ${res.status}`);
      }
      return (parsed.data ?? null) as McpServer | null;
    },
    enabled: !!sectorName,
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleMcpServerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serverId: string): Promise<McpServer | null> => {
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.MCP_TOOGGLE_SERVER(serverId)}`, {
        method: "PATCH",
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });
      const parsed = (await res
        .json()
        .catch(() => ({} as ApiResponse<McpServer>))) as ApiResponse<McpServer>;
      if (!res.ok) {
        throw new Error(parsed?.message || `HTTP ${res.status}`);
      }
      return (parsed.data ?? null) as McpServer | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      toastUtils.generic.success("MCP server status changed");
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
    mutationFn: async (
      payload: CreateMcpServerPayload
    ): Promise<McpServer | null> => {
      const access_token = getAuthToken();

      const res = await fetch(`${ROUTES.MCP_CREATE_SERVER}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: access_token || "",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const parsed = (await res
        .json()
        .catch(() => ({} as ApiResponse<McpServer>))) as ApiResponse<McpServer>;

      if (!res.ok) {
        const errorMessage =
          parsed?.message ||
          parsed?.error ||
          `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return (parsed.data ?? null) as McpServer | null;
    },
    onSuccess: (data) => {
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

export function useUpdateMcpServerMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdateMcpServerPayload
    ): Promise<McpServer | null> => {
      const access_token = getAuthToken();
      const { id: serverId } = payload;

      const res = await fetch(`${ROUTES.MCP_UPDATE_SERVER(serverId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          access_token: access_token || "",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const parsed = (await res
        .json()
        .catch(() => ({} as ApiResponse<McpServer>))) as ApiResponse<McpServer>;

      if (!res.ok) {
        const errorMessage =
          parsed?.message ||
          parsed?.error ||
          `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return (parsed.data ?? null) as McpServer | null;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mcpServers"] });
      queryClient.invalidateQueries({ queryKey: ["mcpServer"] });
      toastUtils.generic.success("MCP server updated");
      onSuccess?.();
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
          access_token: access_token || "",
        },
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({} as ApiResponse<null>));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      // Return success response (might be empty for DELETE)
      const parsed = await res
        .json()
        .catch(() => ({ success: true } as { success?: boolean }));
      return parsed as { success?: boolean } | null;
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
