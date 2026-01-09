import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/utils";
import { toastUtils } from "@/lib/toast-utils";

import { ROUTES } from "@/constants";

export function usePromptsQuery() {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.PROMPTS}`, {
        method: "GET",
        headers: {
          access_token: access_token || "",
          accept: "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        // Handle API error responses properly
        const errorMessage =
          data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }
      return data;
    },
  });
}

//write it for a PATCH request to update the prompts
export function useUpdatePromptsMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      systemPrompt?: string;
      workspacePrompt?: string;
    }) => {
      const access_token = getAuthToken();
      const res = await fetch(`${ROUTES.UPDATE_PROMPTS}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          access_token: access_token || "",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage =
          data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toastUtils.generic.success("Prompts updated successfully");
      onSuccess?.();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update prompts";
      toastUtils.generic.error(message);
    },
  });
}
