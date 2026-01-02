import API_BASE_URL from "@/constants";
import { getAuthToken } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CreateMcpServerPayload {
  name: string;
  url: string;
  sectorName: string;
  mcpAuthToken: Record<string, string>;
}

// Add MCP server types and queries/mutations
export interface McpServer {
  id: string;
  name: string;
  url: string;
  sectorName?: string;
  mcpAuthToken?: string | Record<string, string>;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useAiToolsQuery() {
  return useQuery({
    queryKey: ["aiTools"],
    queryFn: async () => {
      // Build query string if needed

      // Call local proxy API to avoid CORS issues
      // const res = await fetch(`/api/ai-tools`);
      // const data = await res.json();

      // if (!res.ok) {
      //   throw new Error(data.message || `HTTP ${res.status}`);
      // }
      // Optional: filter or transform the data if needed
      // console.log("Fetched AI Tools data:", data);
      // return data;
      return {
        tools: [
          {
            id: "web_search",
            name: "web_search",
            doc: "Search the web for real-time information",
            sector: "general",
          },
          {
            id: "calculator",
            name: "calculator",
            doc: "Perform mathematical calculations",
            sector: "general",
          },
          {
            id: "code_interpreter",
            name: "code_interpreter",
            doc: "Run and analyze code",
            sector: "developer",
          },
        ],
      }
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });
}


export function useDeleteAiToolMock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (toolId: string) => {
      // mock delay (optional)
      await new Promise((r) => setTimeout(r, 300));
      return toolId;
    },
    onSuccess: (toolId) => {
      queryClient.setQueryData(["aiTools"], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          tools: oldData.tools.filter(
            (tool: any) => tool.id !== toolId
          ),
        };
      });
    },
  });
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

export function useDeleteMcpServerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/mcp-servers/${id}`, {
        method: "DELETE",
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

export function useToggleMcpServerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/mcp-servers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          access_token: access_token || "",
        },
        body: JSON.stringify({ isActive }),
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

// Update create mutation to invalidate mcpServers (instead of aiTools)
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


// This simulates toggling a tool on/off for a workspace
export function useToggleAiToolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toolId,
      workspaceSlug,
      enabled,
    }: {
      toolId: string;
      workspaceSlug?: string;
      enabled: boolean;
    }) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Return the updated tool (mock)
      return { toolId, enabled };
    },
    // Optimistic update: immediately update local query cache
    onMutate: async ({ toolId,  enabled }) => {
      const queryKey = ["aiTools"];
      const previousTools = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) =>
        old?.map((tool: any) =>
          tool.id === toolId ? { ...tool, enabled } : tool
        )
      );

      return { previousTools };
    },
    // If mutation fails, rollback
    onError: (_err, _variables, context: any) => {
      const queryKey = ["aiTools", ];
      queryClient.setQueryData(queryKey, context.previousTools);
    },
    // After mutation, refetch query (optional)
    onSettled: (_data, _error) => {
      queryClient.invalidateQueries({
        queryKey: ["aiTools"],
      });
    },
  });
}
